# Continuum 2.0 - Vercel Deployment Guide

This guide will walk you through deploying Continuum with backend storage on Vercel.

## 📋 Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. An [OpenAI API key](https://platform.openai.com/api-keys)
3. Git repository connected to Vercel

## 🚀 Step-by-Step Deployment

### Step 1: Install Dependencies

```bash
# In the root directory
npm install
```

### Step 2: Push to GitHub

```bash
git add .
git commit -m "Add backend infrastructure"
git push origin claude/setup-vercel-backend-01228q3PFfxqKJib7nXdyHrW
```

### Step 3: Create a Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

### Step 4: Add Vercel Postgres Database

1. In your Vercel project, go to the **"Storage"** tab
2. Click **"Create Database"**
3. Select **"Postgres"**
4. Choose a name (e.g., `continuum-db`)
5. Select a region (choose one close to your users)
6. Click **"Create"**

Vercel will automatically add these environment variables to your project:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Step 5: Add OpenAI API Key

**IMPORTANT:** Environment variables must be added through the Vercel dashboard, NOT in vercel.json.

1. Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. In Vercel project, go to **"Settings"** → **"Environment Variables"**
3. Click **"Add New"** and add:

```
Name: OPENAI_API_KEY
Value: sk-proj-YOUR_ACTUAL_API_KEY_HERE
Environments: ✓ Production  ✓ Preview  ✓ Development (check all three)
```

4. Click **"Save"**

### Step 6: Add Database Initialization Token (Optional but Recommended)

1. In **"Settings"** → **"Environment Variables"**, add:

```
Name: INIT_DB_TOKEN
Value: YOUR_SECURE_RANDOM_TOKEN
Environment: Production, Preview, Development
```

Generate a secure token:
```bash
openssl rand -hex 32
```

### Step 7: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for the build to complete

### Step 8: Initialize Database Tables

After deployment, you need to create the database tables:

```bash
# Replace with your Vercel deployment URL
curl -X POST https://your-project.vercel.app/api/init-db \
  -H "Authorization: Bearer YOUR_INIT_DB_TOKEN"
```

You should see:
```json
{
  "success": true,
  "message": "Database tables initialized successfully"
}
```

## 🔒 Environment Variables Summary

Here's a complete list of required environment variables:

| Variable | Required | Source | Description |
|----------|----------|--------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | Manual | Your OpenAI API key |
| `POSTGRES_URL` | ✅ Yes | Auto (Vercel) | Main database connection string |
| `POSTGRES_PRISMA_URL` | ✅ Yes | Auto (Vercel) | Prisma-specific connection string |
| `POSTGRES_URL_NON_POOLING` | ✅ Yes | Auto (Vercel) | Non-pooling connection string |
| `POSTGRES_USER` | ✅ Yes | Auto (Vercel) | Database username |
| `POSTGRES_HOST` | ✅ Yes | Auto (Vercel) | Database host |
| `POSTGRES_PASSWORD` | ✅ Yes | Auto (Vercel) | Database password |
| `POSTGRES_DATABASE` | ✅ Yes | Auto (Vercel) | Database name |
| `INIT_DB_TOKEN` | ⚠️ Optional | Manual | Token to protect init-db endpoint |

### Adding Environment Variables in Vercel

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Settings"** → **"Environment Variables"**
3. For each variable:
   - Enter the **Name** (e.g., `OPENAI_API_KEY`)
   - Enter the **Value** (e.g., `sk-proj-...`)
   - Select **Environments**: Production, Preview, and Development
   - Click **"Save"**

## 📊 Database Structure

The backend uses Vercel Postgres with the following tables:

- `users` - User accounts
- `profiles` - User profiles with interests, goals, and settings
- `memories` - Captured memories (text, file, audio)
- `recommendations` - AI-generated recommendations
- `daily_briefings` - Daily briefings with recaps and actions
- `chat_messages` - Chat history with the AI

## 🔌 API Endpoints

Your backend provides these endpoints:

### Authentication
- `POST /api/auth/signin` - Sign in or create user

### Profile
- `GET /api/profile/get?userId=...` - Get user profile
- `POST /api/profile/create` - Create initial profile
- `POST /api/profile/update` - Update profile

### Memories
- `GET /api/memories/list?userId=...` - List all memories
- `POST /api/memories/create` - Create new memory
- `DELETE /api/memories/delete?userId=...&memoryId=...` - Delete memory

### Recommendations
- `GET /api/recommendations/list?userId=...` - List recommendations
- `POST /api/recommendations/create` - Create recommendation
- `POST /api/recommendations/update` - Update recommendation
- `DELETE /api/recommendations/delete?userId=...&recId=...` - Delete recommendation

### Daily Briefing
- `GET /api/briefing/get?userId=...&date=...` - Get briefing for date
- `POST /api/briefing/generate` - Generate new briefing

### Chat
- `GET /api/chat/history?userId=...` - Get chat history
- `POST /api/chat/message` - Send chat message
- `DELETE /api/chat/clear?userId=...` - Clear chat history

### AI Actions
- `POST /api/ai/action` - Perform AI action (draft, plan, research, list)

## 🧪 Testing Your Deployment

Test the API:

```bash
# Test sign in
curl -X POST https://your-project.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## 🔧 Troubleshooting

### Database Connection Errors

If you see database connection errors:
1. Verify Postgres storage is created in Vercel
2. Check that environment variables are set
3. Redeploy after adding environment variables

### OpenAI API Errors

If you see OpenAI errors:
1. Verify your API key is correct
2. Check your OpenAI account has credits
3. Ensure the key has proper permissions

### Build Failures

If the build fails:
1. Check the build logs in Vercel
2. Verify all dependencies are in package.json
3. Make sure `vercel.json` is configured correctly

## 📱 Frontend Integration

The frontend needs to be updated to use the backend APIs. Currently, it uses localStorage.

A new frontend service layer is needed to replace the current localStorage implementation with API calls.

## 🔄 Continuous Deployment

Once set up, Vercel will automatically:
- Deploy when you push to your GitHub repository
- Run builds with the latest code
- Use environment variables from the project settings

## 💰 Cost Considerations

- **Vercel**: Free tier includes hosting + serverless functions
- **Vercel Postgres**: Free tier includes 256 MB storage
- **OpenAI API**: Pay-per-use pricing
  - GPT-4o: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
  - Estimate: $0.01-0.10 per user per day depending on usage

## 🎉 You're Done!

Your Continuum backend is now deployed on Vercel with:
- ✅ Serverless API functions
- ✅ Postgres database for persistent storage
- ✅ OpenAI integration for AI features
- ✅ Automatic deployments from Git

## 📚 Next Steps

1. Update the frontend to use the backend APIs (see frontend integration guide)
2. Set up monitoring and error tracking
3. Configure custom domain (optional)
4. Set up email notifications (optional)

## 🆘 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [OpenAI API Docs](https://platform.openai.com/docs)
