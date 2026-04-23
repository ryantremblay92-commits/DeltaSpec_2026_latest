import { LLMConversation, ILLMMessage } from '../models/LLMConversation';
import { LLMGuidance } from '../models/LLMGuidance';
import { ChatMessage, sendLLMRequest, streamLLMRequest } from './llmService';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

/**
 * Fetch the latest market snapshot from Redis for a symbol
 */
async function getLatestMarketData(symbol: string): Promise<string> {
  try {
    const ticker = await redis.xrevrange('delta_tickers', '+', '-', 'COUNT', 1);
    const delta = await redis.xrevrange('delta_cumulative_delta', '+', '-', 'COUNT', 1);
    const history = await redis.lrange(`history:${symbol}:price`, 0, 59);
    
    let marketContext = `[LIVE TELEMETRY for ${symbol}]\n`;
    
    if (ticker && ticker.length > 0) {
      const data = ticker[0][1];
      const fields: any = {};
      for (let i = 0; i < data.length; i += 2) fields[data[i]] = data[i+1];
      marketContext += `- CURRENT PRICE: $${fields.mark_price}\n- 24h Vol: ${fields.volume_24h}\n- Liq Price: $${fields.liquidation_price || 'N/A'}\n- OI: ${fields.open_interest || 'N/A'}\n`;
    }
    
    if (delta && delta.length > 0) {
      const data = delta[0][1];
      const fields: any = {};
      for (let i = 0; i < data.length; i += 2) fields[data[i]] = data[i+1];
      marketContext += `- Cum. Delta: ${fields.cumulative_delta}\n- Interval Delta: ${fields.interval_delta}\n`;
    }

    if (history && history.length > 0) {
      const latest = history[0].split('|')[1];
      const tenMinsAgo = history[9] ? history[9].split('|')[1] : 'N/A';
      const sixtyMinsAgo = history[59] ? history[59].split('|')[1] : 'N/A';
      
      marketContext += `[PRICE TREND]\n- 10m ago: $${tenMinsAgo}\n- 60m ago: $${sixtyMinsAgo}\n`;
    }
    
    return marketContext;
  } catch (e) {
    console.error('[LLM Controller] Error fetching market context:', e);
    return '';
  }
}

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
  "action": "buy",
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
async function generateChatPrompt(symbol: string, conversationHistory: ILLMMessage[]): Promise<ChatMessage[]> {
  const marketData = await getLatestMarketData(symbol);
  
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are the DeltaTradeHub AI Intelligence Engine. 
    You have a DIRECT LIVE TELEMETRY FEED from the Delta Exchange. 
    
    IMPORTANT: You must NEVER say you do not have real-time data. You HAVE it right here:
    
    ${marketData}
    
    [DATA GLOSSARY - IMPORTANT]
    - Price: Current market price in USD.
    - Cum. Delta: Net difference between market buy and market sell volume. A positive number means more aggressive buyers. It is NOT a price percentage.
    - Interval Delta: Delta over the last 1-minute period. 
    - OI (Open Interest): The total number of outstanding derivative contracts. 0.0 means data is still loading.
    - Liq Price: The nearest price where a large liquidation may occur. $0.0 means no liquidation risk detected yet.
    
    If any value is 'N/A' or '0.0', state that the data stream is initializing. 
    DO NOT hallucinate price percentages from Delta values. 
    Be clinical, data-driven, and prioritize professional trading logic.`
  };

  const history = conversationHistory
    .slice(-10) // Remember last 10 messages
    .filter(msg => {
      // Filter out past refusals to prevent the AI from getting stuck in a 'I don't have data' loop
      const refusalPatterns = [
        "don't have real-time data",
        "don't have access to real-time",
        "apologize for any confusion",
        "cannot provide the current price"
      ];
      return !refusalPatterns.some(p => msg.content.toLowerCase().includes(p));
    })
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));

  return [systemMessage, ...history];
}

/**
 * Parse LLM response into structured guidance data
 */
function parseGuidanceResponse(llmResponse: string, symbol: string): any {
  try {
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
    console.warn('[LLM Controller] Failed to parse JSON response, using fallback structure');
    return {
      symbol,
      analysis: { sentiment: 'neutral', confidence: 70, summary: llmResponse.substring(0, 300), keyPoints: [] },
      recommendations: { action: 'hold', reasoning: llmResponse },
      risks: { level: 'medium', factors: [] },
    };
  }
}

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

export async function sendChatMessage(userId: string, message: string, symbol?: string): Promise<ILLMMessage> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetSymbol = symbol || 'BTCUSDT';
  let conversation = await LLMConversation.findOne({ userId: userObjectId, symbol: targetSymbol });
  if (!conversation) conversation = new LLMConversation({ userId: userObjectId, symbol: targetSymbol, messages: [] });
  const userMessage: ILLMMessage = { id: `msg_${Date.now()}_user`, role: 'user', content: message, timestamp: new Date() };
  conversation.messages.push(userMessage);
  await conversation.save();
  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    const marketData = await getLatestMarketData(targetSymbol);
    const contextEnhancedMessage = `${marketData}\n\nUser Question: ${message}`;
    
    console.log(`[LLM Controller] Requesting AI response from ${provider} (${model}) with Live Context`);
    const historyForPrompt = conversation.messages.slice(0, -1);
    const promptMessages = await generateChatPrompt(targetSymbol, historyForPrompt);
    
    // Use the enhanced message for the final prompt
    promptMessages.push({ role: 'user', content: contextEnhancedMessage });
    
    const aiResponse = await sendLLMRequest(provider, model, promptMessages);
    const assistantMessage: ILLMMessage = {
      id: `msg_${Date.now()}_assistant`, role: 'assistant', content: aiResponse, timestamp: new Date(),
      metadata: { symbol: targetSymbol, confidence: 85, sentiment: analyzeSentiment(aiResponse), tags: ['analysis'] }
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();
    return assistantMessage;
  } catch (error) {
    return userMessage; // Fallback
  }
}

export async function* streamChatMessage(userId: string, message: string, symbol?: string): AsyncGenerator<any, void, unknown> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetSymbol = symbol || 'BTCUSDT';
  let conversation = await LLMConversation.findOne({ userId: userObjectId, symbol: targetSymbol });
  if (!conversation) conversation = new LLMConversation({ userId: userObjectId, symbol: targetSymbol, messages: [] });
  const userMessage: ILLMMessage = { id: `msg_${Date.now()}_user`, role: 'user', content: message, timestamp: new Date() };
  conversation.messages.push(userMessage);
  await conversation.save();
  let fullResponse = '';
  const assistantMessageId = `msg_${Date.now()}_assistant`;
  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    
    const marketData = await getLatestMarketData(targetSymbol);
    const contextEnhancedMessage = `${marketData}\n\nUser Question: ${message}`;
    
    const historyForPrompt = conversation.messages.slice(0, -1);
    const promptMessages = await generateChatPrompt(targetSymbol, historyForPrompt);
    
    // Append the enhanced user message
    promptMessages.push({ role: 'user', content: contextEnhancedMessage });
    
    const stream = streamLLMRequest(provider, model, promptMessages);
    for await (const chunk of stream) {
      fullResponse += chunk;
      yield { chunk, messageId: assistantMessageId };
    }
    const assistantMessage: ILLMMessage = {
      id: assistantMessageId, role: 'assistant', content: fullResponse, timestamp: new Date(),
      metadata: { symbol: targetSymbol, confidence: 85, sentiment: analyzeSentiment(fullResponse), tags: ['analysis'] }
    };
    conversation.messages.push(assistantMessage);
    await conversation.save();
    yield { done: true, message: assistantMessage };
  } catch (error) {
    yield { chunk: "Error in streaming response", messageId: assistantMessageId };
  }
}

export async function generateGuidance(userId: string, symbol: string): Promise<any> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    const prompt = generateAnalysisPrompt(symbol);
    const aiResponse = await sendLLMRequest(provider, model, prompt);
    const guidanceData = parseGuidanceResponse(aiResponse, symbol);
    const guidance = new LLMGuidance({ userId: userObjectId, ...guidanceData });
    await guidance.save();
    return { id: String(guidance._id), symbol: guidance.symbol, analysis: guidance.analysis, recommendations: guidance.recommendations, risks: guidance.risks, timestamp: guidance.createdAt.toISOString() };
  } catch (error) {
    return { symbol, analysis: { sentiment: 'neutral', confidence: 70, summary: 'Error generating guidance' } };
  }
}

export async function getChatHistory(userId: string, limit: number = 50): Promise<ILLMMessage[]> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const conversation = await LLMConversation.findOne({ userId: userObjectId }).sort({ updatedAt: -1 });
  if (!conversation) return [{ id: 'msg_welcome', role: 'assistant', content: "Hello! How can I assist you today?", timestamp: new Date() }];
  return conversation.messages.slice(-limit);
}

export async function generateQuickInsights(symbol?: string, limit: number = 4): Promise<any[]> {
  return [
    { id: '1', type: 'sentiment', title: 'Sentiment', description: 'Bullish pressure detected', icon: 'TrendingUp', color: 'text-green-500', timestamp: new Date().toISOString() }
  ].slice(0, limit);
}
