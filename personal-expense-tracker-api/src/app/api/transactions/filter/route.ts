// GET /transactions/filter - all query params optional.
// Supports type, category, minimum_amount, maximum_amount.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { filterTransactionsForOwner } from "@/lib/crud";
import { transactionFilterSchema } from "@/lib/schemas";

export const dynamic = "force-dynamic";

function readQueryValue(
  source: URLSearchParams,
  key: string,
): string | undefined {
  const value = source.get(key);
  return value === null || value === "" ? undefined : value;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    const url = new URL(request.url);
    const params = url.searchParams;

    const raw = {
      type: readQueryValue(params, "type"),
      category: readQueryValue(params, "category"),
      minimum_amount: readQueryValue(params, "minimum_amount"),
      maximum_amount: readQueryValue(params, "maximum_amount"),
    };

    const filter = transactionFilterSchema.parse(raw);
    const rows = await filterTransactionsForOwner(user.id, filter);
    return NextResponse.json(rows, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}