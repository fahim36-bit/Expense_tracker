// POST /auth/login - mirrors the FastAPI endpoint.
// Returns {access_token, token_type: "bearer"} on success,
// 401 on invalid credentials, 422 on validation errors.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userLoginSchema } from "@/lib/schemas";
import { getUserByUsername } from "@/lib/crud";
import {
  AUTH_COOKIE_NAME,
  createAccessToken,
  verifyPassword,
} from "@/lib/auth";
import { handleError, parseJsonBody } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    const data = userLoginSchema.parse(body);

    const user = await getUserByUsername(data.username);
    if (!user) {
      return NextResponse.json(
        { detail: "Invalid username or password" },
        { status: 401 },
      );
    }

    const ok = await verifyPassword(data.password, user.hashedPassword);
    if (!ok) {
      return NextResponse.json(
        { detail: "Invalid username or password" },
        { status: 401 },
      );
    }

    const accessToken = await createAccessToken(user.id, user.username);

    // Also stash the token in an httpOnly cookie so the in-app
    // fetch helper can read it without manually setting headers.
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json(
      {
        access_token: accessToken,
        token_type: "bearer",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}