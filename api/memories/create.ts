import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createMemory, getProfile, upsertProfile } from '../lib/db';
import { analyzeContent, updateUserProfile } from '../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, content, type, timestamp } = req.body;

    if (!userId || !content) {
      return res.status(400).json({ error: 'User ID and content are required' });
    }

    // Analyze content with OpenAI
    const analysis = await analyzeContent(content, type || 'text');

    // Create memory
    const memory = await createMemory(userId, {
      timestamp: timestamp || new Date().toISOString(),
      type: type || 'text',
      content,
      summary: analysis.summary,
      topics: analysis.topics,
      entities: analysis.entities,
      intent: analysis.intent,
    });

    // Update user profile based on new content
    const currentProfile = await getProfile(userId);
    if (currentProfile) {
      const profileUpdates = await updateUserProfile(
        {
          userId,
          name: '',
          location: currentProfile.location,
          summary: currentProfile.summary,
          interests: currentProfile.interests as string[],
          goals: currentProfile.goals as string[],
          concerns: currentProfile.concerns as string[],
          keyFacts: currentProfile.key_facts as string[],
          lastUpdated: currentProfile.last_updated.toISOString(),
        },
        analysis
      );

      await upsertProfile(userId, profileUpdates as any);
    }

    return res.status(200).json({ success: true, memory });
  } catch (error: any) {
    console.error('Create memory error:', error);
    return res.status(500).json({ error: error.message });
  }
}
