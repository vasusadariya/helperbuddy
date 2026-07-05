import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"

// Constants
const DEFAULT_REFERRAL_BONUS_AMOUNT = 100
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

async function getReferralBonusAmount(): Promise<number> {
  const result: { variable_value: number }[] = await prisma.$queryRaw`
    SELECT variable_value FROM system_config
    WHERE variable_name = 'referral'
  `
  return result[0]?.variable_value ?? DEFAULT_REFERRAL_BONUS_AMOUNT
}

// type ReferralResult = {
//   wallet: Wallet
//   transaction: Transaction
// } | null

type WebhookEvent = {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        currency: string;
        status: string;
        error_description?: string;
      };
    };
  };
};

// Helper function to get formatted UTC time
function getCurrentUTCTime(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

// Helper function for retrying operations
async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  operationName = "Database operation"
): Promise<T> {
  const currentUTCTime = getCurrentUTCTime();
  try {
    return await operation();
  } catch (error) {
    console.error(`[${currentUTCTime}] ${operationName} failed:`, error);
    if (retries > 0) {
      console.log(`[${currentUTCTime}] Retrying ${operationName}. Attempts remaining: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(operation, retries - 1, operationName);
    }
    throw error;
  }
}


export async function POST(req: NextRequest) {
  const currentUTCTime = getCurrentUTCTime();

  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const isTestMode = process.env.NODE_ENV === 'development';

    // Signature verification (skip in dev mode)
    if (!isTestMode) {
      if (!signature) {
        console.error(`[${currentUTCTime}] Webhook signature missing`);
        return NextResponse.json({
          success: false,
          error: "No signature provided",
          timestamp: currentUTCTime
        }, { status: 400 });
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        console.error(`[${currentUTCTime}] Invalid webhook signature`);
        return NextResponse.json({
          success: false,
          error: "Invalid signature",
          timestamp: currentUTCTime
        }, { status: 400 });
      }
    }

    const event = JSON.parse(body) as WebhookEvent;
    console.log(`[${currentUTCTime}] Webhook event received:`, {
      event_type: event.event,
      order_id: event.payload?.payment?.entity?.order_id
    });

    if (event.event === "payment.captured") {
      const { id: paymentId, order_id: razorpayOrderId } = event.payload.payment.entity;

      const order = await withRetry(
        () => prisma.order.findUnique({
          where: { razorpayOrderId },
          include: {
            service: true,
            user: {
              include: {
                wallet: true,
                referrer: {
                  include: {
                    wallet: true
                  }
                }
              }
            }
          }
        }),
        MAX_RETRIES,
        "Fetch order for payment processing"
      );

      if (!order) {
        console.error(`[${currentUTCTime}] Order not found: ${razorpayOrderId}`);
        return NextResponse.json({
          success: false,
          error: "Order not found",
          timestamp: currentUTCTime
        }, { status: 404 });
      }

      console.log(`[${currentUTCTime}] Processing payment for order: ${order.id}`);

      const referralBonusAmount = await getReferralBonusAmount();

      const result = await prisma.$transaction(async (tx) => {
        const orderWithUser = await tx.order.findUnique({
          where: { id: order.id },
          include: {
            user: {
              include: {
                wallet: true
              }
            }
          }
        });
        const userWallet = orderWithUser?.user?.wallet;
        const totalAmount = order.amount;
        const walletAmount = order.walletAmount || 0;

        // Process wallet payment if wallet amount was used
        if (userWallet && walletAmount > 0) {
          console.log(`[${currentUTCTime}] Processing wallet payment:`, {
            orderId: order.id,
            walletBalance: userWallet.balance,
            walletAmount,
            totalAmount
          });

          // Update wallet balance
          await tx.wallet.update({
            where: { id: userWallet.id },
            data: {
              balance: { decrement: walletAmount }
            }
          });

          // Create wallet transaction
          await tx.transaction.create({
            data: {
              amount: walletAmount,
              type: "DEBIT",
              description: `Wallet payment for ${order.service.name}`,
              walletId: userWallet.id,
              userId: order.userId,
              orderId: order.id
            }
          });
        }

        // Check if this is user's first completed order
        const previousCompletedOrders = await tx.order.count({
          where: {
            userId: order.userId,
            status: "COMPLETED",
            id: { not: order.id }
          }
        });

        // Process referral bonus if this is the first completed order
        let referralBonus = null;
        if (previousCompletedOrders === 0 && order.user.referrer?.wallet) {
          const referrerWallet = order.user.referrer.wallet;

          // Update referrer's wallet balance
          await tx.wallet.update({
            where: { id: referrerWallet.id },
            data: {
              balance: { increment: referralBonusAmount }
            }
          });

          // Create referral bonus transaction. Note: this is intentionally not
          // linked via orderId — Transaction.orderId is unique and the wallet
          // payment transaction above may already claim that order's slot.
          referralBonus = await tx.transaction.create({
            data: {
              amount: referralBonusAmount,
              type: "REFERRAL_BONUS",
              description: `Referral bonus for ${order.user.name || order.user.email}'s first order (order #${order.id})`,
              walletId: referrerWallet.id,
              userId: order.user.referrer.id,
            }
          });

          console.log(`[${currentUTCTime}] Referral bonus processed:`, {
            referrerId: order.user.referrer.id,
            amount: referralBonusAmount,
            transactionId: referralBonus.id
          });
        }

        // Complete the order
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: "COMPLETED",
            razorpayPaymentId: paymentId,
            paidAt: new Date(currentUTCTime),
            updatedAt: new Date(currentUTCTime)
          }
        });

        return {
          order: updatedOrder,
          walletAmount,
          referralBonus
        };
      });

      console.log(`[${currentUTCTime}] Payment processing completed for order: ${order.id}`);

      return NextResponse.json({
        success: true,
        data: {
          message: "Payment processed successfully",
          order: {
            id: result.order.id,
            status: result.order.status,
            totalAmount: order.amount,
            walletAmount: result.walletAmount,
            remainingAmount: order.remainingAmount,
            service: order.service.name
          },
          timestamp: currentUTCTime,
          ...(result.referralBonus && {
            referralBonus: {
              amount: referralBonusAmount,
              transaction: result.referralBonus
            }
          })
        }
      });
    }

    // Handle other webhook events
    return NextResponse.json({
      success: true,
      message: `Webhook event ${event.event} received but not processed`,
      timestamp: currentUTCTime
    });

  } catch (error) {
    console.error(`[${currentUTCTime}] Webhook processing error:`, error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: currentUTCTime
    }, { status: 500 });
  }
}