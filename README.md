# Continuum 2.0 - Intelligent Memory Platform

An intelligent memory platform that builds a living user profile from inputs and provides proactive, contextual recommendations. Now with backend storage and OpenAI integration.

## 🚀 Features

- **Smart User Profiles** - AI-powered profiles that evolve with your captured content
- **Multi-format Memory Capture** - Text, file uploads (PDFs, docs), and audio recording
- **Intelligent Analysis** - OpenAI-powered content analysis and insights
- **Daily Briefings** - Personalized daily summaries with actionable items
- **AI Assistant** - Draft emails, create plans, research topics, and more
- **Memory-based Chat** - Chat with an AI that knows your complete history (RAG)
- **Backend Storage** - Persistent storage with Vercel Postgres
- **Push Notifications** - Daily briefing notifications at 7 PM MST

## 🏗️ Architecture

### Frontend
- **Framework:** React 19 + Vite
- **Language:** TypeScript
- **UI:** Tailwind CSS + Lucide Icons
- **State:** React Context API

### Backend
- **Platform:** Vercel Serverless Functions
- **Database:** Vercel Postgres
- **AI:** OpenAI GPT-4o
- **Runtime:** Node.js 20

## 📁 Project Structure

```
Continuum2.0/
├── api/                          # Backend API
│   ├── lib/
│   │   ├── db.ts                # Database operations
│   │   └── openai.ts            # OpenAI integration
│   ├── auth/
│   │   └── signin.ts            # User authentication
│   ├── profile/
│   │   ├── get.ts              # Get profile
│   │   ├── create.ts           # Create profile
│   │   └── update.ts           # Update profile
│   ├── memories/
│   │   ├── list.ts             # List memories
│   │   ├── create.ts           # Create memory
│   │   └── delete.ts           # Delete memory
│   ├── recommendations/
│   │   ├── list.ts             # List recommendations
│   │   ├── create.ts           # Create recommendation
│   │   ├── update.ts           # Update recommendation
│   │   └── delete.ts           # Delete recommendation
│   ├── briefing/
│   │   ├── get.ts              # Get briefing
│   │   └── generate.ts         # Generate briefing
│   ├── chat/
│   │   ├── history.ts          # Get chat history
│   │   ├── message.ts          # Send message
│   │   └── clear.ts            # Clear history
│   ├── ai/
│   │   └── action.ts           # AI actions
│   └── init-db.ts              # Database initialization
├── continuum/                   # Frontend application
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── contexts/           # React contexts
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   └── types.ts            # TypeScript types
│   ├── index.html
│   └── vite.config.ts
├── vercel.json                 # Vercel configuration
├── .env.example                # Environment variables template
├── VERCEL_DEPLOYMENT_GUIDE.md  # Deployment instructions
├── FRONTEND_MIGRATION_GUIDE.md # Frontend migration guide
└── README.md                   # This file
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+ and npm
- Vercel account
- OpenAI API key

### Local Development

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd Continuum2.0
```

2. **Install dependencies:**
```bash
npm install
cd continuum && npm install && cd ..
```

3. **Set up environment variables:**

Create `continuum/.env.local`:
```bash
VITE_API_URL=http://localhost:3000
```

Create `.env` in root (for API functions):
```bash
OPENAI_API_KEY=sk-proj-your-key-here
POSTGRES_URL=your-postgres-url
# ... other Postgres variables
```

4. **Run locally with Vercel CLI:**
```bash
npm install -g vercel
vercel dev
```

This will run both frontend and backend locally.

## 🚢 Deployment to Vercel

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deploy Steps

1. **Push to GitHub:**
```bash
git add .
git commit -m "Setup backend infrastructure"
git push
```

2. **Connect to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect settings from `vercel.json`

3. **Add Vercel Postgres:**
   - In project settings, go to Storage → Create Database → Postgres
   - Vercel automatically adds database environment variables

4. **Add OpenAI API Key:**
   - Settings → Environment Variables
   - Add `OPENAI_API_KEY` with your OpenAI key

5. **Deploy:**
   - Click Deploy
   - Once deployed, initialize the database:
   ```bash
   curl -X POST https://your-project.vercel.app/api/init-db \
     -H "Authorization: Bearer your-init-token"
   ```

## 📊 Database Schema

### Tables

- **users** - User accounts (id, email, name)
- **profiles** - User profiles (location, summary, interests, goals, concerns, key_facts, settings)
- **memories** - Captured memories (content, summary, topics, entities, intent)
- **recommendations** - AI recommendations (title, description, category, priority, action_items)
- **daily_briefings** - Daily briefings (recap, pending_actions, recommendations)
- **chat_messages** - Chat history (role, content, timestamp)

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in or create user

### Profile
- `GET /api/profile/get?userId=...` - Get profile
- `POST /api/profile/create` - Create initial profile
- `POST /api/profile/update` - Update profile

### Memories
- `GET /api/memories/list?userId=...` - List memories
- `POST /api/memories/create` - Create memory
- `DELETE /api/memories/delete?userId=...&memoryId=...` - Delete memory

### Recommendations
- `GET /api/recommendations/list?userId=...` - List recommendations
- `POST /api/recommendations/create` - Create recommendation
- `POST /api/recommendations/update` - Update recommendation
- `DELETE /api/recommendations/delete?userId=...&recId=...` - Delete recommendation

### Daily Briefing
- `GET /api/briefing/get?userId=...&date=...` - Get briefing
- `POST /api/briefing/generate` - Generate briefing

### Chat
- `GET /api/chat/history?userId=...` - Get chat history
- `POST /api/chat/message` - Send message
- `DELETE /api/chat/clear?userId=...` - Clear history

### AI Actions
- `POST /api/ai/action` - Perform AI action (draft, plan, research, list)

## 🔐 Environment Variables

Required environment variables for deployment:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | Your OpenAI API key |
| `POSTGRES_URL` | ✅ | Postgres connection URL (auto-added by Vercel) |
| `POSTGRES_PRISMA_URL` | ✅ | Prisma connection URL (auto-added by Vercel) |
| `POSTGRES_URL_NON_POOLING` | ✅ | Non-pooling URL (auto-added by Vercel) |
| `POSTGRES_USER` | ✅ | Database user (auto-added by Vercel) |
| `POSTGRES_HOST` | ✅ | Database host (auto-added by Vercel) |
| `POSTGRES_PASSWORD` | ✅ | Database password (auto-added by Vercel) |
| `POSTGRES_DATABASE` | ✅ | Database name (auto-added by Vercel) |
| `INIT_DB_TOKEN` | ⚠️ Optional | Token for database initialization |
| `VITE_API_URL` | ⚠️ Dev only | API URL for local development |

## 🎨 Frontend Migration

The frontend currently uses localStorage and needs to be migrated to use the backend APIs.

See [FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md) for detailed migration instructions.

### Quick Migration Overview

1. **Import API service:**
```typescript
import { profileAPI, memoriesAPI, chatAPI } from '../services/apiService';
```

2. **Replace localStorage calls:**
```typescript
// OLD
const profile = JSON.parse(localStorage.getItem('continuum_profile_...'));

// NEW
const { profile } = await profileAPI.get(userId);
```

3. **Update all contexts and pages** to use API calls instead of localStorage

## 💰 Cost Estimates

### Vercel
- **Hosting:** Free tier includes 100GB bandwidth
- **Serverless Functions:** 100GB-hrs free per month
- **Postgres:** Free tier includes 256MB storage

### OpenAI
- **GPT-4o Pricing:**
  - Input: ~$2.50 per 1M tokens
  - Output: ~$10 per 1M tokens
- **Estimated cost:** $0.01-0.10 per user per day depending on usage

## 🧪 Testing

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Test profile creation
curl -X POST http://localhost:3000/api/profile/create \
  -H "Content-Type: application/json" \
  -d '{"userId":"user_test","name":"Test","location":"Denver","role":"Developer","goals":"Build apps","interests":"Tech"}'
```

## 📝 Development Workflow

1. **Make changes** to API or frontend
2. **Test locally** with `vercel dev`
3. **Commit changes** to Git
4. **Push to GitHub**
5. **Vercel auto-deploys** from main branch

## 🐛 Troubleshooting

### Database Connection Errors
- Ensure Postgres storage is created in Vercel
- Check environment variables are set
- Redeploy after adding variables

### OpenAI API Errors
- Verify API key is correct
- Check OpenAI account has credits
- Ensure key has proper permissions

### Build Failures
- Check build logs in Vercel
- Verify all dependencies in package.json
- Ensure vercel.json is configured correctly

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres Docs](https://vercel.com/docs/storage/vercel-postgres)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🆘 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the deployment guide
3. Check Vercel logs for errors
4. Open an issue on GitHub

## 🎯 Roadmap

- [ ] Migrate frontend from localStorage to backend APIs
- [ ] Add proper user authentication (JWT)
- [ ] Implement email notifications
- [ ] Add data export/import functionality
- [ ] Create admin dashboard
- [ ] Add usage analytics
- [ ] Implement rate limiting
- [ ] Add caching layer
- [ ] Create mobile app
- [ ] Add team collaboration features

---

Built with ❤️ using React, TypeScript, OpenAI, and Vercel
