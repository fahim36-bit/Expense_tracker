"use client";

import { useEffect, useState } from "react";

interface Props {
  initial: URLSearchParams;
  onChange: (params: URLSearchParams) => void;
}

export function TransactionFilter({ initial, onChange }: Props) {
  const [type, setType] = useState<string>(initial.get("type") ?? "");
  const [category, setCategory] = useState<string>(initial.get("category") ?? "");
  const [minAmount, setMinAmount] = useState<string>(
    initial.get("minimum_amount") ?? "",
  );
  const [maxAmount, setMaxAmount] = useState<string>(
    initial.get("maximum_amount") ?? "",
  );

  // Debounce push to parent so users can finish typing first.
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (category.trim()) params.set("category", category.trim());
      if (minAmount !== "") params.set("minimum_amount", minAmount);
      if (maxAmount !== "") params.set("maximum_amount", maxAmount);
      onChange(params);
    }, 250);
    return () => clearTimeout(t);
  }, [type, category, minAmount, maxAmount, onChange]);

  function reset() {
    setType("");
    setCategory("");
    setMinAmount("");
    setMaxAmount("");
  }

  return (
    <div className="glass space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filter transactions</h2>
        <button type="button" className="btn btn-ghost" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="label" htmlFor="f-type">
            Type
          </label>
          <select
            id="f-type"
            className="select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="f-category">
            Category
          </label>
          <input
            id="f-category"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Food"
          />
        </div>
        <div>
          <label className="label" htmlFor="f-min">
            Min amount
          </label>
          <input
            id="f-min"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="input"
            value={minAmount}
            onChange={(e) => setMinAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div>
          <label className="label" htmlFor="f-max">
            Max amount
          </label>
          <input
            id="f-max"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            className="input"
            value={maxAmount}
            onChange={(e) => setMaxAmount(e.target.value)}
            placeholder="∞"
          />
        </div>
      </div>
    </div>
  );
}