/**
 * 関係者セッション（署名付き Cookie）— Edge Middleware と API で共用
 */

const COOKIE_NAME = "kn_graduate_session";
const SESSION_HOURS = 12;

function getSecret() {
  const s = process.env.KN_AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return "";
  }
  return "dev-kn-auth-secret-change-me";
}

function toBase64Url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(str) {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return toBase64Url(new Uint8Array(sig));
}

export async function createSessionToken() {
  const secret = getSecret();
  if (!secret) throw new Error("KN_AUTH_SECRET is not configured");
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  const payloadB64 = toBase64Url(new TextEncoder().encode(JSON.stringify({ exp, role: "graduate" })));
  const sig = await hmacSign(secret, payloadB64);
  return `${payloadB64}.${sig}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string") return false;
  const secret = getSecret();
  if (!secret) return false;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payloadB64 = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(secret, payloadB64);
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  if (diff !== 0) return false;
  try {
    const json = new TextDecoder().decode(fromBase64Url(payloadB64));
    const payload = JSON.parse(json);
    return typeof payload.exp === "number" && payload.exp > Date.now() && payload.role === "graduate";
  } catch {
    return false;
  }
}

export function buildSessionCookieHeader(token, { secure = true } = {}) {
  const maxAge = SESSION_HOURS * 60 * 60;
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function buildClearCookieHeader({ secure = true } = {}) {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

export function getCookieValue(cookieHeader, name = COOKIE_NAME) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** 公開 PDF（notice-*）以外の assets/pdf とタイムカプセル PDF */
export function isProtectedAssetPath(pathname) {
  if (!pathname) return false;
  if (/^\/assets\/time-capsule[^/]*\.pdf$/i.test(pathname)) return true;
  const m = pathname.match(/^\/assets\/pdf\/([^/]+\.pdf)$/i);
  if (!m) return false;
  const filename = m[1].toLowerCase();
  if (filename.startsWith("notice-")) return false;
  return true;
}

export function normalizeName(s) {
  return (s || "").replace(/\s+/g, "").replace(/　/g, "").toLowerCase();
}

export function normalizeBirth(s) {
  return (s || "").replace(/[^\d]/g, "");
}

function parseEnvList(key, fallback) {
  const raw = process.env[key];
  if (!raw) return fallback.slice();
  return raw
    .split(/[,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function devCredentialFallback() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") {
    return { names: [], births: [] };
  }
  return {
    names: ["佐藤ユウ", "佐藤 ユウ", "さとうゆう", "サトウユウ", "satouyuu", "sato yuu"],
    births: ["20060412", "20060412"],
  };
}

export function getAllowedCredentials() {
  const fb = devCredentialFallback();
  const names = parseEnvList("KN_GRADUATE_NAMES", fb.names);
  const births = parseEnvList("KN_GRADUATE_BIRTHS", fb.births);
  return {
    names: names.map(normalizeName),
    births: births.map(normalizeBirth),
  };
}

export function validateGraduateCredentials(name, birth) {
  const { names, births } = getAllowedCredentials();
  if (!names.length || !births.length) return false;
  const n = normalizeName(name);
  const b = normalizeBirth(birth);
  return names.includes(n) && births.includes(b);
}

export { COOKIE_NAME, SESSION_HOURS };
