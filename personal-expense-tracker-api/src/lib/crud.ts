// CRUD layer (mirrors crud.py).
// All database access for users and transactions lives here so the
// API route handlers stay thin and the rules from the spec are
// enforced in one place.

import { and, asc, eq, gte, lte, SQL } from "drizzle-orm";
import { db } from "@/db";
import { transactions, users, type Transaction } from "@/db/schema";
import type {
  TransactionCreateInput,
  TransactionFilterInput,
  TransactionUpdateInput,
} from "@/lib/schemas";

// ---------- Users ----------

export async function getUserByUsername(username: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return user ?? null;
}

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function createUser(data: {
  username: string;
  email: string;
  hashedPassword: string;
}) {
  const [created] = await db
    .insert(users)
    .values({
      username: data.username,
      email: data.email,
      hashedPassword: data.hashedPassword,
    })
    .returning();
  return created;
}

// ---------- Transactions ----------

function serializeTransaction(row: Transaction) {
  // Drizzle's pg-core `date` returns a string in YYYY-MM-DD format.
  const rawDate = row.date as unknown;
  const dateString =
    rawDate instanceof Date
      ? rawDate.toISOString().slice(0, 10)
      : String(rawDate);
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: dateString,
    owner_id: row.ownerId,
  };
}

export async function createTransaction(
  ownerId: number,
  input: TransactionCreateInput,
) {
  const [created] = await db
    .insert(transactions)
    .values({
      title: input.title,
      amount: String(input.amount),
      type: input.type,
      category: input.category,
      date: input.date,
      ownerId,
    })
    .returning();
  return serializeTransaction(created);
}

export async function listTransactionsForOwner(ownerId: number) {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.ownerId, ownerId))
    .orderBy(asc(transactions.date), asc(transactions.id));
  return rows.map(serializeTransaction);
}

export async function getTransactionForOwner(
  ownerId: number,
  transactionId: number,
) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.ownerId, ownerId)),
    )
    .limit(1);
  return row ? serializeTransaction(row) : null;
}

export async function updateTransactionForOwner(
  ownerId: number,
  transactionId: number,
  input: TransactionUpdateInput,
) {
  // First confirm the transaction belongs to the caller so we can
  // return the same 404 message regardless of whether the row is
  // missing or owned by someone else.
  const existing = await getTransactionForOwner(ownerId, transactionId);
  if (!existing) return null;

  const updateValues: Record<string, unknown> = { updatedAt: new Date() };
  if (input.title !== undefined) updateValues.title = input.title;
  if (input.amount !== undefined) updateValues.amount = String(input.amount);
  if (input.type !== undefined) updateValues.type = input.type;
  if (input.category !== undefined) updateValues.category = input.category;
  if (input.date !== undefined) updateValues.date = input.date;

  const [updated] = await db
    .update(transactions)
    .set(updateValues)
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.ownerId, ownerId)),
    )
    .returning();
  return updated ? serializeTransaction(updated) : null;
}

export async function deleteTransactionForOwner(
  ownerId: number,
  transactionId: number,
) {
  const [deleted] = await db
    .delete(transactions)
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.ownerId, ownerId)),
    )
    .returning({ id: transactions.id });
  return deleted ?? null;
}

export async function filterTransactionsForOwner(
  ownerId: number,
  filter: TransactionFilterInput,
) {
  const conditions: SQL[] = [eq(transactions.ownerId, ownerId)];

  if (filter.type) {
    conditions.push(eq(transactions.type, filter.type));
  }
  if (filter.category) {
    conditions.push(eq(transactions.category, filter.category));
  }
  if (filter.minimum_amount !== undefined) {
    conditions.push(gte(transactions.amount, String(filter.minimum_amount)));
  }
  if (filter.maximum_amount !== undefined) {
    conditions.push(lte(transactions.amount, String(filter.maximum_amount)));
  }

  const rows = await db
    .select()
    .from(transactions)
    .where(and(...conditions))
    .orderBy(asc(transactions.date), asc(transactions.id));
  return rows.map(serializeTransaction);
}