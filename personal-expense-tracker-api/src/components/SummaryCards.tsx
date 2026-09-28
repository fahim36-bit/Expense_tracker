"use client";

import type { Summary } from "@/lib/api-client";

interface Props {
  summary: Summary;
  count: number;
}

export function SummaryCards({ summary, count }: Props) {
  return (
    <div className="space-y-4">
      <div className="glass p-4">
        <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">
          Balance
        </p>
        <p
          className={`mt-1 text-2xl font-bold tabular-nums ${
            summary.balance >= 0 ? "text-emerald-300" : "text-red-300"
          }`}
        >
          ${summary.balance.toFixed(2)}
        </p>
        <p className="mt-1 text-xs text-[var(--text-dim)]">
          {count} transaction{count === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="glass p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">
            Income
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-300 tabular-nums">
            +${summary.income.toFixed(2)}
          </p>
        </div>
        <div className="glass p-4">
          <p className="text-xs uppercase tracking-wide text-[var(--text-dim)]">
            Expenses
          </p>
          <p className="mt-1 text-lg font-semibold text-red-300 tabular-nums">
            -${summary.expense.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}