import type { VercelRequest, VercelResponse } from '@vercel/node';
import { upsertProfile } from '../lib/db';
import { createInitialProfile } from '../lib/openai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, name, location, role, goals, interests } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Use OpenAI to create initial profile
    const result = await createInitialProfile({
      name,
      location,
      role,
      goals,
      interests,
    });

    // Save profile to database
    const profile = await upsertProfile(userId, {
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
      profile,
      recommendations: result.recommendations,
    });
  } catch (error: any) {
    console.error('Create profile error:', error);
    return res.status(500).json({ error: error.message });
  }
}
