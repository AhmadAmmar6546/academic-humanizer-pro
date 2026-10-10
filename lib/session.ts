import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "academic-humanizer-session";
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const OWNER_ID = "private-workspace";

export type SessionUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

type SessionPayload = {
  v: 1;
  sub: typeof OWNER_ID;
  iat: number;
  exp: number;
};

function credentials() {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (
    !password || Array.from(password).length < 12 ||
    !secret || Array.from(secret).length < 32
  ) return null;
  return { password, secret };
}

export function authConfigured(): boolean {
  return credentials() !== null;
}

function requireCredentials() {
  const configuration = credentials();
  if (!configuration) throw new Error("AUTH_UNAVAILABLE");
  return configuration;
}

export function matchesPassword(input: string): boolean {
  const { password } = requireCredentials();
  if (typeof input !== "string") return false;
  // Hash both inputs first so the comparison always receives equal-size buffers.
  const suppliedDigest = createHash("sha256").update(input, "utf8").digest();
  const expectedDigest = createHash("sha256").update(password, "utf8").digest();
  return timingSafeEqual(suppliedDigest, expectedDigest);
}

export function createSession(): string {
  const { secret } = requireCredentials();
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    v: 1,
    sub: OWNER_ID,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

export function verifySession(token: string | null | undefined): SessionUser | null {
  const configuration = credentials();
  if (!configuration || typeof token !== "string" || token.length > 2048) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encodedPayload, encodedSignature] = parts;
  if (!/^[A-Za-z0-9_-]+$/.test(encodedPayload) || !/^[A-Za-z0-9_-]{43}$/.test(encodedSignature)) {
    return null;
  }

  const payloadBytes = Buffer.from(encodedPayload, "base64url");
  const signature = Buffer.from(encodedSignature, "base64url");
  if (
    payloadBytes.toString("base64url") !== encodedPayload ||
    signature.toString("base64url") !== encodedSignature || signature.length !== 32
  ) return null;
  const expected = createHmac("sha256", configuration.secret).update(encodedPayload).digest();
  if (!timingSafeEqual(signature, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(payloadBytes.toString("utf8"));
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const values = payload as Record<string, unknown>;
  if (
    Object.keys(values).length !== 4 || values.v !== 1 || values.sub !== OWNER_ID ||
    typeof values.iat !== "number" || !Number.isSafeInteger(values.iat) ||
    typeof values.exp !== "number" || !Number.isSafeInteger(values.exp)
  ) return null;
  const now = Math.floor(Date.now() / 1000);
  if (
    values.iat < 0 || values.iat > now || values.exp <= now ||
    values.exp <= values.iat || values.exp - values.iat > SESSION_TTL_SECONDS ||
    values.exp > now + SESSION_TTL_SECONDS
  ) return null;

  return {
    userId: OWNER_ID,
    displayName: "Private workspace",
    email: "",
    fullName: "Private workspace",
  };
}
