import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, beforeEach, test } from "node:test";
import {
  authConfigured,
  createSession,
  matchesPassword,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
  verifySession,
} from "../lib/session";

const testPassword = "local-test-password-only";
const testSecret = "local-test-secret-at-least-thirty-two-characters";
const priorPassword = process.env.APP_PASSWORD;
const priorSecret = process.env.SESSION_SECRET;

beforeEach(() => {
  process.env.APP_PASSWORD = testPassword;
  process.env.SESSION_SECRET = testSecret;
});
afterEach(() => {
  if (priorPassword === undefined) delete process.env.APP_PASSWORD;
  else process.env.APP_PASSWORD = priorPassword;
  if (priorSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = priorSecret;
});

function sign(payload: unknown, secret = testSecret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
}

test("session has a signed fixed owner and a seven-day lifetime", (context) => {
  context.mock.method(Date, "now", () => 1_800_000_000_000);
  const token = createSession();
  assert.equal(SESSION_TTL_SECONDS, 604800);
  assert.ok(SESSION_COOKIE_NAME.length > 0);
  assert.equal(verifySession(token)?.userId, "private-workspace");
  assert.deepEqual(JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString()), {
    v: 1, sub: "private-workspace", iat: 1_800_000_000, exp: 1_800_604_800,
  });
});

test("session expires at the expiration second", (context) => {
  let now = 1_800_000_000_000;
  context.mock.method(Date, "now", () => now);
  const token = createSession();
  now += (SESSION_TTL_SECONDS - 1) * 1000;
  assert.ok(verifySession(token));
  now += 1000;
  assert.equal(verifySession(token), null);
});

test("tampered payload, signature, and wrong signing secret are rejected", () => {
  const token = createSession();
  const [payload, signature] = token.split(".");
  const values = JSON.parse(Buffer.from(payload, "base64url").toString());
  const changedPayload = Buffer.from(JSON.stringify({ ...values, sub: "another-owner" })).toString("base64url");
  assert.equal(verifySession(`${changedPayload}.${signature}`), null);
  assert.equal(verifySession(`${payload}.${signature[0] === "A" ? "B" : "A"}${signature.slice(1)}`), null);
  process.env.SESSION_SECRET = "different-secret-at-least-thirty-two-characters";
  assert.equal(verifySession(token), null);
});

test("even signed tokens must use the fixed owner and valid bounded timestamps", (context) => {
  const now = 1_800_000_000;
  context.mock.method(Date, "now", () => now * 1000);
  const payload = { v: 1, sub: "private-workspace", iat: now, exp: now + SESSION_TTL_SECONDS };
  for (const change of [
    { sub: "another-owner" }, { v: 2 }, { exp: now }, { exp: now + SESSION_TTL_SECONDS + 1 },
    { iat: now + 1 }, { iat: now - 1 }, { iat: -1 }, { exp: now + 0.5 }, { extra: "claim" },
  ]) assert.equal(verifySession(sign({ ...payload, ...change })), null);
});

test("malformed tokens fail safely", () => {
  const token = createSession();
  for (const malformed of [null, undefined, "", "garbage", `${token}.extra`, ".", `${token}=`, "a".repeat(2049), sign(null), sign([]), sign({})]) {
    assert.equal(verifySession(malformed), null);
  }
  const invalidJSON = Buffer.from("not json").toString("base64url");
  const signature = createHmac("sha256", testSecret).update(invalidJSON).digest("base64url");
  assert.equal(verifySession(`${invalidJSON}.${signature}`), null);
});

test("password comparison accepts only the complete correct value", () => {
  assert.equal(matchesPassword(testPassword), true);
  for (const password of ["", "wrong", testPassword.slice(1), `${testPassword}extra`, "a".repeat(10000)]) {
    assert.equal(matchesPassword(password), false);
  }
  process.env.APP_PASSWORD = "a-new-valid-password";
  assert.equal(matchesPassword(testPassword), false);
  assert.equal(matchesPassword("a-new-valid-password"), true);
});

test("missing or undersized configuration disables authentication at call time", () => {
  const token = createSession();
  assert.equal(authConfigured(), true);
  for (const [name, invalid] of [["APP_PASSWORD", "short"], ["SESSION_SECRET", "short"], ["APP_PASSWORD", ""], ["SESSION_SECRET", ""]]) {
    process.env.APP_PASSWORD = testPassword;
    process.env.SESSION_SECRET = testSecret;
    process.env[name] = invalid;
    assert.equal(authConfigured(), false);
    assert.throws(() => matchesPassword(testPassword), /^Error: AUTH_UNAVAILABLE$/);
    assert.throws(() => createSession(), /^Error: AUTH_UNAVAILABLE$/);
    assert.equal(verifySession(token), null);
  }
  delete process.env.APP_PASSWORD;
  delete process.env.SESSION_SECRET;
  assert.equal(authConfigured(), false);
});
