import { Router, Response } from 'express';
import { requireUser, AuthRequest } from './middlewares/auth';
import * as LLMController from '../services/llmController';

const router = Router();

// Description: Send a message to the LLM trading assistant
// Endpoint: POST /api/llm/chat
// Request: { message: string, symbol?: string }
// Response: { message: ILLMMessage }
router.post('/chat', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { message, symbol } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('[LLM Routes] POST /api/llm/chat:', { userId: req.user._id, symbol, messageLength: message.length });

    const response = await LLMController.sendChatMessage(
      req.user._id.toString(),
      message,
      symbol
    );

    res.status(200).json({ message: response });
  } catch (error: any) {
    console.error('[LLM Routes] Error in POST /api/llm/chat:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Description: Send a message to the LLM trading assistant and get a streamed response
// Endpoint: POST /api/llm/chat/stream
// Request: { message: string, symbol?: string }
// Response: Server-Sent Events (SSE)
router.post('/chat/stream', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { message, symbol } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('[LLM Routes] POST /api/llm/chat/stream:', { userId: req.user._id, symbol, messageLength: message.length });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = LLMController.streamChatMessage(
      req.user._id.toString(),
      message,
      symbol
    );

    for await (const data of stream) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
    
    res.end();
  } catch (error: any) {
    console.error('[LLM Routes] Error in POST /api/llm/chat/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to send message' });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message || 'Failed to send message' })}\n\n`);
      res.end();
    }
  }
});

// Description: Get AI-generated trading guidance for a symbol
// Endpoint: GET /api/llm/guidance
// Request: { symbol: string } (query parameter)
// Response: { guidance: LLMGuidance }
router.get('/guidance', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ error: 'Symbol is required and must be a string' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('[LLM Routes] GET /api/llm/guidance:', { userId: req.user._id, symbol });

    const guidance = await LLMController.generateGuidance(
      req.user._id.toString(),
      symbol
    );

    res.status(200).json({ guidance });
  } catch (error: any) {
    console.error('[LLM Routes] Error in GET /api/llm/guidance:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch guidance' });
  }
});

// Description: Get quick AI-generated market insights
// Endpoint: GET /api/llm/insights
// Request: { symbol?: string, limit?: number } (query parameters)
// Response: { insights: QuickInsight[] }
router.get('/insights', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 4;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('[LLM Routes] GET /api/llm/insights:', { userId: req.user._id, symbol, limit: parsedLimit });

    const insights = await LLMController.generateQuickInsights(
      symbol as string | undefined,
      parsedLimit
    );

    res.status(200).json({ insights });
  } catch (error: any) {
    console.error('[LLM Routes] Error in GET /api/llm/insights:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch insights' });
  }
});

// Description: Get chat history with the AI assistant
// Endpoint: GET /api/llm/history
// Request: { limit?: number } (query parameter)
// Response: { messages: LLMMessage[] }
router.get('/history', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const parsedLimit = limit ? parseInt(limit as string, 10) : 50;

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    console.log('[LLM Routes] GET /api/llm/history:', { userId: req.user._id, limit: parsedLimit });

    const messages = await LLMController.getChatHistory(
      req.user._id.toString(),
      parsedLimit
    );

    res.status(200).json({ messages });
  } catch (error: any) {
    console.error('[LLM Routes] Error in GET /api/llm/history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch chat history' });
  }
});

export default router;
