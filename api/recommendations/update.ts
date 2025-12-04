import type { VercelRequest, VercelResponse } from '@vercel/node';
import { updateRecommendation } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, recId, updates } = req.body;

    if (!userId || !recId) {
      return res.status(400).json({ error: 'User ID and recommendation ID are required' });
    }

    const updated = await updateRecommendation(userId, recId, updates);

    return res.status(200).json({ success: true, recommendation: updated });
  } catch (error: any) {
    console.error('Update recommendation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
