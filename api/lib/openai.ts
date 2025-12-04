import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OnboardingData {
  name: string;
  location: string;
  role: string;
  goals: string;
  interests: string;
}

export interface AnalyzedContent {
  summary: string;
  topics: string[];
  entities: string[];
  intent: string;
}

export interface UserProfile {
  userId: string;
  name: string;
  location: string;
  summary: string;
  interests: string[];
  goals: string[];
  concerns: string[];
  keyFacts: string[];
  lastUpdated: string;
}

export interface Recommendation {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  actionItems: { id: string; text: string; completed: boolean }[];
}

export interface DailyBriefing {
  recap: string;
  pendingActions: { text: string; source: string; priority: string }[];
  recommendations: { title: string; description: string; rationale: string }[];
}

// Create initial profile from onboarding data
export async function createInitialProfile(data: OnboardingData): Promise<{
  profile: UserProfile;
  recommendations: Recommendation[];
}> {
  const prompt = `You are an AI assistant helping to create a user profile. Based on the following onboarding information, create a comprehensive user profile and 3 actionable recommendations.

Onboarding Data:
- Name: ${data.name}
- Location: ${data.location}
- Role: ${data.role}
- Goals: ${data.goals}
- Interests: ${data.interests}

Return a JSON object with this structure:
{
  "profile": {
    "summary": "Brief 2-3 sentence summary of the user",
    "interests": ["interest1", "interest2", ...],
    "goals": ["goal1", "goal2", ...],
    "concerns": ["concern1", "concern2", ...],
    "keyFacts": ["fact1", "fact2", ...]
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "category": "career|wellness|productivity|learning|finance",
      "priority": "high|medium|low",
      "actionItems": [
        {"id": "unique_id", "text": "Action item", "completed": false}
      ]
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    profile: {
      userId: '',
      name: data.name,
      location: data.location,
      summary: result.profile.summary,
      interests: result.profile.interests,
      goals: result.profile.goals,
      concerns: result.profile.concerns || [],
      keyFacts: result.profile.keyFacts || [],
      lastUpdated: new Date().toISOString(),
    },
    recommendations: result.recommendations.map((rec: any) => ({
      ...rec,
      actionItems: rec.actionItems.map((item: any, idx: number) => ({
        id: item.id || `action_${Date.now()}_${idx}`,
        text: item.text,
        completed: false,
      })),
    })),
  };
}

// Analyze content from text, file, or audio
export async function analyzeContent(
  content: string,
  type: 'text' | 'file' | 'audio'
): Promise<AnalyzedContent> {
  const prompt = `Analyze the following ${type} content and extract key information.

Content: ${content}

Return a JSON object with this structure:
{
  "summary": "Brief summary of the content",
  "topics": ["topic1", "topic2", ...],
  "entities": ["entity1", "entity2", ...],
  "intent": "What the user is trying to accomplish or communicate"
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.5,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// Update user profile based on new content analysis
export async function updateUserProfile(
  currentProfile: UserProfile,
  analysis: AnalyzedContent
): Promise<Partial<UserProfile>> {
  const prompt = `You are updating a user profile based on new content analysis.

Current Profile:
${JSON.stringify(currentProfile, null, 2)}

New Analysis:
${JSON.stringify(analysis, null, 2)}

Update the profile by:
1. Refining the summary if new insights are available
2. Adding new interests, goals, or concerns
3. Adding new key facts
4. Keeping the profile concise and relevant

Return a JSON object with updated fields:
{
  "summary": "Updated summary",
  "interests": ["updated", "interests"],
  "goals": ["updated", "goals"],
  "concerns": ["updated", "concerns"],
  "keyFacts": ["updated", "key", "facts"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');

  return {
    summary: result.summary,
    interests: result.interests,
    goals: result.goals,
    concerns: result.concerns,
    keyFacts: result.keyFacts,
    lastUpdated: new Date().toISOString(),
  };
}

// Generate daily briefing
export async function generateDailyBriefing(
  profile: UserProfile,
  memories: any[],
  recommendations: Recommendation[]
): Promise<DailyBriefing> {
  const recentMemories = memories.slice(0, 10);

  const prompt = `Generate a personalized daily briefing for the user.

User Profile:
${JSON.stringify(profile, null, 2)}

Recent Memories (last 10):
${JSON.stringify(recentMemories, null, 2)}

Current Recommendations:
${JSON.stringify(recommendations, null, 2)}

Create a daily briefing with:
1. A recap of recent activities and progress
2. Pending actions that need attention
3. New recommendations based on recent activity

Return a JSON object:
{
  "recap": "Summary of recent activity and progress",
  "pendingActions": [
    {"text": "Action text", "source": "Where it came from", "priority": "high|medium|low"}
  ],
  "recommendations": [
    {"title": "Title", "description": "Description", "rationale": "Why this is recommended"}
  ]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.7,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// Perform AI actions (draft, plan, research, list)
export async function performAiAction(
  action: string,
  prompt: string,
  profile: UserProfile,
  memories: any[]
): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant with access to the user's profile and memories.

User Profile:
${JSON.stringify(profile, null, 2)}

Recent Context (memories):
${JSON.stringify(memories.slice(0, 5), null, 2)}

The user wants you to: ${action}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || '';
}

// Chat with memories (RAG)
export async function chatWithMemories(
  message: string,
  profile: UserProfile,
  memories: any[],
  chatHistory: any[]
): Promise<string> {
  const systemPrompt = `You are Continuum, an intelligent memory assistant. You have access to the user's profile and all their captured memories.

User Profile:
${JSON.stringify(profile, null, 2)}

All Memories:
${JSON.stringify(memories, null, 2)}

Use this information to provide contextual, personalized responses. Reference specific memories when relevant.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages as any,
    temperature: 0.8,
  });

  return response.choices[0].message.content || '';
}
