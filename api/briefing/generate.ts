import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfile, getMemories, getRecommendations, createDailyBriefing } from '../lib/db';
import { generateDailyBriefing } from '../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, date } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ error: 'User ID and date are required' });
    }

    // Get user data
    const profile = await getProfile(userId);
    const memories = await getMemories(userId);
    const recommendations = await getRecommendations(userId);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Generate briefing with OpenAI
    const briefingData = await generateDailyBriefing(
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
      memories,
      recommendations.map((r: any) => ({
        title: r.title,
        description: r.description,
        category: r.category,
        priority: r.priority,
        actionItems: r.action_items,
      }))
    );

    // Save briefing to database
    const briefing = await createDailyBriefing(userId, {
      date,
      recap: briefingData.recap,
      pending_actions: briefingData.pendingActions,
      recommendations: briefingData.recommendations,
    } as any);

    return res.status(200).json({ success: true, briefing });
  } catch (error: any) {
    console.error('Generate briefing error:', error);
    return res.status(500).json({ error: error.message });
  }
}
