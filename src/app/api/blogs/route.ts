import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 9;

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (id) {
      const blog = await prisma.blog.findUnique({
        where: { id, isActive: true },
      });

      if (!blog) return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      return NextResponse.json(blog);
    }

    return NextResponse.json({ error: "Missing blog ID" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request: " +error }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page")) || 1;
  const take = PAGE_SIZE;
  const skip = (page - 1) * take;

  try {
    const results = await prisma.blog.findMany({
      take,
      skip,
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.blog.count({ where: { isActive: true } });

    return NextResponse.json({
      data: results,
      metadata: {
        hasNextPage: skip + take < total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs", data: [], metadata: { hasNextPage: false, totalPages: 1 } },
      { status: 500 }
    );
  }
}
