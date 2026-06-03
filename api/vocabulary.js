
export default async function handler(req, res) {
  try {
    return res.status(200).json({
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      first20chars: process.env.DATABASE_URL?.slice(0, 20) || "missing",
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}