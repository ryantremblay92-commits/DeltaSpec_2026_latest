// Description: Get active trading signals
// Endpoint: GET /api/signals/active
// Request: { filters: string[], sensitivity: string }
// Response: { signals: Array<{ id: string, type: 'BUY' | 'SELL' | 'WARNING', strength: string, entry: number, target: number, stopLoss: number, confidence: number, timestamp: string }> }
export const getActiveSignals = (filters: string[] = ['all'], sensitivity: string = 'medium') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const signals = [
        {
          id: '1',
          type: 'BUY',
          strength: 'Strong',
          entry: 42150.00,
          target: 43500.00,
          stopLoss: 41000.00,
          confidence: 85,
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: '2',
          type: 'SELL',
          strength: 'Medium',
          entry: 42500.00,
          target: 41200.00,
          stopLoss: 43000.00,
          confidence: 68,
          timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        },
        {
          id: '3',
          type: 'WARNING',
          strength: 'Strong',
          entry: 42350.00,
          target: 42800.00,
          stopLoss: 41800.00,
          confidence: 82,
          timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        },
      ];
      resolve({ signals });
    }, 300);
  });
};

// Description: Get signal performance metrics
// Endpoint: GET /api/signals/performance
// Request: {}
// Response: { winRate: number, avgGain: number, totalSignals: number, activeNow: number }
export const getSignalPerformance = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        winRate: 68.5,
        avgGain: 3.2,
        totalSignals: 1247,
        activeNow: 7,
      });
    }, 300);
  });
};

// Description: Get signal history
// Endpoint: GET /api/signals/history
// Request: { page: number, limit: number }
// Response: { signals: Array<{ id: string, date: string, type: string, entry: number, exit: number, result: 'WIN' | 'LOSS', profitLoss: number, duration: string }>, total: number }
export const getSignalHistory = (page: number = 1, limit: number = 10) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const signals = Array.from({ length: limit }, (_, i) => ({
        id: `${page}-${i}`,
        date: new Date(Date.now() - (page - 1) * limit * 3600000 - i * 3600000).toLocaleString(),
        type: ['BUY', 'SELL', 'WARNING'][Math.floor(Math.random() * 3)],
        entry: 42000 + Math.random() * 1000,
        exit: 42000 + Math.random() * 1000,
        result: Math.random() > 0.3 ? 'WIN' : 'LOSS',
        profitLoss: (Math.random() - 0.5) * 5,
        duration: `${Math.floor(Math.random() * 4)}h ${Math.floor(Math.random() * 60)}m`,
      }));
      resolve({ signals, total: 247 });
    }, 300);
  });
};