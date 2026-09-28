// Small helpers that keep API route handlers tidy:
// - parseJsonBody for JSON request bodies,
// - formatValidationError to surface Zod errors as 422s,
// - jsonError to standardize 401/404/etc. responses.

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HTTPError } from "@/lib/auth";

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HTTPError(400, "Request body must be valid JSON");
  }
}

export function formatZodError(error: ZodError) {
  // Flatten issues into a field -> messages map to mimic FastAPI's
  // 422 response shape (Pydantic-style errors).
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_";
    if (!fieldErrors[path]) fieldErrors[path] = [];
    fieldErrors[path].push(issue.message);
  }
  return {
    detail: "Validation error",
    errors: fieldErrors,
  };
}

export function handleError(err: unknown): NextResponse {
  if (err instanceof HTTPError) {
    const body: Record<string, unknown> = { detail: err.message };
    if (err.detail !== undefined) body.detail = err.detail;
    return NextResponse.json(body, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(formatZodError(err), { status: 422 });
  }
  // Defensive default - never crash the request.
  console.error("Unhandled API error", err);
  return NextResponse.json(
    { detail: "Internal server error" },
    { status: 500 },
  );
}