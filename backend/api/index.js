import 'dotenv/config';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Database connection error:', error);
    if (res.headersSent) return;
    return res.status(500).json({
      success: false,
      message: 'Database unavailable. Check MONGO_URI and Atlas Network Access (0.0.0.0/0).',
    });
  }
}
