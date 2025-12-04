
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Recommendation, Memory, DailyBriefing, ActionItem, ChatMessage } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

// 0. Create Initial Profile (Onboarding)
export const createInitialProfile = async (
  userId: string,
  inputs: { name: string; location: string; role: string; goals: string; interests: string }
): Promise<{ profile: UserProfile; recommendations: Recommendation[] }> => {
  const ai = getAiClient();

  const prompt = `
    Create an comprehensive initial user profile and 3 starter recommendations based on these intake answers.
    
    User Name: ${inputs.name}
    Location: ${inputs.location}
    Role/Occupation/Status: ${inputs.role}
    Primary Goals: ${inputs.goals}
    Interests: ${inputs.interests}
    
    Task:
    1. Construct a structured profile summary, tags, and facts.
    2. Generate exactly 3 "Starter Recommendations" that provide immediate value.
       - If they like podcasts/politics, suggest a specific real podcast.
       - If they have a goal, suggest a specific tool or article.
       - PROVIDE A URL for each recommendation. Use a google search URL (https://google.com/search?q=...) if a direct link isn't certain, or a specific website URL if well known.
    
    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
          initialRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['product', 'action', 'resource', 'preparation'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                link: { type: Type.STRING },
              },
              required: ['type', 'title', 'description', 'reasoning', 'link'],
            }
          }
        },
        required: ['summary', 'interests', 'goals', 'concerns', 'keyFacts', 'initialRecommendations'],
      }
    }
  });

  const data = JSON.parse(response.text || "{}");
  
  const profile: UserProfile = {
    userId,
    name: inputs.name,
    location: inputs.location,
    summary: data.summary,
    interests: data.interests || [],
    goals: data.goals || [],
    concerns: data.concerns || [],
    keyFacts: data.keyFacts || [],
    lastUpdated: new Date().toISOString(),
    isOnboarded: true,
    settings: {
      emailNotifications: false,
      pushNotifications: false
    }
  };

  const recommendations: Recommendation[] = (data.initialRecommendations || []).map((r: any, i: number) => ({
    ...r,
    id: `init-${i}-${Date.now()}`,
    status: 'new'
  }));

  return { profile, recommendations };
};

// 1. Analyze new content (Text, File, or Audio)
export const analyzeContent = async (
  text: string,
  fileData?: { data: string; mimeType: string }
): Promise<{ summary: string; topics: string[]; entities: string[]; intent: string }> => {
  const ai = getAiClient();
  
  const prompt = `
    Analyze the following content. It might be text, a document, or an audio recording.
    
    If it is an audio recording:
    1. Transcribe the key points.
    2. Analyze the tone and intent carefully.
    
    Extract the following:
    1. A brief summary (max 2 sentences).
    2. Key topics or themes.
    3. Key entities (people, places, products, events).
    4. The primary intent or goal of the user in this content.
    
    Return as JSON.
  `;

  const parts: any[] = [{ text: prompt }];
  
  if (fileData) {
    parts.push({ inlineData: fileData });
  }
  
  if (text) {
    parts.push({ text: `User Input Context/Note: ${text}` });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          topics: { type: Type.ARRAY, items: { type: Type.STRING } },
          entities: { type: Type.ARRAY, items: { type: Type.STRING } },
          intent: { type: Type.STRING },
        },
        required: ['summary', 'topics', 'entities', 'intent'],
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// 2. Update User Profile based on new analysis
export const updateUserProfile = async (
  currentProfile: UserProfile,
  analysis: { summary: string; topics: string[]; entities: string[]; intent: string }
): Promise<UserProfile> => {
  const ai = getAiClient();

  const prompt = `
    You are maintaining a living profile for a user.
    
    Current Profile:
    ${JSON.stringify(currentProfile)}
    
    New Content Analysis:
    ${JSON.stringify(analysis)}
    
    Task:
    Merge the new analysis into the current profile. 
    - Update the summary to reflect the user's evolving context.
    - Add new interests or goals. 
    - Refine concerns.
    - Add concrete facts.
    - Remove outdated or redundant information.
    - Keep the profile concise and professional.
    
    Return the full updated profile object.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          goals: { type: Type.ARRAY, items: { type: Type.STRING } },
          concerns: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['summary', 'interests', 'goals', 'concerns', 'keyFacts'],
      }
    }
  });

  const updates = JSON.parse(response.text || "{}");
  
  return {
    ...currentProfile,
    ...updates,
    isOnboarded: true,
    lastUpdated: new Date().toISOString()
  };
};

// 3. Generate Daily Briefing with Interactive Actions
export const generateDailyBriefing = async (
  profile: UserProfile,
  recentMemories: Memory[]
): Promise<DailyBriefing> => {
  const ai = getAiClient();
  
  // Filter memories for the last 48 hours to keep context relevant
  const recentContent = recentMemories
    .slice(0, 10)
    .map(m => `- [${m.type}] ${m.content.substring(0, 100)}... (Insights: ${m.insights.join(', ')})`)
    .join('\n');

  const prompt = `
    Generate a High-Value Daily Briefing for this user.
    
    Profile Summary: ${profile.summary}
    Location: ${profile.location || "Unknown"}
    Active Goals: ${profile.goals.join(', ')}
    Known Concerns: ${profile.concerns.join(', ')}
    
    Recent Activity (Last 48h):
    ${recentContent || "No recent activity."}
    
    Task:
    1. 'recap': 3-4 bullet points of DEEP insights connecting recent activity to long-term goals.
    2. 'pendingActions': 3 specific, high-value action items.
       - CRITICAL: For each action, determine if YOU (the AI) can help draft, plan, or research it.
       - Set 'aiActionType' to 'draft', 'plan', 'research', or 'list' if applicable.
       - Set 'aiActionLabel' to something like "Draft Email", "Create Plan", "Compare Options".
    3. 'topRecommendations': 1-2 specific recommendations.
       - Must include URL (Google Search or Direct).
    
    Return as JSON.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recap: { type: Type.ARRAY, items: { type: Type.STRING } },
          pendingActions: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                aiActionType: { type: Type.STRING, enum: ['draft', 'plan', 'research', 'list'], nullable: true },
                aiActionLabel: { type: Type.STRING, nullable: true }
              },
              required: ['label']
            } 
          },
          topRecommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['product', 'action', 'resource', 'preparation'] },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                reasoning: { type: Type.STRING },
                link: { type: Type.STRING },
              },
              required: ['type', 'title', 'description', 'reasoning', 'link'],
            }
          }
        },
        required: ['recap', 'pendingActions', 'topRecommendations'],
      }
    }
  });

  const data = JSON.parse(response.text || "{}");

  return {
    date: new Date().toISOString().split('T')[0],
    recap: data.recap || [],
    pendingActions: (data.pendingActions || []).map((a: any, i: number) => ({
      id: `action-${i}-${Date.now()}`,
      label: a.label,
      status: 'pending',
      aiActionType: a.aiActionType,
      aiActionLabel: a.aiActionLabel
    })),
    topRecommendations: (data.topRecommendations || []).map((r: any, i: number) => ({ ...r, id: `brief-${i}-${Date.now()}`, status: 'new' }))
  };
};

// 4. Perform an AI Action (Agent Mode)
export const performAiAction = async (
  action: ActionItem,
  profile: UserProfile
): Promise<string> => {
  const ai = getAiClient();

  const prompt = `
    You are an intelligent assistant acting on behalf of the user.
    
    User Context: ${profile.summary}
    User Location: ${profile.location}
    
    The user wants you to perform this task: "${action.label}"
    Task Type: ${action.aiActionType}
    
    Instruction:
    - If 'draft': Write the actual email, message, or text. Do not include placeholders like [Name] if you know the name from context, otherwise use brackets.
    - If 'plan': Create a detailed, step-by-step plan with timelines.
    - If 'research': Create a comparison table or detailed summary of options.
    - If 'list': Create a checklist.
    
    Output the result directly in Markdown format. Do not add conversational filler like "Here is the draft". Just output the content.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Could not generate result.";
};

// 5. Chat with Memories (RAG)
export const chatWithMemories = async (
  query: string,
  history: ChatMessage[],
  profile: UserProfile,
  memories: Memory[]
): Promise<string> => {
  const ai = getAiClient();

  // Construct Context (Retrieval)
  // We use the full context here because Flash 2.5 has a 1M token window, 
  // which is sufficient for thousands of memories in a personal app.
  const memoryContext = memories.map(m => 
    `[${m.createdAt.split('T')[0]}] (${m.type}): ${m.content} \n(Tags: ${m.insights.join(', ')})`
  ).join('\n---\n');

  const chatHistory = history.map(msg => 
    `${msg.role === 'user' ? 'User' : 'Continuum'}: ${msg.content}`
  ).join('\n');

  const systemInstruction = `
    You are Continuum, an intelligent second brain for ${profile.name}.
    
    YOUR GOAL:
    Answer the user's question by synthesizing information from their Profile and Memory Log.
    
    USER PROFILE:
    ${JSON.stringify(profile)}
    
    MEMORY LOG (Most recent first):
    ${memoryContext}
    
    RULES:
    1. Answer naturally, concisely, and professionally.
    2. Cite specific dates or files if relevant (e.g., "In your note from Jan 12...").
    3. If the answer is NOT in the memories, simply state that you don't have a record of that specific detail. Do not hallucinate.
    4. You may offer to help with related goals found in the profile.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Recent Chat History:
      ${chatHistory}
      
      Current Question: 
      ${query}
    `,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "I'm having trouble accessing your memories right now.";
};
