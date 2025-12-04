import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createUser, getUserByEmail } from '../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
