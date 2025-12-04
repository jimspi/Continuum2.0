
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { UserProfile, Memory, Recommendation, DailyBriefing, ActionItem, ChatMessage } from '../types';
import { useAuth } from './AuthContext';
import { generateDailyBriefing, performAiAction } from '../services/geminiService';
import { sendNotification, simulateEmailDispatch } from '../services/notificationService';

interface StoreContextType {
  profile: UserProfile | null;
  memories: Memory[];
  recommendations: Recommendation[];
  dailyBriefing: DailyBriefing | null;
  chatHistory: ChatMessage[];
  addMemory: (memory: Memory) => void;
  deleteMemory: (id: string) => void;
  updateProfile: (profile: UserProfile) => void;
  setRecommendations: (recs: Recommendation[]) => void;
  refreshDailyBriefing: (force?: boolean) => Promise<void>;
  executeAiAction: (action: ActionItem) => Promise<string>;
  toggleBriefingAction: (actionId: string) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  clearData: () => void;
  toggleSetting: (key: 'emailNotifications' | 'pushNotifications', value: boolean) => void;
  exportData: () => void;
  importData: (file: File) => Promise<boolean>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  userId: '',
  name: '',
  summary: 'No profile data yet.',
  interests: [],
  goals: [],
  concerns: [],
  keyFacts: [],
  lastUpdated: new Date().toISOString(),
  isOnboarded: false,
  settings: {
    emailNotifications: false,
    pushNotifications: false
  }
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dailyBriefing, setDailyBriefing] = useState<DailyBriefing | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  const schedulerRef = useRef<number | null>(null);

  // Load data when user authenticates
  useEffect(() => {
    if (isAuthenticated && user) {
      const storedProfile = localStorage.getItem(`continuum_profile_${user.id}`);
      const storedMemories = localStorage.getItem(`continuum_memories_${user.id}`);
      const storedRecs = localStorage.getItem(`continuum_recs_${user.id}`);
      const storedBriefing = localStorage.getItem(`continuum_briefing_${user.id}`);
      const storedChat = localStorage.getItem(`continuum_chat_${user.id}`);

      // RESCUE MODE: If no profile found for this specific ID, search for ANY profile to restore
      // This handles cases where ID generation logic changed but data exists
      let profileToLoad = storedProfile ? JSON.parse(storedProfile) : null;
      
      if (!profileToLoad) {
        // Scan for other profiles
        const allKeys = Object.keys(localStorage);
        const profileKey = allKeys.find(k => k.startsWith('continuum_profile_'));
        if (profileKey) {
             const foundProfile = localStorage.getItem(profileKey);
             if (foundProfile) {
                 profileToLoad = JSON.parse(foundProfile);
                 // Migrate to current user ID
                 localStorage.setItem(`continuum_profile_${user.id}`, JSON.stringify(profileToLoad));
             }
        }
      }

      if (profileToLoad) {
        // --- MIGRATION LOGIC FOR LEGACY DATA ---
        // 1. Ensure settings exist
        if (!profileToLoad.settings) {
            profileToLoad.settings = {
                emailNotifications: false,
                pushNotifications: false
            };
        }
        // 2. Ensure 'isOnboarded' flag is true if they have a name/summary
        if (profileToLoad.isOnboarded === undefined) {
            if (profileToLoad.name || profileToLoad.summary !== DEFAULT_PROFILE.summary) {
                profileToLoad.isOnboarded = true;
            }
        }
        // ----------------------------------------

        setProfile(profileToLoad);
        localStorage.setItem(`continuum_profile_${user.id}`, JSON.stringify(profileToLoad));
      } else {
        setProfile({ ...DEFAULT_PROFILE, userId: user.id, name: user.name });
      }

      if (storedMemories) setMemories(JSON.parse(storedMemories));
      if (storedRecs) setRecommendations(JSON.parse(storedRecs));
      if (storedChat) setChatHistory(JSON.parse(storedChat));
      
      // Check if briefing is stale (not from today)
      if (storedBriefing) {
        const parsed = JSON.parse(storedBriefing);
        const today = new Date().toISOString().split('T')[0];
        if (parsed.date === today) {
          setDailyBriefing(parsed);
        } else {
          setDailyBriefing(null); // Reset if old
        }
      }
    } else {
      setProfile(null);
      setMemories([]);
      setRecommendations([]);
      setDailyBriefing(null);
      setChatHistory([]);
    }
  }, [isAuthenticated, user]);

  // Persist updates
  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (user) localStorage.setItem(`continuum_profile_${user.id}`, JSON.stringify(newProfile));
  };

  const addMemory = (memory: Memory) => {
    const updated = [memory, ...memories];
    setMemories(updated);
    if (user) localStorage.setItem(`continuum_memories_${user.id}`, JSON.stringify(updated));
  };

  const deleteMemory = (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    if (user) localStorage.setItem(`continuum_memories_${user.id}`, JSON.stringify(updated));
  };

  const saveRecommendations = (recs: Recommendation[]) => {
    const updated = [...recs, ...recommendations].slice(0, 20); // Keep last 20
    setRecommendations(updated);
    if (user) localStorage.setItem(`continuum_recs_${user.id}`, JSON.stringify(updated));
  };

  const addChatMessage = (message: ChatMessage) => {
    const updated = [...chatHistory, message];
    setChatHistory(updated);
    if (user) localStorage.setItem(`continuum_chat_${user.id}`, JSON.stringify(updated));
  };

  const clearChat = () => {
    setChatHistory([]);
    if (user) localStorage.removeItem(`continuum_chat_${user.id}`);
  };

  const refreshDailyBriefing = async (force = false) => {
    if (!profile || !user) return;
    
    const today = new Date().toISOString().split('T')[0];
    if (!force && dailyBriefing?.date === today) return;

    try {
      const briefing = await generateDailyBriefing(profile, memories);
      setDailyBriefing(briefing);
      // Also update the main recommendations list with the top picks from the briefing
      if (briefing.topRecommendations.length > 0) {
        saveRecommendations(briefing.topRecommendations);
      }
      localStorage.setItem(`continuum_briefing_${user.id}`, JSON.stringify(briefing));
      return briefing; // Return for notification use
    } catch (e) {
      console.error("Failed to generate briefing", e);
    }
  };

  const executeAiAction = async (action: ActionItem): Promise<string> => {
    if (!profile) return "Profile not found.";
    return await performAiAction(action, profile);
  };
  
  const toggleBriefingAction = (actionId: string) => {
    if (!dailyBriefing || !user) return;
    
    const updatedActions = dailyBriefing.pendingActions.map(a => 
      a.id === actionId 
        ? { ...a, status: a.status === 'completed' ? 'pending' : 'completed' } as ActionItem
        : a
    );
    
    const updatedBriefing = { ...dailyBriefing, pendingActions: updatedActions };
    setDailyBriefing(updatedBriefing);
    localStorage.setItem(`continuum_briefing_${user.id}`, JSON.stringify(updatedBriefing));
  };

  const clearData = () => {
    if (user) {
        localStorage.removeItem(`continuum_profile_${user.id}`);
        localStorage.removeItem(`continuum_memories_${user.id}`);
        localStorage.removeItem(`continuum_recs_${user.id}`);
        localStorage.removeItem(`continuum_briefing_${user.id}`);
        localStorage.removeItem(`continuum_chat_${user.id}`);
    }
    setProfile(null);
    setMemories([]);
    setRecommendations([]);
    setDailyBriefing(null);
    setChatHistory([]);
    
    // Reset current state to default empty
    if (user) {
      setProfile({ ...DEFAULT_PROFILE, userId: user.id, name: user.name });
    }
  };

  const toggleSetting = (key: 'emailNotifications' | 'pushNotifications', value: boolean) => {
    if (!profile) return;
    const currentSettings = profile.settings || { emailNotifications: false, pushNotifications: false };
    const updatedSettings = { ...currentSettings, [key]: value };
    const updatedProfile = { ...profile, settings: updatedSettings };
    updateProfile(updatedProfile);
  };

  // --- Backup & Restore ---
  const exportData = () => {
    if (!user || !profile) return;
    
    const data = {
      _meta: { version: 1, exportedAt: new Date().toISOString(), userId: user.id },
      profile,
      memories,
      recommendations,
      dailyBriefing,
      chatHistory
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `continuum-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!data._meta || !data.profile || !user) {
            throw new Error("Invalid backup file");
          }

          // We restore data to the *current* logged in user ID to ensure it shows up
          // regardless of what the original ID was in the other app instance
          const currentId = user.id;

          // Update keys
          localStorage.setItem(`continuum_profile_${currentId}`, JSON.stringify({ ...data.profile, userId: currentId }));
          localStorage.setItem(`continuum_memories_${currentId}`, JSON.stringify(data.memories || []));
          localStorage.setItem(`continuum_recs_${currentId}`, JSON.stringify(data.recommendations || []));
          if (data.dailyBriefing) {
            localStorage.setItem(`continuum_briefing_${currentId}`, JSON.stringify(data.dailyBriefing));
          }
          if (data.chatHistory) {
            localStorage.setItem(`continuum_chat_${currentId}`, JSON.stringify(data.chatHistory));
          }

          // Force reload to pick up changes
          window.location.reload();
          resolve(true);
        } catch (err) {
          console.error(err);
          reject(false);
        }
      };
      reader.readAsText(file);
    });
  };

  // --- Scheduler for 7PM MST Notifications ---
  useEffect(() => {
    if (!isAuthenticated || !user || !profile) return;

    const checkSchedule = async () => {
      const now = new Date();
      // Get time in Mountain Time (MST/MDT)
      const options = { timeZone: "America/Denver", hour12: false, hour: "numeric", minute: "numeric" };
      const mstTime = new Intl.DateTimeFormat("en-US", options as any).format(now);
      const [hour, minute] = mstTime.split(':').map(Number);

      const todayStr = now.toISOString().split('T')[0];
      
      // Run if it's 7PM or later (19:00) AND we haven't sent it today
      if (hour >= 19 && profile.settings?.lastNotificationDate !== todayStr) {
          
          // 1. Generate Briefing if not exists or force refresh
          let briefing = dailyBriefing;
          if (!briefing || briefing.date !== todayStr) {
            briefing = await refreshDailyBriefing(true) as DailyBriefing;
          }

          if (briefing) {
             const topRec = briefing.topRecommendations[0]?.title || "Check your daily insights.";

             // 2. Send Push
             if (profile.settings?.pushNotifications) {
                sendNotification("Continuum Evening Briefing", `Insights ready. Top suggestion: ${topRec}`);
             }

             // 3. Send Email
             if (profile.settings?.emailNotifications) {
               await simulateEmailDispatch(user.email, "Your Continuum Daily Briefing", `Here are your insights for ${briefing.date}. Top Action: ${topRec}`);
             }

             // 4. Update 'lastNotificationDate' to prevent spamming today
             const currentSettings = profile.settings || { emailNotifications: false, pushNotifications: false };
             const updatedProfile = {
               ...profile,
               settings: { ...currentSettings, lastNotificationDate: todayStr }
             };
             updateProfile(updatedProfile as UserProfile);
          }
      }
    };

    // Check every minute
    schedulerRef.current = window.setInterval(checkSchedule, 60000);
    // Initial check immediately
    checkSchedule();

    return () => {
      if (schedulerRef.current) clearInterval(schedulerRef.current);
    };
  }, [isAuthenticated, user, profile, dailyBriefing]); 

  return (
    <StoreContext.Provider value={{ 
      profile, 
      memories, 
      recommendations, 
      dailyBriefing,
      chatHistory,
      addMemory, 
      deleteMemory,
      updateProfile, 
      setRecommendations: saveRecommendations,
      refreshDailyBriefing,
      executeAiAction,
      toggleBriefingAction,
      addChatMessage,
      clearChat,
      clearData,
      toggleSetting,
      exportData,
      importData
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
