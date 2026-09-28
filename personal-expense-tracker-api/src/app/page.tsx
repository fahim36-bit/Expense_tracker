import { ExpenseTracker } from "@/components/ExpenseTracker";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-10 md:px-10">
      <header className="mx-auto mb-8 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          💸 Personal Expense Tracker
        </h1>
        <p className="mt-2 text-sm text-[var(--text-dim)] md:text-base">
          JWT-secured REST API + UI. Implements all 12 endpoints (auth, CRUD,
          and filtering) defined in the project spec.
        </p>
      </header>
      <ExpenseTracker />
      <footer className="mx-auto mt-10 max-w-6xl text-center text-xs text-[var(--text-dim)]">
        Built with Next.js + Drizzle + PostgreSQL. Implements the FastAPI
        Personal Expense Tracker API specification.
      </footer>
    </main>
  );
}