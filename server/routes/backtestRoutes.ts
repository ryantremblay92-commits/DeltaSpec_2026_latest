import { Router, Response } from 'express';
import { requireUser, AuthRequest } from './middlewares/auth';
import { runBacktest, getBacktestHistory, BacktestConfig } from '../services/backtestEngine';

const router = Router();

// Description: Run a backtest against historical data
// Endpoint: POST /api/backtest/run
// Request: BacktestConfig
// Response: BacktestReport
router.post('/run', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol, startTime, endTime, intervalMinutes, lookAheadMinutes, initialCapital, riskPerTrade } = req.body;

    if (!symbol || !startTime || !endTime) {
      return res.status(400).json({ error: 'symbol, startTime, and endTime are required' });
    }

    const config: BacktestConfig = {
      symbol: symbol || 'BTCUSDT',
      startTime,
      endTime,
      intervalMinutes: intervalMinutes || 30,
      lookAheadMinutes: lookAheadMinutes || 60,
      initialCapital: initialCapital || 10000,
      riskPerTrade: riskPerTrade || 2,
    };

    console.log('[Backtest Routes] Starting backtest with config:', config);

    // Set SSE headers for progress streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const report = await runBacktest(config, (current, total, signal) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', current, total, signal })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ type: 'complete', report })}\n\n`);
    res.end();
  } catch (error: any) {
    console.error('[Backtest Routes] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Backtest failed' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  }
});

// Description: Get historical backtest results
// Endpoint: GET /api/backtest/history
// Response: { results: BacktestReport[] }
router.get('/history', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const results = await getBacktestHistory();
    res.status(200).json({ results });
  } catch (error: any) {
    console.error('[Backtest Routes] Error fetching history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch backtest history' });
  }
});

export default router;
