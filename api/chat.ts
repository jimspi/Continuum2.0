import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getChatHistory, createChatMessage, clearChatHistory, getProfile, getMemories } from './lib/db.js';
import { chatWithMemories } from './lib/openai.js';

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

    // GET - Get chat history
    if (req.method === 'GET') {
      const messages = await getChatHistory(userId);
      return res.status(200).json({ success: true, messages });
    }

    // POST - Send message
    if (req.method === 'POST') {
      const { message } = req.body;

      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
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
    }

    // DELETE - Clear chat history
    if (req.method === 'DELETE') {
      await clearChatHistory(userId);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message });
  }
}
