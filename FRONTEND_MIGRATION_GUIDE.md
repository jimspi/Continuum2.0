# Frontend Migration Guide

This guide explains how to migrate the Continuum frontend from localStorage to the backend API.

## 📝 Overview

The current implementation stores all data in browser localStorage. The new implementation uses:
- Backend API for data persistence
- OpenAI instead of Google Gemini
- Postgres database for storage

## 🔄 What Needs to Change

### 1. Environment Configuration

Create `continuum/.env` (for local development):

```bash
# API URL - leave empty for production (uses relative URLs)
VITE_API_URL=http://localhost:3000

# For production deployment, this should be empty or your production URL
# VITE_API_URL=https://your-project.vercel.app
```

### 2. Update StoreContext.tsx

Replace the localStorage logic with API calls using the new `apiService.ts`.

**Current:** Uses `localStorage.getItem()` and `localStorage.setItem()`
**New:** Use API functions from `apiService.ts`

Key changes needed:

```typescript
// OLD (localStorage)
const savedProfile = localStorage.getItem(`continuum_profile_${userId}`);
if (savedProfile) {
  setProfile(JSON.parse(savedProfile));
}

// NEW (API)
import { profileAPI } from '../services/apiService';

const { profile } = await profileAPI.get(userId);
setProfile(profile);
```

### 3. Update AuthContext.tsx

Replace sign-in logic to use the backend:

```typescript
// OLD (localStorage)
const userId = `user_${btoa(email).substring(0, 12)}`;
localStorage.setItem('continuum_user', JSON.stringify({ userId, email, name }));

// NEW (API)
import { authAPI } from '../services/apiService';

const { user } = await authAPI.signIn(email, name);
// user contains: { userId, email, name }
```

### 4. Update Onboarding Flow

Replace profile creation with API call:

```typescript
// OLD (Gemini + localStorage)
import { createInitialProfile } from '../services/geminiService';
const result = await createInitialProfile(data);
localStorage.setItem('continuum_profile_...', JSON.stringify(profile));

// NEW (OpenAI + Backend)
import { profileAPI } from '../services/apiService';
const { profile, recommendations } = await profileAPI.create(userId, data);
```

### 5. Update Memory Capture

Replace memory storage with API:

```typescript
// OLD (Gemini analysis + localStorage)
const analysis = await analyzeContent(content, type);
const memories = JSON.parse(localStorage.getItem('continuum_memories_...') || '[]');
memories.push({ ...analysis, content });
localStorage.setItem('continuum_memories_...', JSON.stringify(memories));

// NEW (OpenAI + Backend)
import { memoriesAPI } from '../services/apiService';
const { memory } = await memoriesAPI.create(userId, { content, type });
// Backend handles analysis automatically
```

### 6. Update Chat Interface

Replace chat storage with API:

```typescript
// OLD (localStorage + Gemini)
const response = await chatWithMemories(message, profile, memories, chatHistory);
chatHistory.push({ role: 'user', content: message });
chatHistory.push({ role: 'assistant', content: response });
localStorage.setItem('continuum_chat_...', JSON.stringify(chatHistory));

// NEW (Backend + OpenAI)
import { chatAPI } from '../services/apiService';
const { message: assistantMessage } = await chatAPI.sendMessage(userId, message);
// Backend handles both user message storage and AI response
```

### 7. Update Daily Briefing

Replace briefing generation:

```typescript
// OLD (Gemini + localStorage)
const briefing = await generateDailyBriefing(profile, memories, recommendations);
localStorage.setItem('continuum_briefing_...', JSON.stringify(briefing));

// NEW (Backend + OpenAI)
import { briefingAPI } from '../services/apiService';
const { briefing } = await briefingAPI.generate(userId, todayDate);
```

### 8. Remove Gemini Service

The `geminiService.ts` file is no longer needed as all AI operations are now handled by the backend.

## 🔧 Detailed Implementation Steps

### Step 1: Update package.json (already done)

The API service is already created at `continuum/src/services/apiService.ts`.

### Step 2: Update AuthContext

File: `continuum/src/contexts/AuthContext.tsx`

```typescript
import { authAPI } from '../services/apiService';

// In signIn function:
const signIn = async (email: string, name?: string) => {
  try {
    const { user } = await authAPI.signIn(email, name);
    setUser({
      userId: user.userId,
      email: user.email,
      name: user.name || '',
    });
    // Remove localStorage code
  } catch (error) {
    console.error('Sign in failed:', error);
    throw error;
  }
};
```

### Step 3: Update StoreContext

File: `continuum/src/contexts/StoreContext.tsx`

This is the largest change. You'll need to:

1. **Load Profile:**
```typescript
const loadProfile = useCallback(async (userId: string) => {
  try {
    const { profile } = await profileAPI.get(userId);
    setProfile(profile);
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}, []);
```

2. **Load Memories:**
```typescript
const loadMemories = useCallback(async (userId: string) => {
  try {
    const { memories } = await memoriesAPI.list(userId);
    setMemories(memories);
  } catch (error) {
    console.error('Failed to load memories:', error);
  }
}, []);
```

3. **Add Memory:**
```typescript
const addMemory = async (content: string, type: 'text' | 'file' | 'audio') => {
  if (!userId) return;

  try {
    const { memory } = await memoriesAPI.create(userId, { content, type });
    setMemories(prev => [memory, ...prev]);
  } catch (error) {
    console.error('Failed to add memory:', error);
    throw error;
  }
};
```

4. **Similar updates for:**
   - `addRecommendation`
   - `updateRecommendation`
   - `deleteRecommendation`
   - `generateDailyBriefing`
   - `loadChatHistory`
   - `sendChatMessage`

### Step 4: Update Onboarding Page

File: `continuum/src/pages/Onboarding.tsx`

```typescript
import { profileAPI } from '../services/apiService';

// In handleComplete:
const handleComplete = async () => {
  try {
    const { profile, recommendations } = await profileAPI.create(userId, {
      name: formData.name,
      location: formData.location,
      role: formData.role,
      goals: formData.goals,
      interests: formData.interests,
    });

    // Update context
    updateProfile(profile);
    recommendations.forEach(rec => addRecommendation(rec));

    navigate('/dashboard');
  } catch (error) {
    console.error('Onboarding failed:', error);
  }
};
```

### Step 5: Update Environment Variables

Create `continuum/.env.local` for local development:

```bash
VITE_API_URL=http://localhost:3000
```

For production (Vercel), leave it empty or set to your domain:

```bash
VITE_API_URL=
```

### Step 6: Test Locally

1. **Start the development server:**
```bash
cd continuum
npm run dev
```

2. **Use Vercel CLI to test API functions locally:**
```bash
# Install Vercel CLI
npm i -g vercel

# Run in project root
vercel dev
```

This will run both frontend and API functions locally.

### Step 7: Handle Errors

Add proper error handling to all API calls:

```typescript
try {
  const result = await someAPI.call(params);
  // Handle success
} catch (error) {
  console.error('API Error:', error);
  // Show user-friendly error message
  // Maybe set an error state
}
```

### Step 8: Loading States

Add loading states for better UX:

```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    await someAPI.call();
  } finally {
    setLoading(false);
  }
};
```

## 🧪 Testing Checklist

- [ ] Sign in creates user in database
- [ ] Onboarding creates profile and recommendations
- [ ] Memory capture saves to database
- [ ] Memories list loads from database
- [ ] Recommendations update in database
- [ ] Daily briefing generates and saves
- [ ] Chat messages save to database
- [ ] Chat history loads correctly
- [ ] AI actions work with OpenAI
- [ ] Profile updates persist

## 🚨 Important Notes

1. **Data Migration:** Existing localStorage data won't automatically transfer to the database. Consider adding an export/import feature.

2. **API URLs:** In production, the API calls should use relative URLs (empty `VITE_API_URL`). In development, use `http://localhost:3000`.

3. **Error Handling:** The backend might be slower than localStorage. Add loading states and error handling.

4. **Authentication:** Currently using simple email-based auth. Consider adding proper authentication (JWT, sessions) for production.

5. **Rate Limiting:** Consider adding rate limiting to API endpoints to prevent abuse.

## 📦 Optional: Data Migration Tool

Create a migration script to move localStorage data to the backend:

```typescript
async function migrateLocalStorageData() {
  const userId = getCurrentUserId();

  // Get all localStorage data
  const profile = JSON.parse(localStorage.getItem(`continuum_profile_${userId}`) || '{}');
  const memories = JSON.parse(localStorage.getItem(`continuum_memories_${userId}`) || '[]');
  const recommendations = JSON.parse(localStorage.getItem(`continuum_recs_${userId}`) || '[]');

  // Upload to backend
  await profileAPI.update(userId, profile);

  for (const memory of memories) {
    await memoriesAPI.create(userId, memory);
  }

  for (const rec of recommendations) {
    await recommendationsAPI.create(userId, rec);
  }

  console.log('Migration complete!');
}
```

## 🎯 Next Steps

After migration:
1. Test thoroughly with sample data
2. Deploy to Vercel
3. Monitor API usage and errors
4. Add analytics/monitoring
5. Consider adding authentication improvements

## 💡 Tips

- Keep the old localStorage code commented out initially for easy rollback
- Test with small data sets first
- Monitor OpenAI API costs
- Add request/response logging for debugging
- Consider caching frequently accessed data
