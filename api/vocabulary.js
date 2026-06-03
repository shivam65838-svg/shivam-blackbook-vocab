import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // GET
    if (req.method === "GET") {
      const result = await pool.query(
        "SELECT * FROM vocabulary ORDER BY created_at DESC"
      );

      return res.status(200).json(result.rows);
    }

    // POST
    if (req.method === "POST") {
      const {
        id,
        word,
        hindi_meaning,
        mnemonic,
        example,
        category,
        difficulty,
        status,
      } = req.body;

      await pool.query(
        `INSERT INTO vocabulary
        (id, word, hindi_meaning, mnemonic, example, category, difficulty, status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          word,
          hindi_meaning,
          mnemonic,
          example,
          category,
          difficulty,
          status,
        ]
      );

      return res.status(200).json({
        success: true,
        message: "Word saved successfully",
      });
    }

    return res.status(405).json({
      error: "Method not allowed",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}