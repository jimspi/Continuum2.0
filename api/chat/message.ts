import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createChatMessage, getChatHistory, getProfile, getMemories } from '../lib/db';
import { chatWithMemories } from '../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: 'User ID and message are required' });
    }

    // Save user message
    await createChatMessage(userId, {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    });

    // Get context
    const profile = await getProfile(userId);
    const memories = await getMemories(userId);
    const chatHistory = await getChatHistory(userId, 20);

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Generate response with OpenAI
    const response = await chatWithMemories(
      message,
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
      chatHistory.map((m: any) => ({ role: m.role, content: m.content }))
    );

    // Save assistant message
    const assistantMessage = await createChatMessage(userId, {
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: assistantMessage });
  } catch (error: any) {
    console.error('Chat message error:', error);
    return res.status(500).json({ error: error.message });
  }
}
