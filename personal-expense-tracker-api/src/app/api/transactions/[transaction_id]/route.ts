// Single-transaction routes (all require JWT auth):
//   GET    /transactions/:id -> read one
//   PUT    /transactions/:id -> update one (owner only)
//   DELETE /transactions/:id -> delete one (owner only)

import { NextResponse } from "next/server";
import { getCurrentUser, HTTPError } from "@/lib/auth";
import { handleError, parseJsonBody } from "@/lib/http";
import {
  deleteTransactionForOwner,
  getTransactionForOwner,
  updateTransactionForOwner,
} from "@/lib/crud";
import { transactionUpdateSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function parseTransactionId(raw: string): number {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HTTPError(404, "Transaction not found");
  }
  return id;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ transaction_id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { transaction_id } = await context.params;
    const id = parseTransactionId(transaction_id);
    const row = await getTransactionForOwner(user.id, id);
    if (!row) {
      throw new HTTPError(404, "Transaction not found");
    }
    return NextResponse.json(row, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ transaction_id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { transaction_id } = await context.params;
    const id = parseTransactionId(transaction_id);
    const body = await parseJsonBody<unknown>(request);
    const data = transactionUpdateSchema.parse(body);
    const updated = await updateTransactionForOwner(user.id, id, data);
    if (!updated) {
      throw new HTTPError(404, "Transaction not found");
    }
    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ transaction_id: string }> },
) {
  try {
    const user = await getCurrentUser();
    const { transaction_id } = await context.params;
    const id = parseTransactionId(transaction_id);
    const deleted = await deleteTransactionForOwner(user.id, id);
    if (!deleted) {
      throw new HTTPError(404, "Transaction not found");
    }
    return NextResponse.json(
      { message: "Transaction deleted successfully", id: deleted.id },
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}