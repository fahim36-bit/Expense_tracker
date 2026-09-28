import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  date,
  numeric,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums mirror Python str type with allowed values
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
]);

// Users table - matches the User model requirements
export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    email: text("email").notNull(),
    hashedPassword: text("hashed_password").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    usernameIdx: uniqueIndex("users_username_idx").on(table.username),
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
  }),
);

// Transactions table - matches the Transaction model requirements
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  // numeric(14,2) safely stores positive amounts up to 999,999,999,999.99
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  category: text("category").notNull(),
  date: date("date").notNull(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;