import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfile, getMemories } from '../lib/db';
import { performAiAction } from '../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, action, prompt } = req.body;

    if (!userId || !action || !prompt) {
      return res.status(400).json({ error: 'User ID, action, and prompt are required' });
    }

    // Get context
    const profile = await getProfile(userId);
    const memories = await getMemories(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Perform AI action
    const result = await performAiAction(
      action,
      prompt,
      {
        userId,
        name: '',
        location: profile.location,
        summary: profile.summary,
        interests: profile.interests as string[],
        goals: profile.goals as string[],
        concerns: profile.concerns as string[],
        keyFacts: profile.key_facts as string[],
        lastUpdated: profile.last_updated.toISOString(),
      },
      memories
    );

    return res.status(200).json({ success: true, result });
  } catch (error: any) {
    console.error('AI action error:', error);
    return res.status(500).json({ error: error.message });
  }
}
