import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const currentUTCTime = new Date("2025-02-17 17:56:28");

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.max(1, Number(searchParams.get("limit")) || 20);

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
          details: "Valid session required",
          timestamp: currentUTCTime,
        },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
          timestamp: currentUTCTime,
        },
        { status: 404 }
      );
    }

    // Get all wallet transactions with more details
    const walletTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id,
      },
      include: {
        Order: {
          select: {
            id: true,
            status: true,
            amount: true,
            walletAmount: true,
            remainingAmount: true,
            paymentMode: true,
            service: {
              select: {
                name: true,
                description: true,
                price: true
              }
            }
          }
        },
        Wallet: {
          select: {
            balance: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get all orders with payments (both Razorpay and Wallet)
    const ordersWithPayments = await prisma.order.findMany({
      where: {
        userId: user.id,
        OR: [
          {
            razorpayPaymentId: {
              not: null
            }
          },
          {
            paymentMode: 'ONLINE'
          }
        ],
        paidAt: {
          not: null
        }
      },
      select: {
        id: true,
        razorpayPaymentId: true,
        remainingAmount: true,
        walletAmount: true,
        amount: true,
        paymentMode: true,
        paidAt: true,
        status: true,
        service: {
          select: {
            name: true,
            description: true,
            price: true
          }
        }
      },
      orderBy: {
        paidAt: 'desc'
      }
    });

    // Transform orders into transaction format with more details
    const paymentTransactions = ordersWithPayments.map(order => ({
      id: order.razorpayPaymentId || `wallet-${order.id}`,
      amount: order.paymentMode === 'ONLINE' ? order.walletAmount : order.remainingAmount,
      type: "DEBIT" as const,
      description: order.paymentMode === 'ONLINE' 
        ? `Wallet payment for order #${order.id}`
        : `Razorpay payment for order #${order.id}`,
      createdAt: order.paidAt!,
      orderId: order.id,
      Order: {
        id: order.id,
        status: order.status,
        amount: order.amount,
        walletAmount: order.walletAmount,
        remainingAmount: order.remainingAmount,
        paymentMode: order.paymentMode,
        service: {
          name: order.service.name,
          description: order.service.description,
          price: order.service.price
        }
      }
    }));

    // Combine and sort all transactions
    const allTransactions = [...walletTransactions, ...paymentTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate some useful statistics (over the full history, not just this page)
    const statistics = {
      totalTransactions: allTransactions.length,
      totalDebited: allTransactions
        .filter(t => t.type === 'DEBIT')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      totalCredited: allTransactions
        .filter(t => t.type === 'CREDIT')
        .reduce((sum, t) => sum + (t.amount || 0), 0),
      walletBalance: walletTransactions[0]?.Wallet?.balance || 0
    };

    const paginatedTransactions = allTransactions.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      data: {
        transactions: paginatedTransactions.map(t => ({
          ...t,
          formattedAmount: `₹${t.amount?.toFixed(2)}`,
          formattedDate: new Date(t.createdAt).toLocaleDateString('en-IN'),
          transactionType: t.type === 'DEBIT' ? 'Payment' : 'Credit',
          paymentMethod: t.Order?.paymentMode || t.type
        })),
        pagination: {
          page,
          limit,
          total: allTransactions.length,
          totalPages: Math.ceil(allTransactions.length / limit)
        },
        statistics,
        timestamp: currentUTCTime,
      }
    });

  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch transactions",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentUTCTime,
      },
      { status: 500 }
    );
  }
}