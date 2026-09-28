"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type ApiError, type Summary, type Transaction } from "@/lib/api-client";
import { AuthPanel } from "./AuthPanel";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { TransactionFilter } from "./TransactionFilter";
import { SummaryCards } from "./SummaryCards";

export function ExpenseTracker() {
  const [user, setUser] = useState<
    { id: number; username: string; email: string } | null
  >(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    income: 0,
    expense: 0,
    balance: 0,
  });
  const [filterParams, setFilterParams] = useState<URLSearchParams>(
    new URLSearchParams(),
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(
    async (params: URLSearchParams, currentUser: typeof user) => {
      if (!currentUser) {
        setTransactions([]);
        setSummary({ income: 0, expense: 0, balance: 0 });
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const query = params.toString();
        const list = query
          ? await api.filterTransactions(parseFilterParams(params))
          : await api.listTransactions();
        setTransactions(list);
        // Recompute summary from the (possibly filtered) list so the
        // dashboard always reflects what's visible.
        const income = list
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0);
        const expense = list
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0);
        setSummary({ income, expense, balance: income - expense });
      } catch (err) {
        handleApiError(err, setError);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // On mount, see if we're already logged in (cookie).
  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        await loadData(new URLSearchParams(), me);
      } catch {
        setUser(null);
      }
    })();
  }, [loadData]);

  // Reload whenever the filter changes (and we have a user).
  useEffect(() => {
    if (user) {
      void loadData(filterParams, user);
    }
  }, [filterParams, user, loadData]);

  async function handleLogin(input: { username: string; password: string }) {
    setError(null);
    setInfo(null);
    try {
      const res = await api.login(input);
      setUser(res.user);
      setFilterParams(new URLSearchParams());
      await loadData(new URLSearchParams(), res.user);
      setInfo(`Welcome back, ${res.user.username}!`);
    } catch (err) {
      handleApiError(err, setError);
    }
  }

  async function handleRegister(input: {
    username: string;
    email: string;
    password: string;
  }) {
    setError(null);
    setInfo(null);
    try {
      await api.register(input);
      setInfo("Account created! You can now log in.");
    } catch (err) {
      handleApiError(err, setError);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* ignore - we still want to clear local state */
    }
    setUser(null);
    setTransactions([]);
    setSummary({ income: 0, expense: 0, balance: 0 });
    setFilterParams(new URLSearchParams());
    setInfo("Logged out.");
  }

  async function handleCreate(input: {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
  }) {
    if (!user) return;
    setError(null);
    try {
      await api.createTransaction(input);
      await loadData(filterParams, user);
      setInfo("Transaction created.");
    } catch (err) {
      handleApiError(err, setError);
    }
  }

  async function handleUpdate(
    id: number,
    input: {
      title?: string;
      amount?: number;
      type?: "income" | "expense";
      category?: string;
      date?: string;
    },
  ) {
    if (!user) return;
    setError(null);
    try {
      await api.updateTransaction(id, input);
      await loadData(filterParams, user);
      setInfo("Transaction updated.");
    } catch (err) {
      handleApiError(err, setError);
    }
  }

  async function handleDelete(id: number) {
    if (!user) return;
    setError(null);
    try {
      await api.deleteTransaction(id);
      await loadData(filterParams, user);
      setInfo("Transaction deleted.");
    } catch (err) {
      handleApiError(err, setError);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[320px,1fr]">
      <aside className="space-y-6">
        {!user ? (
          <AuthPanel
            onLogin={handleLogin}
            onRegister={handleRegister}
            error={error}
          />
        ) : (
          <div className="glass p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-dim)]">Signed in as</p>
                <p className="text-lg font-semibold">{user.username}</p>
                <p className="text-xs text-[var(--text-dim)]">{user.email}</p>
              </div>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        )}

        {user && (
          <SummaryCards summary={summary} count={transactions.length} />
        )}
      </aside>

      <section className="space-y-6">
        {info && <div className="success-text glass px-4 py-2">{info}</div>}
        {error && <div className="error-text glass px-4 py-2">{error}</div>}

        {user ? (
          <>
            <TransactionForm onSubmit={handleCreate} />
            <TransactionFilter
              onChange={(params: URLSearchParams) => setFilterParams(params)}
              initial={filterParams}
            />
            <TransactionList
              transactions={transactions}
              loading={loading}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          </>
        ) : (
          <div className="glass flex min-h-[280px] items-center justify-center p-10 text-center text-[var(--text-dim)]">
            <p>
              Register or log in to start tracking your income and expenses.
              <br />
              Your token is stored in an httpOnly cookie automatically.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function parseFilterParams(params: URLSearchParams) {
  const out: {
    type?: "income" | "expense";
    category?: string;
    minimum_amount?: number;
    maximum_amount?: number;
  } = {};
  const type = params.get("type");
  if (type === "income" || type === "expense") out.type = type;
  const category = params.get("category");
  if (category) out.category = category;
  const min = params.get("minimum_amount");
  if (min !== null && min !== "") out.minimum_amount = Number(min);
  const max = params.get("maximum_amount");
  if (max !== null && max !== "") out.maximum_amount = Number(max);
  return out;
}

function handleApiError(
  err: unknown,
  setError: (msg: string | null) => void,
) {
  if (err && typeof err === "object" && "status" in err && "message" in err) {
    const apiErr = err as ApiError;
    const fieldSummary = apiErr.fieldErrors
      ? " (" +
        Object.entries(apiErr.fieldErrors)
          .map(([k, v]) => `${k}: ${v.join(", ")}`)
          .join("; ") +
        ")"
      : "";
    setError(`${apiErr.status} — ${apiErr.message}${fieldSummary}`);
  } else {
    setError("Unexpected error");
  }
}