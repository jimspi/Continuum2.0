import { sql } from '@vercel/postgres';

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  user_id: string;
  location: string;
  summary: string;
  interests: string[];
  goals: string[];
  concerns: string[];
  key_facts: string[];
  is_onboarded: boolean;
  settings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    lastNotificationDate: string | null;
  };
  last_updated: Date;
}

export interface Memory {
  id: string;
  user_id: string;
  timestamp: string;
  type: 'text' | 'file' | 'audio';
  content: string;
  summary: string;
  topics: string[];
  entities: string[];
  intent: string;
  created_at: Date;
}

export interface Recommendation {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'dismissed' | 'completed';
  action_items: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  created_at: Date;
}

export interface DailyBriefing {
  id: string;
  user_id: string;
  date: string;
  recap: string;
  pending_actions: Array<{
    text: string;
    source: string;
    priority: string;
  }>;
  recommendations: Array<{
    title: string;
    description: string;
    rationale: string;
  }>;
  created_at: Date;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  created_at: Date;
}

// Initialize database tables
export async function initializeTables() {
  try {
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Profiles table
    await sql`
      CREATE TABLE IF NOT EXISTS profiles (
        user_id VARCHAR(255) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        location VARCHAR(255),
        summary TEXT,
        interests JSONB DEFAULT '[]',
        goals JSONB DEFAULT '[]',
        concerns JSONB DEFAULT '[]',
        key_facts JSONB DEFAULT '[]',
        is_onboarded BOOLEAN DEFAULT false,
        settings JSONB DEFAULT '{"emailNotifications": true, "pushNotifications": true, "lastNotificationDate": null}',
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Memories table
    await sql`
      CREATE TABLE IF NOT EXISTS memories (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        timestamp VARCHAR(255),
        type VARCHAR(50),
        content TEXT,
        summary TEXT,
        topics JSONB DEFAULT '[]',
        entities JSONB DEFAULT '[]',
        intent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Recommendations table
    await sql`
      CREATE TABLE IF NOT EXISTS recommendations (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description TEXT,
        category VARCHAR(100),
        priority VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        action_items JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Daily briefings table
    await sql`
      CREATE TABLE IF NOT EXISTS daily_briefings (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        date VARCHAR(50),
        recap TEXT,
        pending_actions JSONB DEFAULT '[]',
        recommendations JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Chat messages table
    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50),
        content TEXT,
        timestamp VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_memories_user_id ON memories(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_briefings_user_id ON daily_briefings(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id)`;

    return { success: true };
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User operations
export async function createUser(email: string, name?: string) {
  const userId = `user_${btoa(email.toLowerCase()).substring(0, 12)}`;

  const result = await sql`
    INSERT INTO users (id, email, name)
    VALUES (${userId}, ${email}, ${name || ''})
    ON CONFLICT (email)
    DO UPDATE SET updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  return result.rows[0] as User;
}

export async function getUserByEmail(email: string) {
  const result = await sql`
    SELECT * FROM users WHERE email = ${email}
  `;
  return result.rows[0] as User | undefined;
}

export async function getUserById(userId: string) {
  const result = await sql`
    SELECT * FROM users WHERE id = ${userId}
  `;
  return result.rows[0] as User | undefined;
}

// Profile operations
export async function getProfile(userId: string) {
  const result = await sql`
    SELECT * FROM profiles WHERE user_id = ${userId}
  `;
  return result.rows[0] as Profile | undefined;
}

export async function upsertProfile(userId: string, profile: Partial<Profile>) {
  const result = await sql`
    INSERT INTO profiles (
      user_id, location, summary, interests, goals, concerns,
      key_facts, is_onboarded, settings, last_updated
    )
    VALUES (
      ${userId},
      ${profile.location || ''},
      ${profile.summary || ''},
      ${JSON.stringify(profile.interests || [])},
      ${JSON.stringify(profile.goals || [])},
      ${JSON.stringify(profile.concerns || [])},
      ${JSON.stringify(profile.key_facts || [])},
      ${profile.is_onboarded || false},
      ${JSON.stringify(profile.settings || {})},
      CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      location = EXCLUDED.location,
      summary = EXCLUDED.summary,
      interests = EXCLUDED.interests,
      goals = EXCLUDED.goals,
      concerns = EXCLUDED.concerns,
      key_facts = EXCLUDED.key_facts,
      is_onboarded = EXCLUDED.is_onboarded,
      settings = EXCLUDED.settings,
      last_updated = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result.rows[0] as Profile;
}

// Memory operations
export async function getMemories(userId: string) {
  const result = await sql`
    SELECT * FROM memories
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result.rows as Memory[];
}

export async function createMemory(userId: string, memory: Omit<Memory, 'id' | 'user_id' | 'created_at'>) {
  const memoryId = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await sql`
    INSERT INTO memories (
      id, user_id, timestamp, type, content, summary, topics, entities, intent
    )
    VALUES (
      ${memoryId},
      ${userId},
      ${memory.timestamp},
      ${memory.type},
      ${memory.content},
      ${memory.summary},
      ${JSON.stringify(memory.topics)},
      ${JSON.stringify(memory.entities)},
      ${memory.intent}
    )
    RETURNING *
  `;
  return result.rows[0] as Memory;
}

export async function deleteMemory(userId: string, memoryId: string) {
  await sql`
    DELETE FROM memories
    WHERE id = ${memoryId} AND user_id = ${userId}
  `;
}

// Recommendation operations
export async function getRecommendations(userId: string) {
  const result = await sql`
    SELECT * FROM recommendations
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `;
  return result.rows as Recommendation[];
}

export async function createRecommendation(userId: string, rec: Omit<Recommendation, 'id' | 'user_id' | 'created_at'>) {
  const recId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await sql`
    INSERT INTO recommendations (
      id, user_id, title, description, category, priority, status, action_items
    )
    VALUES (
      ${recId},
      ${userId},
      ${rec.title},
      ${rec.description},
      ${rec.category},
      ${rec.priority},
      ${rec.status},
      ${JSON.stringify(rec.action_items)}
    )
    RETURNING *
  `;
  return result.rows[0] as Recommendation;
}

export async function updateRecommendation(userId: string, recId: string, updates: Partial<Recommendation>) {
  const result = await sql`
    UPDATE recommendations
    SET
      status = COALESCE(${updates.status}, status),
      action_items = COALESCE(${JSON.stringify(updates.action_items)}, action_items)
    WHERE id = ${recId} AND user_id = ${userId}
    RETURNING *
  `;
  return result.rows[0] as Recommendation;
}

export async function deleteRecommendation(userId: string, recId: string) {
  await sql`
    DELETE FROM recommendations
    WHERE id = ${recId} AND user_id = ${userId}
  `;
}

// Daily briefing operations
export async function getDailyBriefing(userId: string, date: string) {
  const result = await sql`
    SELECT * FROM daily_briefings
    WHERE user_id = ${userId} AND date = ${date}
  `;
  return result.rows[0] as DailyBriefing | undefined;
}

export async function createDailyBriefing(userId: string, briefing: Omit<DailyBriefing, 'id' | 'user_id' | 'created_at'>) {
  const briefingId = `brief_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await sql`
    INSERT INTO daily_briefings (
      id, user_id, date, recap, pending_actions, recommendations
    )
    VALUES (
      ${briefingId},
      ${userId},
      ${briefing.date},
      ${briefing.recap},
      ${JSON.stringify(briefing.pending_actions)},
      ${JSON.stringify(briefing.recommendations)}
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      recap = EXCLUDED.recap,
      pending_actions = EXCLUDED.pending_actions,
      recommendations = EXCLUDED.recommendations,
      created_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  return result.rows[0] as DailyBriefing;
}

// Chat operations
export async function getChatHistory(userId: string, limit: number = 50) {
  const result = await sql`
    SELECT * FROM chat_messages
    WHERE user_id = ${userId}
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return result.rows as ChatMessage[];
}

export async function createChatMessage(userId: string, message: Omit<ChatMessage, 'id' | 'user_id' | 'created_at'>) {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const result = await sql`
    INSERT INTO chat_messages (
      id, user_id, role, content, timestamp
    )
    VALUES (
      ${messageId},
      ${userId},
      ${message.role},
      ${message.content},
      ${message.timestamp}
    )
    RETURNING *
  `;
  return result.rows[0] as ChatMessage;
}

export async function clearChatHistory(userId: string) {
  await sql`
    DELETE FROM chat_messages WHERE user_id = ${userId}
  `;
}
