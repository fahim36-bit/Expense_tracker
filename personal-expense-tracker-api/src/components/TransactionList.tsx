"use client";

import { useState } from "react";
import type { Transaction } from "@/lib/api-client";

interface Props {
  transactions: Transaction[];
  loading: boolean;
  onUpdate: (
    id: number,
    input: {
      title?: string;
      amount?: number;
      type?: "income" | "expense";
      category?: string;
      date?: string;
    },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function TransactionList({
  transactions,
  loading,
  onUpdate,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="glass p-5 text-center text-[var(--text-dim)]">
        Loading…
      </div>
    );
  }
  if (transactions.length === 0) {
    return (
      <div className="glass p-5 text-center text-[var(--text-dim)]">
        No transactions yet. Add one above to get started.
      </div>
    );
  }

  return (
    <div className="glass overflow-hidden p-0">
      <div className="border-b border-[var(--border)] px-5 py-3 text-sm text-[var(--text-dim)]">
        Showing {transactions.length} transaction
        {transactions.length === 1 ? "" : "s"}
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {transactions.map((t) => (
          <TransactionRow
            key={t.id}
            transaction={t}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}

interface RowProps {
  transaction: Transaction;
  onUpdate: Props["onUpdate"];
  onDelete: Props["onDelete"];
}

function TransactionRow({ transaction, onUpdate, onDelete }: RowProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(transaction.title);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<"income" | "expense">(transaction.type);
  const [category, setCategory] = useState(transaction.category);
  const [date, setDate] = useState(transaction.date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    setSaving(true);
    try {
      await onUpdate(transaction.id, {
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: category.trim(),
        date,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${transaction.title}"?`)) return;
    await onDelete(transaction.id);
  }

  if (editing) {
    return (
      <li className="space-y-3 p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label">Title</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="select"
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expense")}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              maxLength={50}
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setEditing(false);
              setError(null);
              setTitle(transaction.title);
              setAmount(String(transaction.amount));
              setType(transaction.type);
              setCategory(transaction.category);
              setDate(transaction.date);
            }}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-4 p-5">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`badge ${
              transaction.type === "income" ? "badge-income" : "badge-expense"
            }`}
          >
            {transaction.type}
          </span>
          <p className="truncate font-medium">{transaction.title}</p>
        </div>
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          {transaction.category} • {transaction.date}
        </p>
      </div>
      <div
        className={`text-right font-semibold tabular-nums ${
          transaction.type === "income" ? "text-emerald-300" : "text-red-300"
        }`}
      >
        {transaction.type === "income" ? "+" : "-"}$
        {transaction.amount.toFixed(2)}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </li>
  );
}