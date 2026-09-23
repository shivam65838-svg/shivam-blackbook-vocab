import crypto from "node:crypto";

const COOKIE_NAME = "sk_vocab_admin";

const sign = (value) =>
  crypto
    .createHmac("sha256", process.env.ADMIN_SESSION_SECRET || process.env.DATABASE_URL || "sk-vocabulary-session")
    .update(value)
    .digest("base64url");

export function getAdminSession(req) {
  const cookies = req.headers.cookie || "";
  const match = cookies.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  const token = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.exp > Math.floor(Date.now() / 1000) ? data : null;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res) {
  if (getAdminSession(req)) return true;
  res.status(401).json({ error: "Admin authentication required." });
  return false;
}
