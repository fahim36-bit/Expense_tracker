"use client";

import { useState } from "react";

interface Props {
  onLogin: (input: { username: string; password: string }) => Promise<void>;
  onRegister: (input: {
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  error: string | null;
}

type Mode = "login" | "register";

export function AuthPanel({ onLogin, onRegister, error }: Props) {
  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "login") {
        await onLogin({ username, password });
      } else {
        await onRegister({ username, email, password });
        if (!error) {
          setMode("login");
          setPassword("");
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass p-5">
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"} flex-1`}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"} flex-1`}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={50}
            required
          />
        </div>

        {mode === "register" && (
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        )}

        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={submitting}
        >
          {submitting
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
    </div>
  );
}