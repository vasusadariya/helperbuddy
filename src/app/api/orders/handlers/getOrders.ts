import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function handleGetOrders() {
  try {
    const session = await getServerSession(authOptions);
    const currentUTCTime = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

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

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        service: true,
        transaction: true,
        Partner: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        orders,
        timestamp: currentUTCTime,
      },
    });
  } catch (error) {
    const currentUTCTime = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching orders",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: currentUTCTime,
      },
      { status: 500 }
    );
  }
}