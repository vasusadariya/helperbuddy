import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function handleUpdateOrder(req: NextRequest) {
  const currentUTCTime = new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
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

    const body = await req.json();
    const { orderId, status, razorpayPaymentId } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields",
          timestamp: currentUTCTime,
        },
        { status: 400 }
      );
    }

    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true },
    });

    if (!currentOrder) {
      return NextResponse.json(
        {
          success: false,
          error: "Order not found",
          timestamp: currentUTCTime,
        },
        { status: 404 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updateData: { 
        status: 'PENDING' | 'COMPLETED' | 'CANCELLED'; 
        razorpayPaymentId?: string; 
        paidAt?: Date 
      } = { 
        status: status as 'PENDING' | 'COMPLETED' | 'CANCELLED' 
      };

      if (status === "COMPLETED" && razorpayPaymentId) {
        updateData.razorpayPaymentId = razorpayPaymentId;
        updateData.paidAt = new Date();
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: updateData,
      })
      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      data: {
        order: result,
        timestamp: currentUTCTime,
      },
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentUTCTime,
      },
      { status: 500 }
    );
  }
}