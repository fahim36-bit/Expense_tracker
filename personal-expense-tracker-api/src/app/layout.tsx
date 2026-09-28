import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Expense Tracker API",
  description: "Personal expense tracker demo backed by FastAPI-style routes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}