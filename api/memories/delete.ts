import type { VercelRequest, VercelResponse } from '@vercel/node';
import { deleteMemory } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, memoryId } = req.query;

    if (!userId || !memoryId || typeof userId !== 'string' || typeof memoryId !== 'string') {
      return res.status(400).json({ error: 'User ID and Memory ID are required' });
    }

    await deleteMemory(userId, memoryId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete memory error:', error);
    return res.status(500).json({ error: error.message });
  }
}
