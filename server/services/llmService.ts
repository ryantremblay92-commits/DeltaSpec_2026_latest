import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'lm-studio',
  baseURL: process.env.OPENAI_BASE_URL || 'http://localhost:1234/v1',
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'no-key',
});

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Automatically detects the currently loaded model in LM Studio
 */
async function getActiveModel(providedModel: string): Promise<string> {
  // If a specific model is forced and it's not 'auto', use it
  if (providedModel && providedModel !== 'auto' && providedModel !== 'llama-3.2-1b-instruct') {
    return providedModel;
  }

  try {
    const models = await openai.models.list();
    if (models.data && models.data.length > 0) {
      const detected = models.data[0].id;
      console.log(`[LLM] Auto-detected local model: ${detected}`);
      return detected;
    }
  } catch (error) {
    console.warn('[LLM] Failed to auto-detect model from LM Studio, falling back to default:', error);
  }
  
  return providedModel || 'llama-3.2-1b-instruct';
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function sendRequestToOpenAI(model: string, messages: ChatMessage[]): Promise<string> {
  const activeModel = await getActiveModel(model);
  
  // DEBUG: Log the full outgoing prompt to verify data injection
  console.log(`[LLM DEBUG] Outgoing Prompt to ${activeModel}:`, JSON.stringify(messages, null, 2));

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: activeModel,
        messages: messages,
        max_tokens: 1024,
      });
      return response.choices[0].message.content || '';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error sending request to OpenAI (attempt ${i + 1}):`, errorMessage);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
  return '';
}

async function sendRequestToAnthropic(model: string, messages: ChatMessage[]): Promise<string> {
  // Convert OpenAI format to Anthropic format
  const systemMessage = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await anthropic.messages.create({
        model: model,
        system: systemMessage,
        messages: chatMessages,
        max_tokens: 1024,
      });
      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error sending request to Anthropic (attempt ${i + 1}):`, errorMessage);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
  return '';
}

async function* streamRequestToOpenAI(model: string, messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
  const activeModel = await getActiveModel(model);
  
  const stream = await openai.chat.completions.create({
    model: activeModel,
    messages: messages,
    max_tokens: 1024,
    stream: true,
  });
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || '';
    if (content) {
      yield content;
    }
  }
}

async function* streamRequestToAnthropic(model: string, messages: ChatMessage[]): AsyncGenerator<string, void, unknown> {
  const systemMessage = messages.find(m => m.role === 'system')?.content;
  const chatMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  const stream = await anthropic.messages.create({
    model: model,
    system: systemMessage,
    messages: chatMessages,
    max_tokens: 1024,
    stream: true,
  });
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text;
    }
  }
}

async function* streamLLMRequest(provider: string, model: string, messages: ChatMessage[] | string): AsyncGenerator<string, void, unknown> {
  const formattedMessages = typeof messages === 'string' ? [{ role: 'user', content: messages }] as ChatMessage[] : messages;
  
  switch (provider.toLowerCase()) {
    case 'openai':
      yield* streamRequestToOpenAI(model, formattedMessages);
      break;
    case 'anthropic':
      yield* streamRequestToAnthropic(model, formattedMessages);
      break;
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

async function sendLLMRequest(provider: string, model: string, messages: ChatMessage[] | string): Promise<string> {
  const formattedMessages = typeof messages === 'string' ? [{ role: 'user', content: messages }] as ChatMessage[] : messages;

  switch (provider.toLowerCase()) {
    case 'openai':
      return sendRequestToOpenAI(model, formattedMessages);
    case 'anthropic':
      return sendRequestToAnthropic(model, formattedMessages);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

export {
  sendLLMRequest,
  streamLLMRequest
};