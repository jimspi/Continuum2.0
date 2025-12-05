import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMemories, createMemory, deleteMemory, getProfile, upsertProfile } from './lib/db.js';
import { analyzeContent, updateUserProfile } from './lib/openai.js';

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

    // GET - List memories
    if (req.method === 'GET') {
      const memories = await getMemories(userId);
      return res.status(200).json({ success: true, memories });
    }

    // POST - Create memory
    if (req.method === 'POST') {
      const { content, type, timestamp } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
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
    }

    // DELETE - Delete memory
    if (req.method === 'DELETE') {
      const { memoryId } = req.query;

      if (!memoryId || typeof memoryId !== 'string') {
        return res.status(400).json({ error: 'Memory ID is required' });
      }

      await deleteMemory(userId, memoryId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Memories error:', error);
    return res.status(500).json({ error: error.message });
  }
}
