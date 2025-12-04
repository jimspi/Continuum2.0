import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getRecommendations, createRecommendation, updateRecommendation, deleteRecommendation } from './lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const userId = req.method === 'GET' || req.method === 'DELETE' ? req.query.userId : req.body.userId;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // GET - List recommendations
    if (req.method === 'GET') {
      const recommendations = await getRecommendations(userId);
      return res.status(200).json({ success: true, recommendations });
    }

    // POST - Create or update recommendation
    if (req.method === 'POST') {
      const { action, recommendation, recId, updates } = req.body;

      // Update recommendation
      if (action === 'update') {
        if (!recId) {
          return res.status(400).json({ error: 'Recommendation ID is required' });
        }

        const updated = await updateRecommendation(userId, recId, updates);
        return res.status(200).json({ success: true, recommendation: updated });
      }

      // Create recommendation
      if (!recommendation) {
        return res.status(400).json({ error: 'Recommendation data is required' });
      }

      const newRec = await createRecommendation(userId, recommendation);
      return res.status(200).json({ success: true, recommendation: newRec });
    }

    // DELETE - Delete recommendation
    if (req.method === 'DELETE') {
      const { recId } = req.query;

      if (!recId || typeof recId !== 'string') {
        return res.status(400).json({ error: 'Recommendation ID is required' });
      }

      await deleteRecommendation(userId, recId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Recommendations error:', error);
    return res.status(500).json({ error: error.message });
  }
}
