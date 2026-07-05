import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pincodeId } = await context.params;

    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const partner = await prisma.partner.findUnique({
      where: { email: session.user.email },
    });

    if (!partner) {
      return NextResponse.json(
        { success: false, error: "Partner not found" },
        { status: 404 }
      );
    }

    // Verify the pincode belongs to the partner
    const pincode = await prisma.partnerPincode.findFirst({
      where: {
        id: pincodeId,
        partnerId: partner.id,
      },
    });

    if (!pincode) {
      return NextResponse.json(
        { success: false, error: "Pincode not found" },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.partnerPincode.update({
      where: { id: pincodeId },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing pincode:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}