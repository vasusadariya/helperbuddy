import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import crypto from "crypto";

interface VerifyPayload {
  orderId: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}

export async function POST(req: NextRequest) {
  const currentUTCTime = new Date().toISOString().slice(0, 19).replace("T", " ");
  let payload: VerifyPayload;

  try {
    payload = await req.json();
  } catch (error) {
    console.error("Invalid request payload:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request payload" + error,
        timestamp: currentUTCTime,
      },
      { status: 400 }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        timestamp: currentUTCTime,
      },
      { status: 401 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get order with user and wallet details
      const order = await tx.order.findFirst({
        where: {
          id: payload.orderId,
          user: { email: session?.user?.email ?? "" },
        },
        include: {
          service: true,
          user: {
            include: { wallet: true }
          },
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if order is already paid
      if (order.status === "PAYMENT_COMPLETED" || order.status === "COMPLETED") {
        throw new Error("Order is already paid");
      }

       // Determine final status based on current order status
       const finalStatus = order.status === 'SERVICE_COMPLETED' ? 'COMPLETED' : 'PAYMENT_COMPLETED';


      // Handle wallet payment if applicable
      if (order.walletAmount > 0) {
        // Verify current wallet balance
        const currentWallet = await tx.wallet.findUnique({
          where: { id: order.user.wallet?.id }
        });

        if (!currentWallet || currentWallet.balance < order.walletAmount) {
          throw new Error("Insufficient wallet balance");
        }

        // Deduct from wallet
        const updatedWallet = await tx.wallet.update({
          where: { id: currentWallet.id },
          data: {
            balance: {
              decrement: order.walletAmount
            }
          }
        });

        // Create wallet transaction record
        await tx.transaction.create({
          data: {
            amount: order.walletAmount,
            type: "DEBIT",
            description: order.remainingAmount > 0 
              ? `Partial payment for order #${order.id}`
              : `Full payment for order #${order.id}`,
            walletId: currentWallet.id,
            userId: order.userId,
            orderId: order.id
          }
        });

        // If no remaining amount (full wallet payment)
        if (order.remainingAmount === 0) {
          const updatedOrder = await tx.order.update({
            where: { id: order.id },
            data: {
              status: "PAYMENT_COMPLETED",
              paidAt: new Date(currentUTCTime),
              paymentMode: "COD" // Since it's wallet-only payment
            }
          });

          return {
            success: true,
            message: "Payment completed using wallet",
            order: updatedOrder,
            wallet: updatedWallet
          };
        }
      }

      // Handle Razorpay payment for remaining amount
      if (!payload.razorpayPaymentId || !payload.razorpayOrderId || !payload.razorpaySignature) {
        throw new Error("Missing Razorpay payment information");
      }

      // Verify Razorpay signature
      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(payload.razorpayOrderId + "|" + payload.razorpayPaymentId)
        .digest("hex");

      if (generatedSignature !== payload.razorpaySignature) {
        throw new Error("Invalid payment signature");
      }

      // Update order with Razorpay payment details
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: finalStatus,
          razorpayPaymentId: payload.razorpayPaymentId,
          paidAt: new Date(currentUTCTime),
          paymentMode: "ONLINE",
          ...(finalStatus === 'COMPLETED' && {
            completedAt: new Date(currentUTCTime)
          })
        }
      });

      return {
        success: true,
        message: order.walletAmount > 0 
          ? "Payment completed using wallet and online payment"
          : "Payment completed using online payment",
        order: updatedOrder,
        wallet: order.user.wallet
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        message: result.message,
        order: {
          id: result.order.id,
          status: result.order.status,
          amount: result.order.amount,
          walletAmount: result.order.walletAmount,
          remainingAmount: result.order.remainingAmount,
          paidAt: result.order.paidAt,
          paymentMode: result.order.paymentMode
        },
        wallet: result.wallet ? {
          balance: result.wallet.balance
        } : undefined,
        timestamp: currentUTCTime
      }
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentUTCTime
      },
      { status: 500 }
    );
  }
}