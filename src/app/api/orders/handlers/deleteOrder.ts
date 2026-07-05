import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export async function handleDeleteOrder(req: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: "Order id is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.delete({
      where: {
        id: orderId,
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Error deleting order' },
      { status: 500 }
    );
  }
}