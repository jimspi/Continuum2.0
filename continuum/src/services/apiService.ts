// API Service - Replaces localStorage with backend API calls

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth API
export const authAPI = {
  signIn: async (email: string, name?: string) => {
    return apiCall<{ user: { userId: string; email: string; name: string } }>(
      '/api/auth/signin',
      {
        method: 'POST',
        body: JSON.stringify({ email, name }),
      }
    );
  },
};

// Profile API
export const profileAPI = {
  get: async (userId: string) => {
    return apiCall<{ profile: any }>(`/api/profile/get?userId=${userId}`);
  },

  create: async (userId: string, data: {
    name: string;
    location: string;
    role: string;
    goals: string;
    interests: string;
  }) => {
    return apiCall<{ profile: any; recommendations: any[] }>(
      '/api/profile/create',
      {
        method: 'POST',
        body: JSON.stringify({ userId, ...data }),
      }
    );
  },

  update: async (userId: string, profile: any) => {
    return apiCall<{ profile: any }>('/api/profile/update', {
      method: 'POST',
      body: JSON.stringify({ userId, profile }),
    });
  },
};

// Memories API
export const memoriesAPI = {
  list: async (userId: string) => {
    return apiCall<{ memories: any[] }>(`/api/memories/list?userId=${userId}`);
  },

  create: async (userId: string, memory: {
    content: string;
    type: 'text' | 'file' | 'audio';
    timestamp?: string;
  }) => {
    return apiCall<{ memory: any }>('/api/memories/create', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        ...memory,
        timestamp: memory.timestamp || new Date().toISOString(),
      }),
    });
  },

  delete: async (userId: string, memoryId: string) => {
    return apiCall<{ success: boolean }>(
      `/api/memories/delete?userId=${userId}&memoryId=${memoryId}`,
      { method: 'DELETE' }
    );
  },
};

// Recommendations API
export const recommendationsAPI = {
  list: async (userId: string) => {
    return apiCall<{ recommendations: any[] }>(
      `/api/recommendations/list?userId=${userId}`
    );
  },

  create: async (userId: string, recommendation: any) => {
    return apiCall<{ recommendation: any }>('/api/recommendations/create', {
      method: 'POST',
      body: JSON.stringify({ userId, recommendation }),
    });
  },

  update: async (userId: string, recId: string, updates: any) => {
    return apiCall<{ recommendation: any }>('/api/recommendations/update', {
      method: 'POST',
      body: JSON.stringify({ userId, recId, updates }),
    });
  },

  delete: async (userId: string, recId: string) => {
    return apiCall<{ success: boolean }>(
      `/api/recommendations/delete?userId=${userId}&recId=${recId}`,
      { method: 'DELETE' }
    );
  },
};

// Daily Briefing API
export const briefingAPI = {
  get: async (userId: string, date: string) => {
    return apiCall<{ briefing: any }>(
      `/api/briefing/get?userId=${userId}&date=${date}`
    );
  },

  generate: async (userId: string, date: string) => {
    return apiCall<{ briefing: any }>('/api/briefing/generate', {
      method: 'POST',
      body: JSON.stringify({ userId, date }),
    });
  },
};

// Chat API
export const chatAPI = {
  getHistory: async (userId: string) => {
    return apiCall<{ messages: any[] }>(`/api/chat/history?userId=${userId}`);
  },

  sendMessage: async (userId: string, message: string) => {
    return apiCall<{ message: any }>('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  },

  clearHistory: async (userId: string) => {
    return apiCall<{ success: boolean }>(
      `/api/chat/clear?userId=${userId}`,
      { method: 'DELETE' }
    );
  },
};

// AI Actions API
export const aiAPI = {
  performAction: async (userId: string, action: string, prompt: string) => {
    return apiCall<{ result: string }>('/api/ai/action', {
      method: 'POST',
      body: JSON.stringify({ userId, action, prompt }),
    });
  },
};
