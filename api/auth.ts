import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser, getUserByEmail } from './lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    let user = await getUserByEmail(email);

    // Create user if doesn't exist
    if (!user) {
      user = await createUser(email, name);
    }

    return res.status(200).json({
      success: true,
      user: {
        userId: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Sign in error:', error);
    return res.status(500).json({ error: error.message });
  }
}
