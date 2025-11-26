import { Router, Response } from 'express';
import { requireUser, AuthRequest } from './middlewares/auth';
import redis from 'redis';

const router = Router();
const redisClient = redis.createClient({
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`,
});

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.connect();

router.get('/trades', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const trades = await redisClient.xRange('delta_trades', '-', '+');
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trades from Redis' });
  }
});

router.get('/tickers', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const tickers = await redisClient.xRange('delta_tickers', '-', '+');
    res.json(tickers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tickers from Redis' });
  }
});

export default router;