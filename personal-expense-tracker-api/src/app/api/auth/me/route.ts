// GET /auth/me - returns the currently authenticated user (used by the UI).

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleError } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}