import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDailyBriefing } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, date } = req.query;

    if (!userId || !date || typeof userId !== 'string' || typeof date !== 'string') {
      return res.status(400).json({ error: 'User ID and date are required' });
    }

    const briefing = await getDailyBriefing(userId, date);

    if (!briefing) {
      return res.status(404).json({ error: 'Briefing not found' });
    }

    return res.status(200).json({ success: true, briefing });
  } catch (error: any) {
    console.error('Get briefing error:', error);
    return res.status(500).json({ error: error.message });
  }
}
