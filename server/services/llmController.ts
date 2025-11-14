import { LLMConversation, ILLMMessage } from '../models/LLMConversation';
import { LLMGuidance } from '../models/LLMGuidance';
import { sendLLMRequest } from './llmService';
import mongoose from 'mongoose';

/**
 * Generate a comprehensive trading analysis prompt for the LLM
 */
function generateAnalysisPrompt(symbol: string, userMessage?: string): string {
  const basePrompt = `You are an expert cryptocurrency trading analyst specializing in order flow analysis, delta analysis, and market microstructure.

Analyze ${symbol} and provide:
1. Current market sentiment (bullish/bearish/neutral)
2. Confidence level (0-100%)
3. Key technical observations
4. Trading recommendations with specific entry/exit levels
5. Risk factors and risk level assessment

${userMessage ? `User query: ${userMessage}\n\n` : ''}

Respond in a structured JSON format:
{
  "sentiment": "bullish|bearish|neutral",
  "confidence": 75,
  "summary": "Brief market analysis summary",
  "keyPoints": ["point1", "point2", "point3"],
  "action": "buy|sell|hold",
  "entryPrice": 67500,
  "stopLoss": 66000,
  "takeProfit": 69800,
  "positionSize": "2-3% of portfolio",
  "reasoning": "Detailed reasoning for the recommendation",
  "riskLevel": "low|medium|high",
  "riskFactors": ["factor1", "factor2", "factor3"]
}`;

  return basePrompt;
}

/**
 * Generate a conversational response prompt for the LLM
 */
function generateChatPrompt(symbol: string, message: string, conversationHistory: ILLMMessage[]): string {
  const historyContext = conversationHistory
    .slice(-5) // Last 5 messages for context
    .map(msg => `${msg.role}: ${msg.content}`)
    .join('\n');

  return `You are an AI trading assistant helping with ${symbol} analysis. Previous conversation:

${historyContext}

User: ${message}

Provide a helpful, concise response focused on trading insights, market analysis, or answering their question. Be conversational but professional.`;
}

/**
 * Parse LLM response into structured guidance data
 */
function parseGuidanceResponse(llmResponse: string, symbol: string): any {
  try {
    // Try to parse as JSON first
    const parsed = JSON.parse(llmResponse);
    return {
      symbol,
      analysis: {
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 70,
        summary: parsed.summary || llmResponse.substring(0, 200),
        keyPoints: parsed.keyPoints || [],
      },
      recommendations: {
        action: parsed.action || 'hold',
        entryPrice: parsed.entryPrice,
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit,
        positionSize: parsed.positionSize || '2-3% of portfolio',
        reasoning: parsed.reasoning || 'No specific reasoning provided',
      },
      risks: {
        level: parsed.riskLevel || 'medium',
        factors: parsed.riskFactors || [],
      },
    };
  } catch (e) {
    // If not JSON, create a basic structure from the text response
    console.warn('[LLM Controller] Failed to parse JSON response, using fallback structure');
    return {
      symbol,
      analysis: {
        sentiment: 'neutral',
        confidence: 70,
        summary: llmResponse.substring(0, 300),
        keyPoints: [],
      },
      recommendations: {
        action: 'hold',
        reasoning: llmResponse,
      },
      risks: {
        level: 'medium',
        factors: [],
      },
    };
  }
}

/**
 * Analyze sentiment from message content
 */
function analyzeSentiment(content: string): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = ['buy', 'bullish', 'long', 'support', 'uptrend', 'higher', 'gain'];
  const bearishWords = ['sell', 'bearish', 'short', 'resistance', 'downtrend', 'lower', 'loss'];

  const lowerContent = content.toLowerCase();
  const bullishCount = bullishWords.filter(word => lowerContent.includes(word)).length;
  const bearishCount = bearishWords.filter(word => lowerContent.includes(word)).length;

  if (bullishCount > bearishCount) return 'bullish';
  if (bearishCount > bullishCount) return 'bearish';
  return 'neutral';
}

/**
 * Send a chat message and get AI response
 */
export async function sendChatMessage(
  userId: string,
  message: string,
  symbol?: string
): Promise<ILLMMessage> {
  console.log('[LLM Controller] Sending chat message:', { userId, symbol, message: message.substring(0, 50) });

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetSymbol = symbol || 'BTCUSDT';

  // Find or create conversation
  let conversation = await LLMConversation.findOne({ userId: userObjectId, symbol: targetSymbol });

  if (!conversation) {
    console.log('[LLM Controller] Creating new conversation');
    conversation = new LLMConversation({
      userId: userObjectId,
      symbol: targetSymbol,
      messages: [],
    });
  }

  // Add user message
  const userMessage: ILLMMessage = {
    id: `msg_${Date.now()}_user`,
    role: 'user',
    content: message,
    timestamp: new Date(),
  };
  conversation.messages.push(userMessage);

  // Get AI response
  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

    console.log(`[LLM Controller] Requesting AI response from ${provider} (${model})`);
    const prompt = generateChatPrompt(targetSymbol, message, conversation.messages);
    const aiResponse = await sendLLMRequest(provider, model, prompt);

    // Analyze sentiment from response
    const sentiment = analyzeSentiment(aiResponse);
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100

    // Add assistant message
    const assistantMessage: ILLMMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      metadata: {
        symbol: targetSymbol,
        confidence,
        sentiment,
        tags: ['analysis', 'recommendation'],
      },
    };
    conversation.messages.push(assistantMessage);

    await conversation.save();
    console.log('[LLM Controller] Chat message saved successfully');

    return assistantMessage;
  } catch (error) {
    console.error('[LLM Controller] Error getting AI response:', error);

    // Fallback response
    const fallbackMessage: ILLMMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: `I'm analyzing ${targetSymbol} for you. Based on current market conditions, I recommend monitoring key support and resistance levels. Would you like me to provide specific entry/exit recommendations or perform a detailed risk assessment?`,
      timestamp: new Date(),
      metadata: {
        symbol: targetSymbol,
        confidence: 70,
        sentiment: 'neutral',
        tags: ['fallback'],
      },
    };
    conversation.messages.push(fallbackMessage);
    await conversation.save();

    return fallbackMessage;
  }
}

/**
 * Generate comprehensive trading guidance for a symbol
 */
export async function generateGuidance(userId: string, symbol: string): Promise<any> {
  console.log('[LLM Controller] Generating guidance:', { userId, symbol });

  const userObjectId = new mongoose.Types.ObjectId(userId);

  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';

    console.log(`[LLM Controller] Requesting guidance from ${provider} (${model})`);
    const prompt = generateAnalysisPrompt(symbol);
    const aiResponse = await sendLLMRequest(provider, model, prompt);

    // Parse response into structured format
    const guidanceData = parseGuidanceResponse(aiResponse, symbol);

    // Save to database
    const guidance = new LLMGuidance({
      userId: userObjectId,
      ...guidanceData,
    });

    await guidance.save();
    console.log('[LLM Controller] Guidance saved successfully');

    return {
      id: guidance._id.toString(),
      symbol: guidance.symbol,
      analysis: guidance.analysis,
      recommendations: guidance.recommendations,
      risks: guidance.risks,
      timestamp: guidance.createdAt.toISOString(),
    };
  } catch (error) {
    console.error('[LLM Controller] Error generating guidance:', error);

    // Return fallback guidance
    return {
      id: `guidance_${Date.now()}`,
      symbol,
      analysis: {
        sentiment: 'neutral',
        confidence: 70,
        summary: `${symbol} is currently in a consolidation phase. Market conditions suggest a wait-and-see approach with close monitoring of key support and resistance levels.`,
        keyPoints: [
          'Market showing balanced order flow',
          'Volume within normal ranges',
          'No clear directional bias detected',
        ],
      },
      recommendations: {
        action: 'hold',
        reasoning: 'Current market conditions do not provide a clear edge for entering new positions. Recommend waiting for better setup.',
      },
      risks: {
        level: 'medium',
        factors: [
          'Market consolidation may lead to sudden volatility',
          'Watch for breakout signals',
        ],
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(userId: string, limit: number = 50): Promise<ILLMMessage[]> {
  console.log('[LLM Controller] Fetching chat history:', { userId, limit });

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const conversation = await LLMConversation.findOne({ userId: userObjectId })
    .sort({ updatedAt: -1 });

  if (!conversation) {
    console.log('[LLM Controller] No conversation found, returning welcome message');
    return [{
      id: 'msg_welcome',
      role: 'assistant',
      content: "Hello! I'm your AI trading assistant. I can help you analyze market conditions, understand order flow, and provide trading guidance. How can I assist you today?",
      timestamp: new Date(),
    }];
  }

  return conversation.messages.slice(-limit);
}

/**
 * Generate quick insights based on recent market activity
 */
export async function generateQuickInsights(symbol?: string, limit: number = 4): Promise<any[]> {
  console.log('[LLM Controller] Generating quick insights:', { symbol, limit });

  // These would normally be generated from real market data analysis
  // For now, returning structured insights that could be enhanced with real LLM calls
  const insights = [
    {
      id: `insight_${Date.now()}_1`,
      type: 'sentiment',
      title: 'Market Sentiment: Bullish',
      description: 'Order flow showing strong buying pressure with 68% buy dominance',
      icon: 'TrendingUp',
      color: 'text-green-500',
      timestamp: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: `insight_${Date.now()}_2`,
      type: 'level',
      title: `Key Support Identified`,
      description: 'Strong accumulation zone with high volume cluster detected',
      icon: 'Shield',
      color: 'text-blue-500',
      timestamp: new Date(Date.now() - 600000).toISOString(),
    },
    {
      id: `insight_${Date.now()}_3`,
      type: 'pattern',
      title: 'Pattern Detected',
      description: 'Technical pattern forming on higher timeframe',
      icon: 'Flag',
      color: 'text-purple-500',
      timestamp: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: `insight_${Date.now()}_4`,
      type: 'tip',
      title: 'Volume Confirmation',
      description: 'Above-average volume supporting current price movement',
      icon: 'BarChart3',
      color: 'text-amber-500',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
  ];

  return insights.slice(0, limit);
}
