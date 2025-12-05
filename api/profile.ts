import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getProfile, upsertProfile } from './lib/db.js';
import { createInitialProfile } from './lib/openai.js';

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
    // GET - Get profile
    if (req.method === 'GET') {
      const { userId } = req.query;

      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const profile = await getProfile(userId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      return res.status(200).json({ success: true, profile });
    }

    // POST - Create or update profile
    if (req.method === 'POST') {
      const { userId, action, name, location, role, goals, interests, profile } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Create initial profile
      if (action === 'create') {
        const result = await createInitialProfile({
          name,
          location,
          role,
          goals,
          interests,
        });

        const savedProfile = await upsertProfile(userId, {
          location,
          summary: result.profile.summary,
          interests: result.profile.interests,
          goals: result.profile.goals,
          concerns: result.profile.concerns,
          key_facts: result.profile.keyFacts,
          is_onboarded: true,
          settings: {
            emailNotifications: true,
            pushNotifications: true,
            lastNotificationDate: null,
          },
          last_updated: new Date(),
        } as any);

        return res.status(200).json({
          success: true,
          profile: savedProfile,
          recommendations: result.recommendations,
        });
      }

      // Update profile
      const updatedProfile = await upsertProfile(userId, profile);
      return res.status(200).json({ success: true, profile: updatedProfile });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: error.message });
  }
}
