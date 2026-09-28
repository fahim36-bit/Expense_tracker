// test-api.mjs
// Equivalent of test_api.py from the project spec.
// Runs 5 required test cases against the live Next.js API:
//   1. get all transactions
//   2. get specific transaction
//   3. create transaction
//   4. update transaction
//   5. delete transaction
//
// Each test also verifies the documented error-handling behaviour
// (401 for missing/invalid JWT, 404 for unknown IDs, 422 for bad input).
//
// Run: node test-api.mjs
// Requires: BASE_URL env (defaults to http://127.0.0.1:3000)

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";

let passed = 0;
let failed = 0;
const failures = [];

function ok(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    failures.push(message);
    console.log(`  ✗ ${message}`);
  }
}

function assertEqual(actual, expected, message) {
  ok(
    actual === expected,
    `${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`,
  );
}

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

function uniq() {
  return `${Date.now()}${Math.floor(Math.random() * 1e9)}`;
}

async function setupUser() {
  const tag = uniq();
  const username = `testuser_${tag}`;
  const email = `testuser_${tag}@example.com`;
  const password = "secret123";

  const reg = await request("/api/auth/register", {
    method: "POST",
    body: { username, email, password },
  });
  if (reg.status !== 201) {
    throw new Error(`Failed to register user: ${reg.status} ${JSON.stringify(reg.data)}`);
  }
  const login = await request("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
  if (login.status !== 200 || !login.data?.access_token) {
    throw new Error(`Failed to login: ${login.status} ${JSON.stringify(login.data)}`);
  }
  return { username, email, password, token: login.data.access_token };
}

async function testCreateTransaction() {
  console.log("\n[3] POST /transactions — create transaction");
  const user = await setupUser();
  const payload = {
    title: "Groceries",
    amount: 42.5,
    type: "expense",
    category: "Food",
    date: "2024-05-10",
  };
  const created = await request("/api/transactions", {
    method: "POST",
    token: user.token,
    body: payload,
  });
  assertEqual(created.status, 201, "returns 201 Created");
  ok(
    created.data && created.data.id && created.data.owner_id,
    "response includes id and owner_id",
  );
  assertEqual(created.data.title, payload.title, "title echoed");
  assertEqual(created.data.amount, payload.amount, "amount echoed");
  assertEqual(created.data.type, "expense", "type echoed");
  assertEqual(created.data.category, "Food", "category echoed");
  assertEqual(created.data.date, "2024-05-10", "date echoed");

  // Negative path: amount must be positive
  const badAmount = await request("/api/transactions", {
    method: "POST",
    token: user.token,
    body: { ...payload, amount: -5 },
  });
  assertEqual(badAmount.status, 422, "negative amount returns 422");

  // Negative path: invalid type
  const badType = await request("/api/transactions", {
    method: "POST",
    token: user.token,
    body: { ...payload, type: "transfer" },
  });
  assertEqual(badType.status, 422, "invalid type returns 422");

  // Negative path: missing auth
  const noAuth = await request("/api/transactions", {
    method: "POST",
    body: payload,
  });
  assertEqual(noAuth.status, 401, "missing token returns 401");

  return { user, createdId: created.data.id };
}

async function testListTransactions() {
  console.log("\n[1] GET /transactions — list all transactions");
  const user = await setupUser();
  const seed = [
    { title: "Salary", amount: 3000, type: "income", category: "Salary", date: "2024-06-01" },
    { title: "Coffee", amount: 4.5, type: "expense", category: "Food", date: "2024-06-02" },
    { title: "Rent", amount: 1500, type: "expense", category: "Housing", date: "2024-06-03" },
  ];
  for (const tx of seed) {
    await request("/api/transactions", {
      method: "POST",
      token: user.token,
      body: tx,
    });
  }

  const list = await request("/api/transactions", { token: user.token });
  assertEqual(list.status, 200, "returns 200 OK");
  ok(Array.isArray(list.data), "response is an array");
  assertEqual(list.data.length, seed.length, "lists all of the user's transactions");
  ok(
    list.data.every((t) => t.owner_id && seed.some((s) => s.title === t.title)),
    "every listed transaction belongs to the logged-in user",
  );

  // Negative path: no token
  const noAuth = await request("/api/transactions");
  assertEqual(noAuth.status, 401, "missing token returns 401");

  // Negative path: invalid token
  const badToken = await request("/api/transactions", { token: "not.a.real.token" });
  assertEqual(badToken.status, 401, "invalid token returns 401");

  return { user, ids: list.data.map((t) => t.id) };
}

async function testGetOneTransaction() {
  console.log("\n[2] GET /transactions/:id — read single transaction");
  const ctx = await testCreateTransaction();
  const got = await request(`/api/transactions/${ctx.createdId}`, {
    token: ctx.user.token,
  });
  assertEqual(got.status, 200, "returns 200 OK for existing id");
  assertEqual(got.data.id, ctx.createdId, "id matches");
  assertEqual(got.data.title, "Groceries", "title matches");

  const notFound = await request(`/api/transactions/999999`, {
    token: ctx.user.token,
  });
  assertEqual(notFound.status, 404, "returns 404 for unknown id");

  const noAuth = await request(`/api/transactions/${ctx.createdId}`);
  assertEqual(noAuth.status, 401, "returns 401 without token");

  // Cross-user isolation
  const other = await setupUser();
  const leaked = await request(`/api/transactions/${ctx.createdId}`, {
    token: other.token,
  });
  assertEqual(leaked.status, 404, "another user cannot read this transaction");

  return ctx;
}

async function testUpdateTransaction() {
  console.log("\n[4] PUT /transactions/:id — update transaction");
  const ctx = await testCreateTransaction();
  const updates = {
    title: "Groceries (weekly)",
    amount: 55.25,
    type: "expense",
    category: "Food",
    date: "2024-05-11",
  };
  const updated = await request(`/api/transactions/${ctx.createdId}`, {
    method: "PUT",
    token: ctx.user.token,
    body: updates,
  });
  assertEqual(updated.status, 200, "returns 200 OK");
  assertEqual(updated.data.title, updates.title, "title updated");
  assertEqual(updated.data.amount, updates.amount, "amount updated");
  assertEqual(updated.data.date, updates.date, "date updated");

  const notFound = await request(`/api/transactions/999999`, {
    method: "PUT",
    token: ctx.user.token,
    body: { title: "x" },
  });
  assertEqual(notFound.status, 404, "returns 404 for unknown id");

  const other = await setupUser();
  const conflict = await request(`/api/transactions/${ctx.createdId}`, {
    method: "PUT",
    token: other.token,
    body: { title: "hijack" },
  });
  assertEqual(conflict.status, 404, "another user cannot update this transaction");

  // No fields provided
  const empty = await request(`/api/transactions/${ctx.createdId}`, {
    method: "PUT",
    token: ctx.user.token,
    body: {},
  });
  assertEqual(empty.status, 422, "empty payload returns 422");

  return ctx;
}

async function testDeleteTransaction() {
  console.log("\n[5] DELETE /transactions/:id — delete transaction");
  const ctx = await testCreateTransaction();
  const deleted = await request(`/api/transactions/${ctx.createdId}`, {
    method: "DELETE",
    token: ctx.user.token,
  });
  assertEqual(deleted.status, 200, "returns 200 OK");
  ok(deleted.data && deleted.data.message, "response includes confirmation message");

  const verify = await request(`/api/transactions/${ctx.createdId}`, {
    token: ctx.user.token,
  });
  assertEqual(verify.status, 404, "transaction is gone afterwards");

  const secondDelete = await request(`/api/transactions/${ctx.createdId}`, {
    method: "DELETE",
    token: ctx.user.token,
  });
  assertEqual(secondDelete.status, 404, "deleting again returns 404, not crash");

  const noAuth = await request(`/api/transactions/${ctx.createdId}`, {
    method: "DELETE",
  });
  assertEqual(noAuth.status, 401, "returns 401 without token");
}

async function main() {
  console.log(`Running tests against ${BASE}`);
  try {
    await testCreateTransaction();
    await testListTransactions();
    await testGetOneTransaction();
    await testUpdateTransaction();
    await testDeleteTransaction();
  } catch (err) {
    console.error("\nTest harness error:", err);
    process.exit(1);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log("Failures:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

main();