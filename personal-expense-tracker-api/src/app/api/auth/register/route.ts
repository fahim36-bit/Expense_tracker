// POST /auth/register - mirrors the FastAPI endpoint.
// 201 on success, 409 if username or email is taken,
// 422 on validation errors.

import { NextResponse } from "next/server";
import { userRegisterSchema } from "@/lib/schemas";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/crud";
import { hashPassword } from "@/lib/auth";
import { handleError, parseJsonBody } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    const data = userRegisterSchema.parse(body);

    const [existingUsername, existingEmail] = await Promise.all([
      getUserByUsername(data.username),
      getUserByEmail(data.email),
    ]);

    if (existingUsername) {
      return NextResponse.json(
        { detail: "Username already taken" },
        { status: 409 },
      );
    }
    if (existingEmail) {
      return NextResponse.json(
        { detail: "Email already registered" },
        { status: 409 },
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const created = await createUser({
      username: data.username,
      email: data.email,
      hashedPassword,
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: created.id,
          username: created.username,
          email: created.email,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    return handleError(err);
  }
}