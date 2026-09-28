"use client";

import { useState } from "react";

interface Props {
  onSubmit: (input: {
    title: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    date: string;
  }) => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(today());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be a positive number");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: category.trim(),
        date,
      });
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(today());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Add transaction</h2>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label" htmlFor="t-title">
            Title
          </label>
          <input
            id="t-title"
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Groceries from Trader Joe's"
            maxLength={200}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="t-amount">
            Amount
          </label>
          <input
            id="t-amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="t-type">
            Type
          </label>
          <select
            id="t-type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value as "income" | "expense")}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div>
          <label className="label" htmlFor="t-category">
            Category
          </label>
          <input
            id="t-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Food, Salary, Rent"
            maxLength={50}
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="t-date">
            Date
          </label>
          <input
            id="t-date"
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Add transaction"}
        </button>
      </div>
    </form>
  );
}