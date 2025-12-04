import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMemories } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const memories = await getMemories(userId);

    return res.status(200).json({ success: true, memories });
  } catch (error: any) {
    console.error('List memories error:', error);
    return res.status(500).json({ error: error.message });
  }
}
