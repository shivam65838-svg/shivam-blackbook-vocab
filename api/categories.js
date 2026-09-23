import { Pool } from "@neondatabase/serverless";
import { requireAdmin } from "./_admin-auth.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  const origin = req.headers.origin;
  const allowedOrigins = new Set([
    process.env.WEB_ORIGIN,
    "https://shivam-blackbook-vocab.vercel.app",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ].filter(Boolean));
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM categories ORDER BY name ASC");
      return res.status(200).json(result.rows);
    }

    if (!["GET", "OPTIONS"].includes(req.method) && !requireAdmin(req, res)) return;

    const name = req.body?.name?.toString().trim();
    if (!name) return res.status(400).json({ error: "Category name is required." });

    if (req.method === "POST") {
      await pool.query("INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
      return res.status(201).json({ success: true });
    }

    if (req.method === "DELETE") {
      await pool.query("DELETE FROM categories WHERE name = $1", [name]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error?.message || "Category request failed." });
  }
}
