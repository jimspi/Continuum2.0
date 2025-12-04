import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteRecommendation } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, recId } = req.query;

    if (!userId || !recId || typeof userId !== 'string' || typeof recId !== 'string') {
      return res.status(400).json({ error: 'User ID and recommendation ID are required' });
    }

    await deleteRecommendation(userId, recId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete recommendation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
