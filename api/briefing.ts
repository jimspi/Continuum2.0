import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDailyBriefing, createDailyBriefing, getProfile, getMemories, getRecommendations } from './lib/db.js';
import { generateDailyBriefing } from './lib/openai.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET - Get briefing
    if (req.method === 'GET') {
      const { userId, date } = req.query;

      if (!userId || !date || typeof userId !== 'string' || typeof date !== 'string') {
        return res.status(400).json({ error: 'User ID and date are required' });
      }

      const briefing = await getDailyBriefing(userId, date);

      if (!briefing) {
        return res.status(404).json({ error: 'Briefing not found' });
      }

      return res.status(200).json({ success: true, briefing });
    }

    // POST - Generate briefing
    if (req.method === 'POST') {
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
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Briefing error:', error);
    return res.status(500).json({ error: error.message });
  }
}
