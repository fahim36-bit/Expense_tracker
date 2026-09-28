// Transaction collection routes:
//   POST /transactions         -> create a transaction for the current user
//   GET  /transactions         -> list transactions for the current user

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleError, parseJsonBody } from "@/lib/http";
import {
  createTransaction,
  listTransactionsForOwner,
} from "@/lib/crud";
import { transactionCreateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await parseJsonBody<unknown>(request);
    const data = transactionCreateSchema.parse(body);
    const created = await createTransaction(user.id, data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    const rows = await listTransactionsForOwner(user.id);
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}