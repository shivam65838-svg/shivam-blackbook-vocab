import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM vocabulary ORDER BY created_at DESC"
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to fetch vocabulary" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      id,
      word,
      hindi_meaning,
      mnemonic,
      example,
      category,
      difficulty,
      status,
    } = body;

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

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to save vocabulary" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    await pool.query(
      "UPDATE vocabulary SET status = $1 WHERE id = $2",
      [status, id]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to update vocabulary" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    await pool.query(
      "DELETE FROM vocabulary WHERE id = $1",
      [id]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to delete vocabulary" },
      { status: 500 }
    );
  }
}