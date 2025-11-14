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
// Request: { message: string, symbol?: string, context?: object }
// Response: { message: LLMMessage }
export const sendLLMMessage = async (message: string, symbol?: string): Promise<LLMMessage> => {
  try {
    console.log('[LLM API] Sending message:', { message, symbol });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock response based on message content
    let responseContent = '';
    let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100

    const messageLower = message.toLowerCase();

    if (messageLower.includes('analysis') || messageLower.includes('analyze')) {
      sentiment = 'bullish';
      responseContent = `Based on the current order flow data for ${symbol || 'BTCUSDT'}, I'm observing:\n\n• Strong buying pressure with positive cumulative delta\n• Volume profile showing healthy distribution\n• Key support level holding at $66,200\n• Momentum indicators suggesting continuation\n\nThe market structure remains bullish with a ${confidence}% confidence level. Consider scaling into positions on minor pullbacks with tight risk management.`;
    } else if (messageLower.includes('buy') || messageLower.includes('entry')) {
      sentiment = 'bullish';
      responseContent = `For ${symbol || 'BTCUSDT'}, here's my entry recommendation:\n\n**Entry Strategy:**\n• Primary entry: $67,400 - $67,600\n• Secondary entry (on pullback): $66,800 - $67,000\n• Stop loss: Below $66,000\n• Take profit targets: $68,500 (TP1), $69,500 (TP2)\n\n**Position Sizing:** 2-3% of portfolio\n\nRationale: Current price action shows strong buyer interest with increasing volume. Risk-reward ratio is favorable at these levels.`;
    } else if (messageLower.includes('risk') || messageLower.includes('danger')) {
      responseContent = `**Risk Assessment for ${symbol || 'BTCUSDT'}:**\n\n**Current Risk Level: Medium**\n\n**Key Risk Factors:**\n1. Approaching major resistance at $69,500\n2. Potential short-term profit-taking pressure\n3. Watch for volume divergence signals\n4. Global macro conditions may impact sentiment\n\n**Risk Mitigation:**\n• Use proper position sizing (2-3% max)\n• Set stop loss below key support at $66,000\n• Consider taking partial profits at resistance levels\n• Monitor order flow for signs of distribution`;
    } else if (messageLower.includes('sell') || messageLower.includes('exit')) {
      sentiment = 'bearish';
      responseContent = `**Exit Strategy for ${symbol || 'BTCUSDT'}:**\n\n**Scenario Analysis:**\n\n*Bullish Exit (Take Profits):*\n• First target: $68,500 (take 30-40%)\n• Second target: $69,500 (take 30-40%)\n• Let remaining position run with trailing stop\n\n*Bearish Exit (Cut Losses):*\n• If price breaks below $66,000 with volume\n• If cumulative delta turns negative on higher timeframes\n• If we see aggressive selling in order book\n\nCurrent recommendation: Hold positions with stop at $66,000.`;
    } else if (messageLower.includes('support') || messageLower.includes('resistance')) {
      responseContent = `**Key Levels for ${symbol || 'BTCUSDT'}:**\n\n**Resistance Zones:**\n🔴 $69,500 - Major resistance, high volume cluster\n🟠 $68,800 - Intermediate resistance\n🟡 $68,200 - Minor resistance\n\n**Support Zones:**\n🟢 $67,000 - Immediate support\n🔵 $66,200 - Strong support (POC)\n🟣 $65,500 - Major support zone\n\n**Analysis:** Price is currently trading between key support at $66,200 and resistance at $69,500. Volume profile suggests buyers are defending the $66,200 level aggressively.`;
    } else {
      responseContent = `I'm analyzing ${symbol || 'BTCUSDT'} for you. Current market conditions show ${sentiment} sentiment with ${confidence}% confidence.\n\nKey observations:\n• Order flow data indicates ${sentiment === 'bullish' ? 'buying' : sentiment === 'bearish' ? 'selling' : 'balanced'} pressure\n• Volume profile supports current price structure\n• Delta metrics are ${sentiment === 'bullish' ? 'positive' : sentiment === 'bearish' ? 'negative' : 'neutral'}\n\nWould you like me to provide specific entry/exit recommendations or perform a detailed risk assessment?`;
    }

    const response: LLMMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date().toISOString(),
      metadata: {
        symbol: symbol || 'BTCUSDT',
        confidence,
        sentiment,
        tags: ['analysis', 'recommendation']
      }
    };

    console.log('[LLM API] Response generated:', response);
    return response;
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
    console.log('[LLM API] Fetching guidance for:', symbol);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Generate dynamic mock data based on symbol
    const sentiments: Array<'bullish' | 'bearish' | 'neutral'> = ['bullish', 'bearish', 'neutral'];
    const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
    const confidence = Math.floor(Math.random() * 30) + 65; // 65-95

    const guidance: LLMGuidance = {
      ...mockLLMGuidance,
      id: `guidance_${Date.now()}`,
      symbol,
      analysis: {
        ...mockLLMGuidance.analysis,
        sentiment: randomSentiment,
        confidence,
        summary: `${symbol} is showing ${randomSentiment} momentum with ${confidence}% confidence. ${
          randomSentiment === 'bullish'
            ? 'Strong buy pressure and positive delta accumulation suggest continuation of uptrend.'
            : randomSentiment === 'bearish'
            ? 'Selling pressure increasing with negative delta, suggesting potential downside.'
            : 'Market is consolidating with balanced order flow, waiting for directional catalyst.'
        }`
      },
      timestamp: new Date().toISOString()
    };

    console.log('[LLM API] Guidance generated:', guidance);
    return guidance;
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
    console.log('[LLM API] Fetching quick insights for:', symbol);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock insights with updated timestamps
    const insights = mockQuickInsights.slice(0, limit).map(insight => ({
      ...insight,
      timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
    }));

    console.log('[LLM API] Quick insights generated:', insights);
    return insights;
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
    console.log('[LLM API] Fetching chat history, limit:', limit);

    // Return mock chat history
    return mockChatHistory.slice(0, limit);
  } catch (error: any) {
    console.error('[LLM API] Error fetching chat history:', error);
    throw new Error(error?.response?.data?.error || error.message || 'Failed to fetch chat history');
  }
};
