
export interface UserProfile {
  userId: string;
  name: string;
  location?: string; 
  summary: string;
  interests: string[];
  goals: string[];
  concerns: string[];
  keyFacts: string[];
  lastUpdated: string;
  isOnboarded?: boolean;
  settings?: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    lastNotificationDate?: string; // YYYY-MM-DD to prevent double firing
  };
}

export interface Recommendation {
  id: string;
  type: 'product' | 'action' | 'resource' | 'preparation';
  title: string;
  description: string;
  reasoning: string;
  link?: string;
  status: 'new' | 'archived';
}

export interface ActionItem {
  id: string;
  label: string;
  status: 'pending' | 'completed' | 'dismissed';
  aiActionType?: 'draft' | 'plan' | 'research' | 'list';
  aiActionLabel?: string; // e.g. "Draft Email", "Create Plan"
}

export interface Memory {
  id: string;
  content: string; // Or summary of file
  originalFileName?: string;
  type: 'text' | 'file' | 'audio';
  createdAt: string;
  insights: string[]; // Extracted key points
}

export interface DailyBriefing {
  date: string; // ISO date YYYY-MM-DD
  recap: string[];
  pendingActions: ActionItem[];
  topRecommendations: Recommendation[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
}

// Helper for simulated delay
export const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
