import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

export async function POST(req: Request) {
  const currentUTCTime = new Date();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized',
        timestamp: currentUTCTime 
      }, { status: 401 });
    }

    const { orderId } = await req.json();

    // Find the order with user details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        user: {
          email: session.user.email
        }
      },
      include: {
        user: true,
        service: true
      }
    });

    if (!order) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found',
        timestamp: currentUTCTime 
      }, { status: 404 });
    }

    // Check if order is already paid
    if (order.status === 'PAYMENT_COMPLETED' || order.status === 'COMPLETED') {
      return NextResponse.json({ 
        success: false, 
        error: 'Order is already paid',
        timestamp: currentUTCTime 
      }, { status: 400 });
    }

    // Determine final status based on current order status
    const finalStatus = order.status === 'SERVICE_COMPLETED' ? 'COMPLETED' : 'PAYMENT_COMPLETED';

    try {
      const updatedOrder = await prisma.$transaction(async (tx) => {
        // Handle wallet payment if applicable
        if (order.walletAmount > 0) {
          const wallet = await tx.wallet.findUnique({
            where: { userId: order.userId }
          });

          if (!wallet || wallet.balance < order.walletAmount) {
            throw new Error('Insufficient wallet balance');
          }

          // Deduct from wallet
          await tx.wallet.update({
            where: { id: wallet.id },
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
              type: 'DEBIT',
              description: `Wallet payment for order #${order.id}`,
              walletId: wallet.id,
              userId: order.userId,
              orderId: order.id
            }
          });
        }

        // Update order status
        return await tx.order.update({
          where: { id: orderId },
          data: {
            status: finalStatus,
            paymentMode: 'COD',
            paidAt: currentUTCTime,
            updatedAt: currentUTCTime,
            ...(finalStatus === 'COMPLETED' && {
              completedAt: currentUTCTime
            })
          }
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          message: finalStatus === 'COMPLETED' 
            ? 'Order completed with COD payment' 
            : 'COD payment confirmed',
          order: {
            id: updatedOrder.id,
            status: updatedOrder.status,
            amount: updatedOrder.amount,
            walletAmount: updatedOrder.walletAmount,
            remainingAmount: updatedOrder.remainingAmount,
            paidAt: updatedOrder.paidAt,
            completedAt: updatedOrder.completedAt,
            paymentMode: updatedOrder.paymentMode
          },
          timestamp: currentUTCTime
        }
      });

    } catch (txError) {
      console.error('Transaction error:', txError);
      return NextResponse.json({ 
        success: false, 
        error: 'Payment processing failed',
        details: txError instanceof Error ? txError.message : 'Transaction failed',
        timestamp: currentUTCTime 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('COD payment error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process COD payment',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: currentUTCTime 
    }, { status: 500 });
  }
}