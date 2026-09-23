import { Pool } from "@neondatabase/serverless";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const [vocabulary, categories] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM vocabulary"),
      pool.query("SELECT COUNT(*)::int AS count FROM categories"),
    ]);

    return res.status(200).json({
      ok: true,
      vocabularyCount: vocabulary.rows[0]?.count ?? 0,
      categoryCount: categories.rows[0]?.count ?? 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, error: error?.message || "Database connection failed" });
  }
}
