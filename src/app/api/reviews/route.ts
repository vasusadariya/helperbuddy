// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId, rating, description } = await req.json();

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Verify order belongs to user and is completed
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        user: {
          email: session.user.email
        },
        status: "COMPLETED"
      },
      include: {
        review: true // Include to check if review exists
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or not eligible for review" },
        { status: 404 }
      );
    }

    // Check if review already exists
    if (order.review) {
      return NextResponse.json({ 
        success: false,
        error: "Review already exists for this order",
      }, { status: 400 });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        orderId,
        rating,
        description: description || ""
      }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Review creation error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {

    const reviews = await prisma.review.findMany({
      where: {
        rating: 5,
      },
      include: {
        Order: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10, // Limit to 10 most recent reviews
    });

    const formattedReviews = reviews.map((review) => ({
      name: review.Order.user.name,
      rating: review.rating,
      review: review.description || "",
    }));

    return NextResponse.json(formattedReviews);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" +error },
      { status: 500 }
    );

  }
}