import { Pool } from "@neondatabase/serverless";
import { requireAdmin } from "./_admin-auth.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sendJson = (res, status, body) => res.status(status).json(body);

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
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const result = await pool.query("SELECT * FROM vocabulary ORDER BY created_at DESC");
      return sendJson(res, 200, result.rows);
    }

    if (!["GET", "OPTIONS"].includes(req.method) && !requireAdmin(req, res)) return;

    const body = req.body || {};
    const id = body.id?.toString().trim();
    if (!id) return sendJson(res, 400, { error: "Vocabulary id is required." });

    if (req.method === "POST") {
      const word = body.word?.toString().trim();
      const hindi = body.hindi_meaning?.toString().trim();
      if (!word || !hindi) return sendJson(res, 400, { error: "Word and Hindi meaning are required." });

      await pool.query(
        `INSERT INTO vocabulary
        (id, word, hindi_meaning, mnemonic, example, category, difficulty, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, word, hindi, body.mnemonic || "", body.example || "", body.category || "Vocabulary", body.difficulty || "Medium", body.status || "New"]
      );
      return sendJson(res, 201, { success: true, message: "Word saved successfully" });
    }

    if (req.method === "PUT") {
      const word = body.word?.toString().trim();
      const hindi = body.hindi_meaning?.toString().trim();
      if (!word || !hindi) return sendJson(res, 400, { error: "Word and Hindi meaning are required." });

      const result = await pool.query(
        `UPDATE vocabulary
         SET word=$1, hindi_meaning=$2, mnemonic=$3, example=$4, category=$5, difficulty=$6, status=$7
         WHERE id=$8`,
        [word, hindi, body.mnemonic || "", body.example || "", body.category || "Vocabulary", body.difficulty || "Medium", body.status || "New", id]
      );
      if (!result.rowCount) return sendJson(res, 404, { error: "Vocabulary item not found." });
      return sendJson(res, 200, { success: true, message: "Word updated successfully" });
    }

    if (req.method === "DELETE") {
      const result = await pool.query("DELETE FROM vocabulary WHERE id = $1", [id]);
      if (!result.rowCount) return sendJson(res, 404, { error: "Vocabulary item not found." });
      return sendJson(res, 200, { success: true, message: "Word deleted successfully" });
    }

    return sendJson(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: error?.message || "Vocabulary request failed." });
  }
}
