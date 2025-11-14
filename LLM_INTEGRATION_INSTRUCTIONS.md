# LLM Integration Instructions

## Overview
The LLM Trading Guidance feature has been successfully integrated into the DeltaSpec frontend and backend. The frontend now makes real API calls to the backend instead of using mock data. However, **one critical backend file needs to be updated** to register the new LLM routes.

## ✅ Completed Work

### Backend Files Created:

1. **`server/models/LLMConversation.ts`** - MongoDB model for storing chat conversations
   - Stores user ID, symbol, and message history
   - Includes metadata for sentiment, confidence, and tags
   - Indexed for performance on userId and symbol

2. **`server/models/LLMGuidance.ts`** - MongoDB model for storing AI trading guidance
   - Stores analysis, recommendations, and risk assessments
   - Structured data for sentiment, confidence, key points
   - Indexed for efficient user and symbol queries

3. **`server/services/llmController.ts`** - Business logic for LLM operations
   - `sendChatMessage()` - Handles chat interactions with AI
   - `generateGuidance()` - Creates comprehensive trading analysis
   - `getChatHistory()` - Retrieves conversation history
   - `generateQuickInsights()` - Generates market insights
   - Integrates with existing `llmService.ts` for OpenAI/Anthropic calls
   - Includes fallback responses if LLM API fails

4. **`server/routes/llmRoutes.ts`** - API endpoints for LLM features
   - `POST /api/llm/chat` - Send messages to AI assistant
   - `GET /api/llm/guidance` - Get trading guidance for a symbol
   - `GET /api/llm/insights` - Get quick market insights
   - `GET /api/llm/history` - Get chat conversation history
   - All routes protected with `requireUser()` middleware

### Frontend Files Updated:

1. **`client/src/api/llmGuidance.ts`** - Updated to call real backend APIs
   - Replaced all mock data implementations with real API calls
   - Uses axios client from `api.ts` for authenticated requests
   - Includes comprehensive error handling and logging
   - All functions now call backend endpoints

## 🔧 Required Action: Update server.ts

**File:** `server/server.ts`

You need to add the LLM routes to the Express server. Here's what needs to be changed:

### Step 1: Import the LLM routes

Add this import at the top of the file (around line 5, after the other route imports):

```typescript
import llmRoutes from './routes/llmRoutes';
```

### Step 2: Register the LLM routes

Add this line after the auth routes (around line 40, after `app.use('/api/auth', authRoutes);`):

```typescript
// LLM Routes
app.use('/api/llm', llmRoutes);
```

### Complete Updated server.ts File:

```typescript
import dotenv from 'dotenv';
import express from 'express';
import { Request, Response } from 'express';
import basicRoutes from './routes/index';
import authRoutes from './routes/authRoutes';
import llmRoutes from './routes/llmRoutes';  // ← ADD THIS LINE
import { connectDB } from './config/database';
import cors from 'cors';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL variables in .env missing.");
  process.exit(-1);
}

const app = express();
const port = process.env.PORT || 3000;

// Pretty-print JSON responses
app.enable('json spaces');
// We want to be consistent with URL paths, so we enable strict routing
app.enable('strict routing');

app.use(cors({}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

app.on("error", (error: Error) => {
  console.error(`Server error: ${error.message}`);
  console.error(error.stack);
});

// Basic Routes
app.use(basicRoutes);
// Authentication Routes
app.use('/api/auth', authRoutes);
// LLM Routes
app.use('/api/llm', llmRoutes);  // ← ADD THIS LINE

// If no routes handled the request, it's a 404
app.use((req: Request, res: Response) => {
  res.status(404).send("Page not found.");
});

// Error handling
app.use((err: Error, req: Request, res: Response) => {
  console.error(`Unhandled application error: ${err.message}`);
  console.error(err.stack);
  res.status(500).send("There was an error serving your request.");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
```

## 🔑 Environment Variables (Optional)

To use real AI providers (OpenAI or Anthropic), add these to your `server/.env` file:

```env
# LLM Configuration (Optional - will use fallback responses if not provided)
LLM_PROVIDER=openai
LLM_MODEL=gpt-3.5-turbo
OPENAI_API_KEY=your_openai_api_key_here

# OR for Anthropic
# LLM_PROVIDER=anthropic
# LLM_MODEL=claude-3-sonnet-20240229
# ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

**Note:** The system will work without these API keys by providing intelligent fallback responses. The LLM integration is designed to be resilient and handle API failures gracefully.

## 🎯 API Endpoints Reference

### POST /api/llm/chat
Send a message to the AI trading assistant.

**Request:**
```json
{
  "message": "Should I buy Bitcoin now?",
  "symbol": "BTCUSDT"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg_1234567890",
    "role": "assistant",
    "content": "Based on current market conditions...",
    "timestamp": "2025-11-14T17:45:43.385Z",
    "metadata": {
      "symbol": "BTCUSDT",
      "confidence": 85,
      "sentiment": "bullish",
      "tags": ["analysis", "recommendation"]
    }
  }
}
```

### GET /api/llm/guidance
Get comprehensive AI-generated trading guidance.

**Request:** `GET /api/llm/guidance?symbol=BTCUSDT`

**Response:**
```json
{
  "guidance": {
    "id": "guidance_123",
    "symbol": "BTCUSDT",
    "analysis": {
      "sentiment": "bullish",
      "confidence": 78,
      "summary": "Bitcoin is showing strong momentum...",
      "keyPoints": ["Point 1", "Point 2", "Point 3"]
    },
    "recommendations": {
      "action": "buy",
      "entryPrice": 67500,
      "stopLoss": 66000,
      "takeProfit": 69800,
      "positionSize": "2-3% of portfolio",
      "reasoning": "Current price action suggests..."
    },
    "risks": {
      "level": "medium",
      "factors": ["Risk 1", "Risk 2"]
    },
    "timestamp": "2025-11-14T17:45:40.604Z"
  }
}
```

### GET /api/llm/insights
Get quick market insights.

**Request:** `GET /api/llm/insights?symbol=BTCUSDT&limit=4`

**Response:**
```json
{
  "insights": [
    {
      "id": "insight_1",
      "type": "sentiment",
      "title": "Market Sentiment: Bullish",
      "description": "Order flow showing strong buying pressure",
      "icon": "TrendingUp",
      "color": "text-green-500",
      "timestamp": "2025-11-14T17:45:40.604Z"
    }
  ]
}
```

### GET /api/llm/history
Get chat conversation history.

**Request:** `GET /api/llm/history?limit=50`

**Response:**
```json
{
  "messages": [
    {
      "id": "msg_1",
      "role": "assistant",
      "content": "Hello! I'm your AI trading assistant...",
      "timestamp": "2025-11-14T17:45:40.604Z"
    }
  ]
}
```

## 🧪 Testing the Integration

After updating `server.ts`:

1. **Restart the backend server** (it should auto-restart with tsx watch)
2. **Navigate to the AI Guidance tab** in the DeltaSpec dashboard
3. **Try sending a message** like "Should I buy now?" or "What are the risks?"
4. **Check the console logs** - you should see:
   - Frontend: `[LLM API] Sending message to backend`
   - Backend: `[LLM Routes] POST /api/llm/chat`
   - Backend: `[LLM Controller] Sending chat message`

## 🐛 Current Status

**Frontend:** ✅ Fully updated and working
**Backend Models:** ✅ Created and ready
**Backend Services:** ✅ Created and ready
**Backend Routes:** ✅ Created and ready
**Server Registration:** ⚠️ **NEEDS UPDATE** (see above)

Once `server.ts` is updated with the LLM routes, the integration will be complete and functional!

## 📊 Expected Behavior

Once the integration is complete:

1. **Chat Interface:**
   - Users can send messages to the AI assistant
   - Messages are stored in MongoDB with full history
   - AI responses are generated using OpenAI/Anthropic (or fallback logic)
   - All conversations are user-specific and persist across sessions

2. **Guidance Panel:**
   - Shows comprehensive trading analysis for the selected symbol
   - Includes sentiment, confidence, key points, and recommendations
   - Updates when symbol changes or refresh is clicked
   - Data is cached and retrieved from MongoDB

3. **Quick Insights:**
   - Displays 4 dynamic market insights
   - Updates with fresh timestamps on refresh
   - Shows different types: sentiment, levels, patterns, tips

4. **Data Persistence:**
   - All conversations saved to MongoDB
   - Guidance history maintained per user and symbol
   - Easy retrieval of past analyses and recommendations

## 🔄 Error Handling

The system includes robust error handling:

- **API Failures:** Falls back to intelligent default responses
- **Missing API Keys:** System works without external LLM providers
- **Network Issues:** Graceful error messages to users
- **Authentication:** All endpoints require user authentication
- **Rate Limiting:** Retry logic with exponential backoff

## 📝 Logging

Both frontend and backend include comprehensive logging:

- Request/response logging for debugging
- Error logging with stack traces
- Performance timing for LLM calls
- User action tracking

Check browser console (frontend) and terminal (backend) for detailed logs.

---

**Summary:** Update `server/server.ts` by adding the two lines mentioned above (import and app.use), restart the server, and the LLM integration will be fully functional! 🚀
