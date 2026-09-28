// Thin client-side API helper. Keeps all fetch logic out of UI
// components and centralizes error formatting.

import type {
  TransactionCreateInput,
  TransactionFilterInput,
  TransactionUpdateInput,
} from "@/lib/schemas";

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  owner_id: number;
}

export interface Summary {
  income: number;
  expense: number;
  balance: number;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

async function request<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const headers = new Headers(init?.headers);
  let body = init?.body;
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }
  const res = await fetch(path, { ...init, headers, body, cache: "no-store" });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message:
        (data && typeof data === "object" && (data.detail || data.message)) ||
        `Request failed with status ${res.status}`,
      fieldErrors:
        data && typeof data === "object" && data.errors
          ? (data.errors as Record<string, string[]>)
          : undefined,
    };
    throw err;
  }
  return data as T;
}

export const api = {
  register: (input: { username: string; email: string; password: string }) =>
    request<{ message: string; user: { id: number; username: string; email: string } }>(
      "/api/auth/register",
      { method: "POST", json: input },
    ),
  login: (input: { username: string; password: string }) =>
    request<{
      access_token: string;
      token_type: "bearer";
      user: { id: number; username: string; email: string };
    }>("/api/auth/login", { method: "POST", json: input }),
  logout: () => request<{ message: string }>("/api/auth/logout", { method: "POST" }),
  me: () =>
    request<{ id: number; username: string; email: string }>("/api/auth/me"),
  listTransactions: () => request<Transaction[]>("/api/transactions"),
  createTransaction: (input: TransactionCreateInput) =>
    request<Transaction>("/api/transactions", { method: "POST", json: input }),
  getTransaction: (id: number) =>
    request<Transaction>(`/api/transactions/${id}`),
  updateTransaction: (id: number, input: TransactionUpdateInput) =>
    request<Transaction>(`/api/transactions/${id}`, {
      method: "PUT",
      json: input,
    }),
  deleteTransaction: (id: number) =>
    request<{ message: string; id: number }>(`/api/transactions/${id}`, {
      method: "DELETE",
    }),
  filterTransactions: (filter: TransactionFilterInput) => {
    const params = new URLSearchParams();
    if (filter.type) params.set("type", filter.type);
    if (filter.category) params.set("category", filter.category);
    if (filter.minimum_amount !== undefined) {
      params.set("minimum_amount", String(filter.minimum_amount));
    }
    if (filter.maximum_amount !== undefined) {
      params.set("maximum_amount", String(filter.maximum_amount));
    }
    const qs = params.toString();
    return request<Transaction[]>(
      `/api/transactions/filter${qs ? `?${qs}` : ""}`,
    );
  },
  summary: () => request<Summary>("/api/transactions/summary"),
};