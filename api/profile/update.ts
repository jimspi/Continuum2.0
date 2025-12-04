import type { VercelRequest, VercelResponse } from '@vercel/node';
import { upsertProfile } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, profile } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updatedProfile = await upsertProfile(userId, profile);

    return res.status(200).json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: error.message });
  }
}
