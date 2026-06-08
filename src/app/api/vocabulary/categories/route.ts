import { Pool } from "@neondatabase/serverless";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    const result = await pool.query(
      "SELECT * FROM categories ORDER BY name ASC"
    );

    return Response.json(result.rows);
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    await pool.query(
      "INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING",
      [name]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to add category" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();

    await pool.query(
      "DELETE FROM categories WHERE name = $1",
      [name]
    );

    return Response.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}