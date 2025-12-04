import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeTables } from './lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Add basic authentication - you should set this in environment variables
    const authToken = req.headers.authorization?.replace('Bearer ', '');
    const expectedToken = process.env.INIT_DB_TOKEN || 'changeme';

    if (authToken !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await initializeTables();

    return res.status(200).json({
      success: true,
      message: 'Database tables initialized successfully',
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    return res.status(500).json({
      error: error.message,
      details: 'Failed to initialize database tables',
    });
  }
}
