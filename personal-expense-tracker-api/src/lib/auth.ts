// Authentication helpers - mirrors auth.py from the FastAPI spec.
// Provides password hashing (bcrypt), JWT issue/decode, and a
// helper that resolves a request's Authorization header to the
// authenticated user or throws an HTTP 401.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ||
    "dev-only-change-me-please-set-JWT_SECRET-in-production-environment",
);
const TOKEN_LIFETIME_SECONDS = 60 * 60 * 24; // 24 hours
export const AUTH_COOKIE_NAME = "expense_tracker_token";

export interface TokenPayload extends JWTPayload {
  sub: string;
  username: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(
  plain: string,
  hashed: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

export async function createAccessToken(
  userId: number,
  username: string,
): Promise<string> {
  return new SignJWT({ sub: String(userId), username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_LIFETIME_SECONDS}s`)
    .sign(SECRET);
}

export async function decodeAccessToken(
  token: string,
): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export class HTTPError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = "HTTPError";
  }
}

function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export async function getCurrentUser(): Promise<User> {
  // 1. Try the Authorization header (preferred for API clients).
  const headerList = await headers();
  const bearer = extractBearerToken(headerList.get("authorization"));
  let token: string | null = bearer;

  // 2. Fall back to the auth cookie for the in-app fetch helper.
  if (!token) {
    const cookieStore = await cookies();
    const cookieValue = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    token = cookieValue ?? null;
  }

  if (!token) {
    throw new HTTPError(401, "Not authenticated");
  }

  const payload = await decodeAccessToken(token);
  if (!payload || !payload.sub) {
    throw new HTTPError(401, "Invalid or expired token");
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw new HTTPError(401, "Invalid token subject");
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId));
  if (!user) {
    throw new HTTPError(401, "User no longer exists");
  }
  return user;
}