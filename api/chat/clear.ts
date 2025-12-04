import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearChatHistory } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await clearChatHistory(userId);

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Clear chat history error:', error);
    return res.status(500).json({ error: error.message });
  }
}
