import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createRecommendation } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, recommendation } = req.body;

    if (!userId || !recommendation) {
      return res.status(400).json({ error: 'User ID and recommendation are required' });
    }

    const newRec = await createRecommendation(userId, recommendation);

    return res.status(200).json({ success: true, recommendation: newRec });
  } catch (error: any) {
    console.error('Create recommendation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
