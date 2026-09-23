import { Pool } from "@neondatabase/serverless";
import { requireAdmin } from "./_admin-auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sendJson = (res, status, body) => {
  return res.status(status).json(body);
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // -----------------------------
  // CORS
  // -----------------------------
  const origin = req.headers.origin;

  const allowedOrigins = new Set(
    [
      process.env.WEB_ORIGIN,
      "https://shivam-blackbook-vocab.vercel.app",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
    ].filter(Boolean)
  );

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // -----------------------------
  // OPTIONS
  // -----------------------------
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // =========================================================
    // GET — Get all vocabulary
    // =========================================================
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT * FROM vocabulary ORDER BY created_at DESC"
      );

      return sendJson(res, 200, result.rows);
    }

    // =========================================================
    // All write operations require admin authentication
    // =========================================================
    if (!["GET", "OPTIONS"].includes(req.method)) {
      if (!requireAdmin(req, res)) {
        return;
      }
    }

    const body = req.body || {};

    const id =
      body.id !== undefined && body.id !== null
        ? body.id.toString().trim()
        : "";

    // =========================================================
    // POST — Add vocabulary
    // =========================================================
    if (req.method === "POST") {
      if (!id) {
        return sendJson(res, 400, {
          success: false,
          error: "Vocabulary id is required.",
        });
      }

      const word = body.word?.toString().trim();
      const hindi = body.hindi_meaning?.toString().trim();

      if (!word || !hindi) {
        return sendJson(res, 400, {
          success: false,
          error: "Word and Hindi meaning are required.",
        });
      }

      // Prevent accidental duplicate ID.
      const existing = await pool.query(
        "SELECT id FROM vocabulary WHERE id = $1",
        [id]
      );

      if (existing.rowCount > 0) {
        return sendJson(res, 409, {
          success: false,
          error: "A vocabulary item with this id already exists.",
          id,
        });
      }

      const result = await pool.query(
        `INSERT INTO vocabulary
        (
          id,
          word,
          hindi_meaning,
          mnemonic,
          example,
          category,
          difficulty,
          status
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *`,
        [
          id,
          word,
          hindi,
          body.mnemonic || "",
          body.example || "",
          body.category || "Vocabulary",
          body.difficulty || "Medium",
          body.status || "New",
        ]
      );

      return sendJson(res, 201, {
        success: true,
        message: "Word saved successfully.",
        item: result.rows[0],
      });
    }

    // =========================================================
    // PUT — Update vocabulary
    // =========================================================
    if (req.method === "PUT") {
      if (!id) {
        return sendJson(res, 400, {
          success: false,
          error: "Vocabulary id is required.",
        });
      }

      const word = body.word?.toString().trim();
      const hindi = body.hindi_meaning?.toString().trim();

      if (!word || !hindi) {
        return sendJson(res, 400, {
          success: false,
          error: "Word and Hindi meaning are required.",
        });
      }

      const existing = await pool.query(
        "SELECT id FROM vocabulary WHERE id = $1",
        [id]
      );

      if (!existing.rowCount) {
        return sendJson(res, 404, {
          success: false,
          error: "Vocabulary item not found.",
          id,
        });
      }

      const result = await pool.query(
        `UPDATE vocabulary
         SET
           word = $1,
           hindi_meaning = $2,
           mnemonic = $3,
           example = $4,
           category = $5,
           difficulty = $6,
           status = $7
         WHERE id = $8
         RETURNING *`,
        [
          word,
          hindi,
          body.mnemonic || "",
          body.example || "",
          body.category || "Vocabulary",
          body.difficulty || "Medium",
          body.status || "New",
          id,
        ]
      );

      if (!result.rowCount) {
        return sendJson(res, 500, {
          success: false,
          error: "Vocabulary update failed.",
          id,
        });
      }

      return sendJson(res, 200, {
        success: true,
        message: "Word updated successfully.",
        item: result.rows[0],
      });
    }

    // =========================================================
    // DELETE — Delete EXACT vocabulary item
    // =========================================================
    if (req.method === "DELETE") {
      if (!id) {
        return sendJson(res, 400, {
          success: false,
          error: "Vocabulary id is required.",
        });
      }

      // -------------------------------------------------------
      // STEP 1: Check exact item before deleting
      // -------------------------------------------------------
      const before = await pool.query(
        `SELECT id, word
         FROM vocabulary
         WHERE id = $1`,
        [id]
      );

      if (!before.rowCount) {
        return sendJson(res, 404, {
          success: false,
          deleted: false,
          error: "Vocabulary item not found.",
          id,
        });
      }

      const item = before.rows[0];

      // -------------------------------------------------------
      // STEP 2: Delete exact database row
      // -------------------------------------------------------
      const deleted = await pool.query(
        `DELETE FROM vocabulary
         WHERE id = $1
         RETURNING id, word`,
        [id]
      );

      if (!deleted.rowCount) {
        return sendJson(res, 500, {
          success: false,
          deleted: false,
          error: "Delete operation failed.",
          id,
          word: item.word,
        });
      }

      // -------------------------------------------------------
      // STEP 3: Verify that the row is really gone
      // -------------------------------------------------------
      const verify = await pool.query(
        `SELECT id
         FROM vocabulary
         WHERE id = $1`,
        [id]
      );

      if (verify.rowCount > 0) {
        return sendJson(res, 500, {
          success: false,
          deleted: false,
          error:
            "Delete verification failed. The vocabulary item is still in the database.",
          id,
          word: item.word,
        });
      }

      // -------------------------------------------------------
      // STEP 4: Confirm successful deletion
      // -------------------------------------------------------
      return sendJson(res, 200, {
        success: true,
        deleted: true,
        id: deleted.rows[0].id,
        word: deleted.rows[0].word,
        message: `"${deleted.rows[0].word}" deleted successfully.`,
      });
    }

    // =========================================================
    // Unsupported method
    // =========================================================
    return sendJson(res, 405, {
      success: false,
      error: "Method not allowed.",
    });
  } catch (error) {
    console.error("VOCABULARY API ERROR:", error);

    return sendJson(res, 500, {
      success: false,
      error: error?.message || "Vocabulary request failed.",
    });
  }
}