import api from './api';
import { LLMMessage, LLMGuidance, QuickInsight } from '../types';

// Mock data for LLM guidance
export const mockLLMGuidance: LLMGuidance = {
  id: 'guidance_1',
  symbol: 'BTCUSDT',
  analysis: {
    sentiment: 'bullish',
    confidence: 78,
    summary: 'Bitcoin is showing strong bullish momentum with increasing volume and positive delta accumulation. Price action suggests continuation of uptrend with potential consolidation near resistance levels.',
    keyPoints: [
      'Strong buy pressure evident in order flow data',
      'Positive cumulative delta indicating buyer dominance',
      'Volume profile shows healthy distribution with POC at $67,800',
      'RSI showing strength but not yet overbought',
      'Key resistance at $69,500, support at $66,200'
    ]
  },
  recommendations: {
    action: 'buy',
    entryPrice: 67500,
    stopLoss: 66000,
    takeProfit: 69800,
    positionSize: '2-3% of portfolio',
    reasoning: 'Current price action and order flow suggest a favorable risk-reward ratio. Entry near current levels with tight stop below recent support provides asymmetric upside potential. Consider scaling into position on minor pullbacks.'
  },
  risks: {
    level: 'medium',
    factors: [
      'Approaching major resistance zone at $69,500',
      'Global macro uncertainty may impact crypto markets',
      'Potential for short-term profit-taking at current levels',
      'Watch for divergence in volume and price action'
    ]
  },
  timestamp: new Date().toISOString()
};

export const mockQuickInsights: QuickInsight[] = [
  {
    id: 'insight_1',
    type: 'sentiment',
    title: 'Market Sentiment: Bullish',
    description: 'Order flow showing strong buying pressure with 68% buy dominance',
    icon: 'TrendingUp',
    color: 'text-green-500',
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'insight_2',
    type: 'level',
    title: 'Key Support at $66,200',
    description: 'Strong accumulation zone identified with high volume cluster',
    icon: 'Shield',
    color: 'text-blue-500',
    timestamp: new Date(Date.now() - 600000).toISOString()
  },
  {
    id: 'insight_3',
    type: 'pattern',
    title: 'Bullish Flag Pattern',
    description: 'Classic continuation pattern forming on 4H timeframe',
    icon: 'Flag',
    color: 'text-purple-500',
    timestamp: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: 'insight_4',
    type: 'tip',
    title: 'Volume Confirmation',
    description: 'Above-average volume supporting the current price move',
    icon: 'BarChart3',
    color: 'text-amber-500',
    timestamp: new Date(Date.now() - 1200000).toISOString()
  }
];

export const mockChatHistory: LLMMessage[] = [
  {
    id: 'msg_1',
    role: 'assistant',
    content: "Hello! I'm your AI trading assistant. I can help you analyze market conditions, understand order flow, and provide trading guidance. How can I assist you today?",
    timestamp: new Date(Date.now() - 3600000).toISOString()
  }
];

// Description: Send a message to the LLM trading assistant
// Endpoint: POST /api/llm/chat
// Request: { message: string, symbol?: string }
// Response: { message: LLMMessage }
export const sendLLMMessage = async (message: string, symbol?: string): Promise<LLMMessage> => {
  try {
    console.log('[LLM API] Sending message to backend:', { message: message.substring(0, 50), symbol });

    const response = await api.post('/api/llm/chat', {
      message,
      symbol: symbol || 'BTCUSDT',
    });

    console.log('[LLM API] Received response from backend:', response.data.message);
    return response.data.message;
  } catch (error: any) {
    console.error('[LLM API] Error sending message:', error);
    throw new Error(error?.response?.data?.error || error.message || 'Failed to send message');
  }
};

// Description: Get AI-generated trading guidance for a symbol
// Endpoint: GET /api/llm/guidance
// Request: { symbol: string }
// Response: { guidance: LLMGuidance }
export const getLLMGuidance = async (symbol: string): Promise<LLMGuidance> => {
  try {
    console.log('[LLM API] Fetching guidance from backend for:', symbol);

    const response = await api.get('/api/llm/guidance', {
      params: { symbol },
    });

    console.log('[LLM API] Received guidance from backend:', response.data.guidance);
    return response.data.guidance;
  } catch (error: any) {
    console.error('[LLM API] Error fetching guidance:', error);
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch guidance');
  }
};

// Description: Get quick AI-generated market insights
// Endpoint: GET /api/llm/insights
// Request: { symbol?: string, limit?: number }
// Response: { insights: QuickInsight[] }
export const getQuickInsights = async (symbol?: string, limit: number = 4): Promise<QuickInsight[]> => {
  try {
    console.log('[LLM API] Fetching quick insights from backend for:', symbol);

    const response = await api.get('/api/llm/insights', {
      params: { symbol, limit },
    });

    console.log('[LLM API] Received insights from backend:', response.data.insights);
    return response.data.insights;
  } catch (error: any) {
    console.error('[LLM API] Error fetching insights:', error);
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch insights');
  }
};

// Description: Get chat history with the AI assistant
// Endpoint: GET /api/llm/history
// Request: { limit?: number }
// Response: { messages: LLMMessage[] }
export const getChatHistory = async (limit: number = 50): Promise<LLMMessage[]> => {
  try {
    console.log('[LLM API] Fetching chat history from backend, limit:', limit);

    const response = await api.get('/api/llm/history', {
      params: { limit },
    });

    console.log('[LLM API] Received chat history from backend:', response.data.messages);
    return response.data.messages;
  } catch (error: any) {
    console.error('[LLM API] Error fetching chat history:', error);
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch chat history');
  }
};
