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

import { getTableSchema, executeAiQuery } from './dbService';

/**
 * Generate a conversational response prompt for the LLM
 */
async function generateChatPrompt(symbol: string, conversationHistory: ILLMMessage[]): Promise<ChatMessage[]> {
  const marketData = await getLatestMarketData(symbol);
  const dbSchema = await getTableSchema();
  
  const systemMessage: ChatMessage = {
    role: 'system',
    content: `You are the DeltaTradeHub AI Intelligence Engine. 
    [LIVE TELEMETRY SNAPSHOT]
    ${marketData}
    
    [DATABASE ACCESS]
    ${dbSchema}
    
    [TASK]
    You are the DeltaTradeHub Autonomous Analyst. You MUST respond in valid JSON.
    
    [JSON SCHEMA]
    {
      "query": "SQL string if history is needed, else null",
      "analysis": "Your natural language analysis",
      "sentiment": "Bullish | Bearish | Neutral",
      "confidence": number (0-100)
    }
    
    [RULES]
    1. If 'query' is present, 'analysis' MUST be null (Synthesis happens in turn 2).
    2. Synthesis turn: 'query' is null, 'analysis' contains the final report.
    3. Use SQLite syntax ONLY (e.g., date('now') or datetime('now'), NOT NOW()).
    
    Be clinical and strictly follow the JSON structure.`
  };

  const history = conversationHistory
    .slice(-10) // Remember last 10 messages
    .filter(msg => {
      // Filter out past refusals and "passive" code-sharing to prevent the AI from repeating mistakes
      const badPatterns = [
        "don't have real-time data",
        "```sql",
        "SELECT * FROM",
        "DATEADD("
      ];
      return !badPatterns.some(p => msg.content.includes(p));
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
  
  if (!conversation) {
    conversation = new LLMConversation({ userId: userObjectId, symbol: targetSymbol, messages: [] });
  }

  const userMessage: ILLMMessage = { 
    id: `msg_${Date.now()}_user`, 
    role: 'user', 
    content: message, 
    timestamp: new Date() 
  };
  conversation.messages.push(userMessage);
  await conversation.save();

  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    const marketData = await getLatestMarketData(targetSymbol);
    
    // Initial prompt preparation
    const historyForPrompt = conversation.messages.slice(0, -1);
    const promptMessages = await generateChatPrompt(targetSymbol, historyForPrompt);
    
    // IMPORTANT: Only send the user question here. Market data is already in the SYSTEM prompt.
    // Adding it here again causes the AI to hallucinate based on the snapshot.
    promptMessages.push({ role: 'user', content: `User Question: ${message}` });
    
    console.log(`[LLM DEBUG] Sending Prompt with ${promptMessages.length} messages...`);
    let aiResponse = await sendLLMRequest(provider, model, promptMessages);
    
    console.log(`[LLM DEBUG] Raw AI Response:\n${aiResponse}`);

    // RECURSIVE SQL LOOP
    const sqlRequestTag = aiResponse.includes('[SQL_REQUEST]');
    const markdownSqlBlock = aiResponse.match(/```sql\n(SELECT.*?)\n```/si);
    
    if (sqlRequestTag || markdownSqlBlock) {
      console.log(`[DB AGENT] SQL detected! Tag: ${sqlRequestTag}, Markdown: ${!!markdownSqlBlock}`);
      // Flexible regex that catches [SQL_REQUEST] or falls back to markdown block
      let sql = '';
      if (sqlRequestTag) {
        const match = aiResponse.match(/\[SQL_REQUEST\](.*?)(?:\[\/SQL_REQUEST\]|$)/s);
        if (match) sql = match[1].trim();
      } else if (markdownSqlBlock) {
        sql = markdownSqlBlock[1].trim();
      }

      if (sql) {
        sql = sql.replace(/;$/, ''); // Clean up trailing semicolon
        try {
          console.log(`[DB AGENT] AI REQUESTED SQL: ${sql}`);
          const queryResults = await executeAiQuery(sql);
          
          // Re-prompt the AI with the data
          const retryMessages = [...promptMessages];
          retryMessages.push({ role: 'assistant', content: aiResponse });
          retryMessages.push({ 
            role: 'system', 
            content: `QUERY RESULTS:\n${JSON.stringify(queryResults, null, 2)}\n\nPlease provide a final, human-readable answer based on these results.` 
          });
          
          console.log(`[DB AGENT] Re-prompting AI with query results...`);
          aiResponse = await sendLLMRequest(provider, model, retryMessages);
        } catch (dbError: any) {
          console.error(`[DB AGENT] Query Error:`, dbError.message);
          aiResponse = `I tried to query the database, but encountered an error: ${dbError.message}`;
        }
      }
    }

    const assistantMessage: ILLMMessage = {
      id: `msg_${Date.now()}_assistant`,
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date(),
      metadata: { 
        symbol: targetSymbol, 
        confidence: 90, 
        sentiment: analyzeSentiment(aiResponse), 
        tags: ['analysis', 'database-query'] 
      }
    };
    
    conversation.messages.push(assistantMessage);
    await conversation.save();
    return assistantMessage;
  } catch (error) {
    console.error('[LLM Controller] Chat Error:', error);
    return userMessage;
  }
}

export async function* streamChatMessage(userId: string, message: string, symbol?: string): AsyncGenerator<any, void, unknown> {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const targetSymbol = symbol || 'BTCUSDT';
  let conversation = await LLMConversation.findOne({ userId: userObjectId, symbol: targetSymbol });
  if (!conversation) {
    conversation = new LLMConversation({ userId: userObjectId, symbol: targetSymbol, messages: [] });
  }

  const userMessage: ILLMMessage = { id: `msg_${Date.now()}_user`, role: 'user', content: message, timestamp: new Date() };
  conversation.messages.push(userMessage);
  await conversation.save();

  let fullResponse = '';
  const assistantMessageId = `msg_${Date.now()}_assistant`;

  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'gpt-3.5-turbo';
    const marketData = await getLatestMarketData(targetSymbol);
    
    const historyForPrompt = conversation.messages.slice(0, -1);
    const promptMessages = await generateChatPrompt(targetSymbol, historyForPrompt);
    promptMessages.push({ role: 'user', content: `User Question: ${message}` });

    let currentMessages = [...promptMessages];
    let capturedResponse = '';
    let parsedResponse: any = null;
    let isSynthesisComplete = false;
    let loops = 0;
    const MAX_LOOPS = 3;

    while (!isSynthesisComplete && loops < MAX_LOOPS) {
      loops++;
      capturedResponse = '';
      let isBufferingTag = false;
      
      const stream = streamLLMRequest(provider, model, currentMessages);
      for await (const chunk of stream) {
        capturedResponse += chunk;
        
        if (capturedResponse.includes('[TASK]') || capturedResponse.includes('[DATABASE ACCESS]')) {
          console.warn("[DB AGENT] ECHO DETECTED - Truncating and re-prompting.");
          capturedResponse = "Investigating live market data and historical database...";
          break;
        }
        
        if (chunk.includes('[') || isBufferingTag) {
          isBufferingTag = true;
          if (capturedResponse.includes('[SQL_REQUEST]') || capturedResponse.length > 500) {
            continue; 
          } else if (!capturedResponse.includes('[') && isBufferingTag) {
            isBufferingTag = false;
            yield { chunk: capturedResponse, messageId: assistantMessageId };
          }
        } else {
          yield { chunk, messageId: assistantMessageId };
        }
      }

      parsedResponse = null;
      try {
        const jsonStart = capturedResponse.indexOf('{');
        const jsonEnd = capturedResponse.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          parsedResponse = JSON.parse(capturedResponse.substring(jsonStart, jsonEnd + 1));
        }
      } catch (e) {
        console.warn("[DB AGENT] JSON Parse Error");
      }

      if (parsedResponse && parsedResponse.query) {
        let sql = parsedResponse.query.trim().replace(/;$/, '').trim();
        if (sql) {
          try {
            console.log(`[DB AGENT] EXECUTING STRUCTURED SQL: "${sql}"`);
            const queryResults = await executeAiQuery(sql);
            
            currentMessages.push({ role: 'assistant', content: JSON.stringify(parsedResponse) });
            currentMessages.push({ 
              role: 'user', 
              content: `QUERY RESULTS:\n${JSON.stringify(queryResults, null, 2)}\n\nIMPORTANT: Provide the final answer in the JSON schema. Set 'query' to null.` 
            });
            yield { chunk: "\n\n[Analyzing Database Results...]\n", messageId: assistantMessageId };
          } catch (dbError: any) {
            console.error(`[DB AGENT] Query Error: ${dbError.message}`);
            currentMessages.push({ role: 'assistant', content: JSON.stringify(parsedResponse) });
            currentMessages.push({ 
              role: 'user', 
              content: `SQL ERROR: ${dbError.message}\n\nPlease fix the query using SQLite syntax and provide the JSON again.` 
            });
            yield { chunk: `\n\n[Fixing SQL Error: ${dbError.message}]\n`, messageId: assistantMessageId };
          }
        } else {
          isSynthesisComplete = true;
        }
      } else {
        isSynthesisComplete = true;
      }
    }


    // FINAL CLEANSE: Extract just the 'analysis' text for the user UI
    let finalContent = capturedResponse;
    try {
      const jsonStart = capturedResponse.indexOf('{');
      const jsonEnd = capturedResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = capturedResponse.substring(jsonStart, jsonEnd + 1);
        const finalObj = JSON.parse(jsonStr);
        finalContent = finalObj.analysis || capturedResponse;
      }
    } catch (e) {}

    // Ensure we don't leak technical tags even in fallback
    const cleansedResponse = finalContent
      .replace(/\[AGENT_QUERY_START\].*?\[AGENT_QUERY_END\]/gs, '')
      .replace(/\[AGENT_QUERY_START\].*$/gs, '')
      .replace(/\[Analyzing Database Results...\]/g, '')
      .trim();

    const assistantMessage: ILLMMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: cleansedResponse,
      timestamp: new Date(),
      metadata: { 
        symbol: targetSymbol, 
        confidence: parsedResponse?.confidence || 95, 
        sentiment: (parsedResponse?.sentiment || 'neutral').toLowerCase() as any, 
        tags: ['analysis', 'structured-json'] 
      }
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
