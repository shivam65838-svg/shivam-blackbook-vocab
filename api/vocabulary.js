import { Pool } from "@neondatabase/serverless";
console.log("DATABASE_URL EXISTS =", !!process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

console.log("DATABASE_URL EXISTS =", !!process.env.DATABASE_URL);
console.log("API VERSION 2");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const result = await pool.query(
        "SELECT * FROM vocabulary ORDER BY created_at DESC"
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === "POST") {
    try {
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

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}