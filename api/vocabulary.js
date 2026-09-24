import { Pool } from "@neondatabase/serverless";
import { requireAdmin } from "./_admin-auth.js";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const sendJson = (res, status, body) => {
  return res.status(status).json(body);
};

const getQueryValue = (req, name) => {
  const value = req.query?.[name];
  return Array.isArray(value) ? value[0] : value;
};

const hasAdminQuery = (req) =>
  ["admin", "page", "limit", "search", "category", "difficulty", "stats"].some(
    (name) => getQueryValue(req, name) !== undefined
  );

const normalizeAdminItem = (item = {}) => ({
  id: item.id?.toString().trim(),
  word: item.word?.toString().trim() || "",
  hindiMeaning: item.hindi_meaning?.toString().trim() || "",
  mnemonic: item.mnemonic?.toString() || "",
  example: item.example?.toString() || "",
  category: item.category?.toString().trim() || "Vocabulary",
  difficulty: item.difficulty?.toString() || "Medium",
  status: item.status?.toString() || "New",
  created_at: item.created_at,
});

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
      if (hasAdminQuery(req)) {
        if (!requireAdmin(req, res)) return;

        const stats = getQueryValue(req, "stats") === "1";
        if (stats) {
          const [total, difficulties, categories] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS count FROM vocabulary"),
            pool.query(
              `SELECT difficulty, COUNT(*)::int AS count
               FROM vocabulary
               GROUP BY difficulty
               ORDER BY difficulty ASC`
            ),
            pool.query(
              `SELECT COUNT(DISTINCT NULLIF(BTRIM(category), ''))::int AS count
               FROM vocabulary`
            ),
          ]);

          return sendJson(res, 200, {
            total: total.rows[0]?.count ?? 0,
            categories: categories.rows[0]?.count ?? 0,
            difficulties: difficulties.rows,
          });
        }

        const page = Math.max(
          1,
          Number.parseInt(getQueryValue(req, "page") || "1", 10) || 1
        );
        const limit = Math.min(
          100,
          Math.max(
            1,
            Number.parseInt(getQueryValue(req, "limit") || "50", 10) || 50
          )
        );
        const search = (getQueryValue(req, "search") || "").toString().trim();
        const category = (getQueryValue(req, "category") || "").toString().trim();
        const difficulty = (getQueryValue(req, "difficulty") || "").toString().trim();
        const conditions = [];
        const values = [];

        if (search) {
          values.push(`%${search}%`);
          const parameter = `$${values.length}`;
          conditions.push(
            `(word ILIKE ${parameter} OR hindi_meaning ILIKE ${parameter} OR mnemonic ILIKE ${parameter} OR example ILIKE ${parameter})`
          );
        }
        if (category && category !== "All") {
          values.push(category);
          conditions.push(`category = $${values.length}`);
        }
        if (difficulty && difficulty !== "All") {
          values.push(difficulty);
          conditions.push(`difficulty = $${values.length}`);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
        const countResult = await pool.query(
          `SELECT COUNT(*)::int AS count FROM vocabulary ${where}`,
          values
        );
        const total = countResult.rows[0]?.count ?? 0;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const offset = (safePage - 1) * limit;
        const itemsValues = [...values, limit, offset];

        const result = await pool.query(
          `SELECT id, word, hindi_meaning, mnemonic, example, category, difficulty, status, created_at
           FROM vocabulary
           ${where}
           ORDER BY created_at DESC NULLS LAST, id DESC
           LIMIT $${itemsValues.length - 1} OFFSET $${itemsValues.length}`,
          itemsValues
        );

        return sendJson(res, 200, {
          items: result.rows.map(normalizeAdminItem),
          total,
          page: safePage,
          limit,
          totalPages,
        });
      }

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
      if (Array.isArray(body.items)) {
        if (!body.items.length || body.items.length > 500) {
          return sendJson(res, 400, {
            success: false,
            error: "Bulk import must contain between 1 and 500 items.",
          });
        }

        const uniqueItems = Array.from(
          new Map(
            body.items.map((item) => [
              item?.id?.toString().trim(),
              item,
            ])
          ).values()
        );
        const values = [];
        const rows = uniqueItems.map((item) => {
          const itemId = item?.id?.toString().trim();
          const word = item?.word?.toString().trim();
          const hindi = item?.hindi_meaning?.toString().trim();
          if (!itemId || !word || !hindi) return null;
          const start = values.length;
          values.push(
            itemId,
            word,
            hindi,
            item?.mnemonic || "",
            item?.example || "",
            item?.category || "Vocabulary",
            item?.difficulty || "Medium",
            item?.status || "New"
          );
          return `($${start + 1},$${start + 2},$${start + 3},$${start + 4},$${start + 5},$${start + 6},$${start + 7},$${start + 8})`;
        }).filter(Boolean);

        if (!rows.length) {
          return sendJson(res, 400, {
            success: false,
            error: "No valid vocabulary items were provided.",
          });
        }

        const result = await pool.query(
          `INSERT INTO vocabulary
           (id, word, hindi_meaning, mnemonic, example, category, difficulty, status)
           VALUES ${rows.join(",")}
           ON CONFLICT (id) DO NOTHING
           RETURNING id, word, hindi_meaning, mnemonic, example, category, difficulty, status, created_at`,
          values
        );

        return sendJson(res, 201, {
          success: true,
          imported: result.rowCount,
          skipped: uniqueItems.length - result.rowCount,
          items: result.rows.map(normalizeAdminItem),
        });
      }

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
      if (Array.isArray(body.ids) || body.category) {
        const ids = Array.isArray(body.ids)
          ? Array.from(new Set(body.ids.map((value) => value?.toString().trim()).filter(Boolean)))
          : [];
        const category = body.category?.toString().trim();

        if (!ids.length && !category) {
          return sendJson(res, 400, {
            success: false,
            deleted: false,
            error: "At least one vocabulary id or a category is required.",
          });
        }
        if (ids.length > 500) {
          return sendJson(res, 400, {
            success: false,
            deleted: false,
            error: "A bulk delete is limited to 500 selected items.",
          });
        }

        const result = ids.length
          ? await pool.query(
              `DELETE FROM vocabulary
               WHERE id IN (${ids.map((_, index) => `$${index + 1}`).join(",")})
               RETURNING id`,
              ids
            )
          : await pool.query(
              `DELETE FROM vocabulary WHERE category = $1 RETURNING id`,
              [category]
            );

        return sendJson(res, 200, {
          success: true,
          deleted: true,
          deletedCount: result.rowCount,
          deletedIds: result.rows.map((row) => row.id),
        });
      }

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