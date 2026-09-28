// GET /transactions/summary - small convenience summary used by the UI.
// Not required by the spec, but keeps the dashboard useful.

import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { handleError } from "@/lib/http";
import { db } from "@/db";
import { transactions } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const rows = await db
      .select({
        type: transactions.type,
        total: sql<string>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(eq(transactions.ownerId, user.id))
      .groupBy(transactions.type);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of rows) {
      const value = Number(row.total);
      if (row.type === "income") totalIncome = value;
      if (row.type === "expense") totalExpense = value;
    }

    return NextResponse.json(
      {
        income: totalIncome,
        expense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      { status: 200 },
    );
  } catch (err) {
    return handleError(err);
  }
}