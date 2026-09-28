// Pydantic-equivalent Zod schemas for request/response validation.
// Each schema mirrors the validation rules described in the project spec.

import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters long")
  .max(50, "Username must be at most 50 characters long")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username may only contain letters, numbers and underscores",
  );

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255, "Email must be at most 255 characters long");

export const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters long")
  .max(128, "Password must be at most 128 characters long");

export const userRegisterSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const userLoginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, "Password is required"),
});

export const userResponseSchema = z.object({
  id: z.number().int().positive(),
  username: z.string(),
  email: z.string().email(),
});

// Transaction type must be exactly "income" or "expense"
export const transactionTypeSchema = z.enum(["income", "expense"]);

// Transaction create schema - amount must be a positive number
export const transactionCreateSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters long"),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be a positive number")
    .finite("Amount must be a finite number"),
  type: transactionTypeSchema,
  category: z
    .string()
    .min(1, "Category is required")
    .max(50, "Category must be at most 50 characters long"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Transaction update schema - all fields optional, same per-field constraints
export const transactionUpdateSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title must not be empty")
      .max(200, "Title must be at most 200 characters long")
      .optional(),
    amount: z
      .number({ error: "Amount must be a number" })
      .positive("Amount must be a positive number")
      .finite("Amount must be a finite number")
      .optional(),
    type: transactionTypeSchema.optional(),
    category: z
      .string()
      .min(1, "Category must not be empty")
      .max(50, "Category must be at most 50 characters long")
      .optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

// Transaction response - mirrors SQLAlchemy model fields
export const transactionResponseSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  amount: z.number(),
  type: transactionTypeSchema,
  category: z.string(),
  date: z.string(),
  owner_id: z.number().int().positive(),
});

// Transaction filter query schema for GET /transactions/filter
export const transactionFilterSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    category: z.string().min(1).max(50).optional(),
    minimum_amount: z
      .preprocess(
        (value) => (value === undefined || value === "" ? undefined : Number(value)),
        z.number().nonnegative("minimum_amount must be >= 0"),
      )
      .optional(),
    maximum_amount: z
      .preprocess(
        (value) => (value === undefined || value === "" ? undefined : Number(value)),
        z.number().positive("maximum_amount must be > 0"),
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.minimum_amount === undefined ||
      data.maximum_amount === undefined ||
      data.minimum_amount <= data.maximum_amount,
    {
      message: "minimum_amount must be <= maximum_amount",
      path: ["minimum_amount"],
    },
  );

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionFilterInput = z.infer<typeof transactionFilterSchema>;