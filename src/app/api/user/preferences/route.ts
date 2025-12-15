import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Language, Currency } from "@prisma/client";

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { language, currency } = body;

    const updateData: any = {};
    const changes: string[] = [];

    if (language && (language === "AR" || language === "EN")) {
      updateData.language = language as Language;
      changes.push(`language to ${language}`);
    }

    if (currency && (currency === "EGP" || currency === "USD" || currency === "TRY")) {
      updateData.currency = currency as Currency;
      changes.push(`currency to ${currency}`);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
    }

    // Update user preferences
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      preferences: {
        language: user.language,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
