export default async function handler(req, res) {
  try {
    return res.status(200).json({
      envKeys: Object.keys(process.env).filter(
        (k) => k.includes("DATABASE") || k.includes("POSTGRES")
      ),
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}