import crypto from "node:crypto";

const COOKIE_NAME = "sk_vocab_admin";
const MAX_AGE = 60 * 60 * 8;

const base64url = (value) =>
  Buffer.from(value).toString("base64url");

const getSecret = () =>
  process.env.ADMIN_SESSION_SECRET ||
  process.env.DATABASE_URL ||
  "sk-vocabulary-session";

const sign = (value) =>
  crypto
    .createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");

const createToken = (username) => {
  const payload = base64url(
    JSON.stringify({
      username,
      exp: Math.floor(Date.now() / 1000) + MAX_AGE,
    })
  );

  return `${payload}.${sign(payload)}`;
};

const verifyToken = (token) => {
  if (!token) return null;

  const [payload, signature] = token.split(".");

  if (!payload || !signature) return null;

  if (sign(payload) !== signature) return null;

  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (!data.exp || data.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const getCookie = (req) => {
  const cookies = req.headers.cookie || "";

  const match = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) =>
      part.startsWith(`${COOKIE_NAME}=`)
    );

  if (!match) return "";

  return decodeURIComponent(
    match.slice(COOKIE_NAME.length + 1)
  );
};

const setCors = (req, res) => {
  const origin = req.headers.origin;

  const allowedOrigins = [
    process.env.WEB_ORIGIN,
    "https://shivam-blackbook-vocab.vercel.app",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ].filter(Boolean);

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,DELETE,OPTIONS"
  );
  res.setHeader("Vary", "Origin");
};

export default async function handler(req, res) {
  setCors(req, res);

  res.setHeader(
    "Cache-Control",
    "no-store, max-age=0"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Check current login
  if (req.method === "GET") {
    const session = verifyToken(getCookie(req));

    return res.status(200).json({
      authenticated: Boolean(session),
      username: session?.username || null,
    });
  }

  // Login
  if (req.method === "POST") {
    const username =
      req.body?.username?.toString().trim();

    const password =
      req.body?.password?.toString();

    const expectedUsername =
      process.env.ADMIN_USERNAME || "Shivam";

    const expectedPassword =
      process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return res.status(500).json({
        error:
          "ADMIN_PASSWORD is not configured on the server.",
      });
    }

    const valid =
      username === expectedUsername &&
      password === expectedPassword;

    if (!valid) {
      return res.status(401).json({
        error: "Invalid username or password.",
      });
    }

    const token = createToken(username);

    res.setHeader(
      "Set-Cookie",
      [
        `${COOKIE_NAME}=${encodeURIComponent(token)}`,
        "Path=/",
        `Max-Age=${MAX_AGE}`,
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
      ].join("; ")
    );

    return res.status(200).json({
      authenticated: true,
      username,
    });
  }

  // Logout
  if (req.method === "DELETE") {
    res.setHeader(
      "Set-Cookie",
      [
        `${COOKIE_NAME}=`,
        "Path=/",
        "Max-Age=0",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
      ].join("; ")
    );

    return res.status(200).json({
      authenticated: false,
    });
  }

  return res.status(405).json({
    error: "Method not allowed",
  });
}