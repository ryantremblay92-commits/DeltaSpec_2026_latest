import { getDb, executeAiQuery } from './dbService';
import { sendLLMRequest } from './llmService';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface BacktestConfig {
  symbol: string;
  startTime: string;        // ISO timestamp
  endTime: string;          // ISO timestamp
  intervalMinutes: number;  // How often to sample (e.g., 30 = every 30 min)
  lookAheadMinutes: number; // How far forward to check outcome (e.g., 60)
  initialCapital: number;   // Starting capital in USD
  riskPerTrade: number;     // Percentage of capital to risk per trade (e.g., 2)
}

export interface BacktestSignal {
  timestamp: string;
  priceAtSignal: number;
  action: 'buy' | 'sell' | 'hold';
  entryPrice: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  sentiment: string;
  confidence: number;
  reasoning: string;
}

export interface BacktestOutcome {
  signal: BacktestSignal;
  priceAfterLookAhead: number;
  highInWindow: number;
  lowInWindow: number;
  hitTakeProfit: boolean;
  hitStopLoss: boolean;
  pnlPercent: number;
  pnlUsd: number;
  result: 'win' | 'loss' | 'neutral';
}

export interface BacktestReport {
  config: BacktestConfig;
  startedAt: string;
  completedAt: string;
  totalSignals: number;
  totalTrades: number;   // Excludes 'hold' signals
  wins: number;
  losses: number;
  neutrals: number;
  winRate: number;        // Percentage
  totalPnlPercent: number;
  totalPnlUsd: number;
  maxDrawdownPercent: number;
  avgConfidence: number;
  bestTrade: BacktestOutcome | null;
  worstTrade: BacktestOutcome | null;
  outcomes: BacktestOutcome[];
  equityCurve: { timestamp: string; equity: number }[];
}

// ─────────────────────────────────────────────
// Historical Data Snapshot Builder
// ─────────────────────────────────────────────

/**
 * Builds a market data snapshot as it would have appeared at a specific point in time.
 * This simulates what the LLM would have "seen" if it were running live at that moment.
 */
async function getHistoricalSnapshot(symbol: string, atTime: string): Promise<string> {
  const db = await getDb();

  // Get the ticker closest to this timestamp
  const ticker = await db.get(
    `SELECT * FROM tickers 
     WHERE symbol = ? AND timestamp <= ? 
     ORDER BY timestamp DESC LIMIT 1`,
    [symbol, atTime]
  );

  if (!ticker) return '';

  // Get recent price history (last 10 ticks before this time)
  const recentPrices = await db.all(
    `SELECT mark_price, timestamp FROM tickers 
     WHERE symbol = ? AND timestamp <= ? 
     ORDER BY timestamp DESC LIMIT 10`,
    [symbol, atTime]
  );

  // Get orderbook pressure at this time
  const pressure = await db.get(
    `SELECT * FROM orderbook_pressure 
     WHERE timestamp <= ? 
     ORDER BY timestamp DESC LIMIT 1`,
    [atTime]
  );

  // Get cumulative delta at this time
  const delta = await db.get(
    `SELECT * FROM cumulative_delta 
     WHERE timestamp <= ? 
     ORDER BY timestamp DESC LIMIT 1`,
    [atTime]
  );

  // Get recent footprint data
  const footprint = await db.all(
    `SELECT price_level, bid_volume, ask_volume, delta, imbalance 
     FROM footprint_data 
     WHERE ts <= ? 
     ORDER BY ts DESC LIMIT 20`,
    [atTime]
  );

  let snapshot = `[HISTORICAL SNAPSHOT at ${atTime}]\n`;
  snapshot += `Symbol: ${symbol}\n`;
  snapshot += `Mark Price: $${ticker.mark_price}\n`;
  snapshot += `Best Bid: $${ticker.best_bid} | Best Ask: $${ticker.best_ask}\n`;
  snapshot += `24h High: $${ticker.high_24h} | 24h Low: $${ticker.low_24h}\n`;
  snapshot += `24h Volume: ${ticker.volume_24h}\n`;
  snapshot += `Funding Rate: ${ticker.funding_rate}\n`;
  snapshot += `Open Interest: ${ticker.open_interest}\n\n`;

  if (recentPrices.length > 1) {
    const oldest = recentPrices[recentPrices.length - 1];
    const newest = recentPrices[0];
    const priceDelta = ((newest.mark_price - oldest.mark_price) / oldest.mark_price * 100).toFixed(3);
    snapshot += `[RECENT TREND] ${priceDelta}% over last ${recentPrices.length} ticks\n`;
    snapshot += `Price range: $${Math.min(...recentPrices.map((p: any) => p.mark_price)).toFixed(2)} - $${Math.max(...recentPrices.map((p: any) => p.mark_price)).toFixed(2)}\n\n`;
  }

  if (pressure) {
    snapshot += `[ORDERBOOK PRESSURE]\n`;
    snapshot += `Bid Pressure: ${pressure.bid_pressure} | Ask Pressure: ${pressure.ask_pressure}\n`;
    snapshot += `Imbalance: ${pressure.imbalance}\n\n`;
  }

  if (delta) {
    snapshot += `[CUMULATIVE DELTA]\n`;
    snapshot += `Cumulative: ${delta.cumulative_delta} | Interval: ${delta.interval_delta}\n\n`;
  }

  if (footprint.length > 0) {
    const totalBidVol = footprint.reduce((sum: number, f: any) => sum + (f.bid_volume || 0), 0);
    const totalAskVol = footprint.reduce((sum: number, f: any) => sum + (f.ask_volume || 0), 0);
    snapshot += `[FOOTPRINT SUMMARY] (${footprint.length} levels)\n`;
    snapshot += `Total Bid Volume: ${totalBidVol.toFixed(2)} | Total Ask Volume: ${totalAskVol.toFixed(2)}\n`;
    snapshot += `Net Delta: ${(totalBidVol - totalAskVol).toFixed(2)}\n`;
  }

  return snapshot;
}

// ─────────────────────────────────────────────
// LLM Signal Generator (Backtest Mode)
// ─────────────────────────────────────────────

/**
 * Asks the LLM to generate a trading signal based on a historical snapshot.
 * Uses a strict JSON prompt to get structured output.
 */
async function getLLMSignal(snapshot: string, symbol: string): Promise<BacktestSignal | null> {
  const prompt = `You are a crypto trading analyst running in BACKTEST MODE.
You are given a market data snapshot at a specific point in time.
Analyze the data and provide a trading recommendation.

${snapshot}

Respond ONLY in this exact JSON format:
{
  "action": "buy" | "sell" | "hold",
  "entryPrice": number or null,
  "stopLoss": number or null,
  "takeProfit": number or null,
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": number (0-100),
  "reasoning": "Brief 1-2 sentence explanation"
}

Rules:
- If action is "hold", set entryPrice/stopLoss/takeProfit to null.
- For "buy": takeProfit > entryPrice > stopLoss.
- For "sell": stopLoss > entryPrice > takeProfit.
- Be decisive. Only use "hold" if genuinely uncertain.
- Use SQLite-compatible syntax if referencing any dates.`;

  try {
    const provider = process.env.LLM_PROVIDER || 'openai';
    const model = process.env.LLM_MODEL || 'auto';
    const response = await sendLLMRequest(provider, model, prompt);
    
    // Parse JSON from response
    const jsonStart = response.indexOf('{');
    const jsonEnd = response.lastIndexOf('}');
    if (jsonStart === -1 || jsonEnd === -1) return null;

    const parsed = JSON.parse(response.substring(jsonStart, jsonEnd + 1));

    return {
      timestamp: '', // Will be set by caller
      priceAtSignal: 0, // Will be set by caller
      action: parsed.action?.toLowerCase() || 'hold',
      entryPrice: parsed.entryPrice || null,
      stopLoss: parsed.stopLoss || null,
      takeProfit: parsed.takeProfit || null,
      sentiment: parsed.sentiment?.toLowerCase() || 'neutral',
      confidence: parsed.confidence || 50,
      reasoning: parsed.reasoning || 'No reasoning provided',
    };
  } catch (error: any) {
    console.error(`[BACKTEST] LLM Signal Error: ${error.message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Outcome Evaluator
// ─────────────────────────────────────────────

/**
 * Evaluates a signal against actual future price action.
 * Checks if take profit or stop loss was hit within the look-ahead window.
 */
async function evaluateSignal(
  signal: BacktestSignal,
  symbol: string,
  lookAheadMinutes: number,
  positionSizeUsd: number
): Promise<BacktestOutcome> {
  const db = await getDb();
  
  // Calculate the end of the look-ahead window
  const signalTime = new Date(signal.timestamp);
  const endTime = new Date(signalTime.getTime() + lookAheadMinutes * 60 * 1000);

  // Get all price data in the look-ahead window
  const futurePrices = await db.all(
    `SELECT mark_price, timestamp FROM tickers 
     WHERE symbol = ? AND timestamp > ? AND timestamp <= ? 
     ORDER BY timestamp ASC`,
    [symbol, signal.timestamp, endTime.toISOString()]
  );

  const priceAfterLookAhead = futurePrices.length > 0
    ? futurePrices[futurePrices.length - 1].mark_price
    : signal.priceAtSignal;

  const allPrices = futurePrices.map((p: any) => p.mark_price);
  const highInWindow = allPrices.length > 0 ? Math.max(...allPrices) : signal.priceAtSignal;
  const lowInWindow = allPrices.length > 0 ? Math.min(...allPrices) : signal.priceAtSignal;

  let hitTakeProfit = false;
  let hitStopLoss = false;
  let pnlPercent = 0;

  if (signal.action === 'buy' && signal.entryPrice) {
    const entry = signal.entryPrice;
    
    // Check if TP or SL was hit (check SL first for conservative evaluation)
    if (signal.stopLoss && lowInWindow <= signal.stopLoss) {
      hitStopLoss = true;
      pnlPercent = ((signal.stopLoss - entry) / entry) * 100;
    } else if (signal.takeProfit && highInWindow >= signal.takeProfit) {
      hitTakeProfit = true;
      pnlPercent = ((signal.takeProfit - entry) / entry) * 100;
    } else {
      // Neither hit — use price at end of window
      pnlPercent = ((priceAfterLookAhead - entry) / entry) * 100;
    }
  } else if (signal.action === 'sell' && signal.entryPrice) {
    const entry = signal.entryPrice;

    if (signal.stopLoss && highInWindow >= signal.stopLoss) {
      hitStopLoss = true;
      pnlPercent = ((entry - signal.stopLoss) / entry) * 100;
    } else if (signal.takeProfit && lowInWindow <= signal.takeProfit) {
      hitTakeProfit = true;
      pnlPercent = ((entry - signal.takeProfit) / entry) * 100;
    } else {
      pnlPercent = ((entry - priceAfterLookAhead) / entry) * 100;
    }
  }

  const pnlUsd = (pnlPercent / 100) * positionSizeUsd;
  const result: 'win' | 'loss' | 'neutral' = 
    signal.action === 'hold' ? 'neutral' :
    pnlPercent > 0 ? 'win' : 
    pnlPercent < 0 ? 'loss' : 'neutral';

  return {
    signal,
    priceAfterLookAhead,
    highInWindow,
    lowInWindow,
    hitTakeProfit,
    hitStopLoss,
    pnlPercent,
    pnlUsd,
    result,
  };
}

// ─────────────────────────────────────────────
// Main Backtest Runner
// ─────────────────────────────────────────────

/**
 * Runs a full backtest over a historical time range.
 * Emits progress updates via a callback.
 */
export async function runBacktest(
  config: BacktestConfig,
  onProgress?: (current: number, total: number, signal?: BacktestSignal) => void
): Promise<BacktestReport> {
  const startedAt = new Date().toISOString();
  const db = await getDb();

  console.log(`[BACKTEST] Starting backtest for ${config.symbol}`);
  console.log(`[BACKTEST] Range: ${config.startTime} → ${config.endTime}`);
  console.log(`[BACKTEST] Interval: ${config.intervalMinutes}min, Look-ahead: ${config.lookAheadMinutes}min`);

  // Get all sample timestamps at the specified interval
  const samplePoints = await db.all(
    `WITH RECURSIVE time_series(ts, rn) AS (
       SELECT MIN(timestamp), 1 FROM tickers WHERE symbol = ? AND timestamp >= ? AND timestamp <= ?
       UNION ALL
       SELECT (
         SELECT MIN(timestamp) FROM tickers 
         WHERE symbol = ? AND timestamp > datetime(ts, '+' || ? || ' minutes')
         AND timestamp <= ?
       ), rn + 1
       FROM time_series 
       WHERE ts IS NOT NULL AND rn < 500
     )
     SELECT ts FROM time_series WHERE ts IS NOT NULL`,
    [config.symbol, config.startTime, config.endTime, 
     config.symbol, config.intervalMinutes, config.endTime]
  );

  // Fallback: If the recursive CTE doesn't work well, sample manually
  let timestamps: string[] = samplePoints.map((r: any) => r.ts).filter(Boolean);
  
  if (timestamps.length === 0) {
    // Manual sampling fallback
    const allTickers = await db.all(
      `SELECT DISTINCT timestamp FROM tickers 
       WHERE symbol = ? AND timestamp >= ? AND timestamp <= ?
       ORDER BY timestamp ASC`,
      [config.symbol, config.startTime, config.endTime]
    );
    
    // Sample at the configured interval
    const intervalMs = config.intervalMinutes * 60 * 1000;
    let lastSampled = 0;
    timestamps = [];
    for (const row of allTickers) {
      const t = new Date(row.timestamp).getTime();
      if (t - lastSampled >= intervalMs) {
        timestamps.push(row.timestamp);
        lastSampled = t;
      }
    }
  }

  console.log(`[BACKTEST] Identified ${timestamps.length} sample points`);

  const outcomes: BacktestOutcome[] = [];
  const positionSizeUsd = (config.riskPerTrade / 100) * config.initialCapital;
  let equity = config.initialCapital;
  let peakEquity = config.initialCapital;
  let maxDrawdownPercent = 0;
  const equityCurve: { timestamp: string; equity: number }[] = [
    { timestamp: config.startTime, equity: config.initialCapital }
  ];

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    if (onProgress) onProgress(i + 1, timestamps.length);

    console.log(`[BACKTEST] Processing ${i + 1}/${timestamps.length}: ${ts}`);

    // Build historical snapshot at this moment
    const snapshot = await getHistoricalSnapshot(config.symbol, ts);
    if (!snapshot) continue;

    // Get LLM signal
    const signal = await getLLMSignal(snapshot, config.symbol);
    if (!signal) continue;

    // Get the actual price at signal time
    const tickerAtTime = await db.get(
      `SELECT mark_price FROM tickers 
       WHERE symbol = ? AND timestamp <= ? 
       ORDER BY timestamp DESC LIMIT 1`,
      [config.symbol, ts]
    );

    signal.timestamp = ts;
    signal.priceAtSignal = tickerAtTime?.mark_price || 0;

    // If the model didn't provide an entry price, use the current mark price
    if (signal.action !== 'hold' && !signal.entryPrice) {
      signal.entryPrice = signal.priceAtSignal;
    }

    // Evaluate the signal against future price action
    const outcome = await evaluateSignal(signal, config.symbol, config.lookAheadMinutes, positionSizeUsd);
    outcomes.push(outcome);

    // Update equity curve
    if (outcome.result !== 'neutral') {
      equity += outcome.pnlUsd;
      equityCurve.push({ timestamp: ts, equity });

      // Track drawdown
      if (equity > peakEquity) peakEquity = equity;
      const drawdown = ((peakEquity - equity) / peakEquity) * 100;
      if (drawdown > maxDrawdownPercent) maxDrawdownPercent = drawdown;
    }

    // Small delay to avoid overwhelming the LLM
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Calculate final metrics
  const trades = outcomes.filter(o => o.signal.action !== 'hold');
  const wins = trades.filter(o => o.result === 'win');
  const losses = trades.filter(o => o.result === 'loss');
  const neutrals = outcomes.filter(o => o.result === 'neutral');

  const totalPnlPercent = trades.reduce((sum, o) => sum + o.pnlPercent, 0);
  const totalPnlUsd = trades.reduce((sum, o) => sum + o.pnlUsd, 0);
  const avgConfidence = outcomes.length > 0
    ? outcomes.reduce((sum, o) => sum + o.signal.confidence, 0) / outcomes.length
    : 0;

  const sortedByPnl = [...trades].sort((a, b) => b.pnlPercent - a.pnlPercent);

  const report: BacktestReport = {
    config,
    startedAt,
    completedAt: new Date().toISOString(),
    totalSignals: outcomes.length,
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    neutrals: neutrals.length,
    winRate: trades.length > 0 ? (wins.length / trades.length) * 100 : 0,
    totalPnlPercent,
    totalPnlUsd,
    maxDrawdownPercent,
    avgConfidence,
    bestTrade: sortedByPnl.length > 0 ? sortedByPnl[0] : null,
    worstTrade: sortedByPnl.length > 0 ? sortedByPnl[sortedByPnl.length - 1] : null,
    outcomes,
    equityCurve,
  };

  console.log(`[BACKTEST] ═══════════════════════════════════════`);
  console.log(`[BACKTEST] RESULTS for ${config.symbol}`);
  console.log(`[BACKTEST] Total Signals: ${report.totalSignals} | Trades: ${report.totalTrades}`);
  console.log(`[BACKTEST] Win Rate: ${report.winRate.toFixed(1)}%`);
  console.log(`[BACKTEST] Total P&L: ${report.totalPnlPercent.toFixed(2)}% ($${report.totalPnlUsd.toFixed(2)})`);
  console.log(`[BACKTEST] Max Drawdown: ${report.maxDrawdownPercent.toFixed(2)}%`);
  console.log(`[BACKTEST] Avg Confidence: ${report.avgConfidence.toFixed(1)}%`);
  console.log(`[BACKTEST] ═══════════════════════════════════════`);

  // Save report to database
  try {
    await db.run(
      `CREATE TABLE IF NOT EXISTS backtest_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        symbol TEXT NOT NULL,
        config TEXT NOT NULL,
        report TEXT NOT NULL
      )`
    );
    await db.run(
      `INSERT INTO backtest_results (timestamp, symbol, config, report) VALUES (?, ?, ?, ?)`,
      [new Date().toISOString(), config.symbol, JSON.stringify(config), JSON.stringify(report)]
    );
    console.log(`[BACKTEST] Report saved to database.`);
  } catch (e: any) {
    console.error(`[BACKTEST] Failed to save report: ${e.message}`);
  }

  return report;
}

/**
 * Get all past backtest reports from the database.
 */
export async function getBacktestHistory(): Promise<any[]> {
  const db = await getDb();
  try {
    const rows = await db.all(
      `SELECT * FROM backtest_results ORDER BY timestamp DESC LIMIT 20`
    );
    return rows.map((r: any) => ({
      id: r.id,
      timestamp: r.timestamp,
      symbol: r.symbol,
      report: JSON.parse(r.report),
    }));
  } catch {
    return [];
  }
}
