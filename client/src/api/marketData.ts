// Description: Get current price and 24h statistics
// Endpoint: GET /api/market/data/:symbol
// Request: { symbol: string }
// Response: { price: number, change24h: number, high24h: number, low24h: number, volume24h: number, trades24h: number }
export const getMarketData = (symbol: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockData: Record<string, any> = {
        'BTC/USDT': {
          price: 42150.50,
          change24h: 3.05,
          high24h: 43200.00,
          low24h: 40800.00,
          volume24h: 2400000000,
          trades24h: 145892,
        },
        'ETH/USDT': {
          price: 2250.75,
          change24h: 2.45,
          high24h: 2350.00,
          low24h: 2180.00,
          volume24h: 1200000000,
          trades24h: 98765,
        },
      };
      resolve(mockData[symbol] || mockData['BTC/USDT']);
    }, 200);
  });
};

// Description: Get order book data
// Endpoint: GET /api/market/orderbook/:symbol
// Request: { symbol: string }
// Response: { bids: Array<[price, size]>, asks: Array<[price, size]>, spread: number }
export const getOrderBook = (symbol: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const basePrices: Record<string, number> = {
        'BTC/USDT': 42150,
        'ETH/USDT': 2250,
      };
      const basePrice = basePrices[symbol] || 42150;

      const bids = Array.from({ length: 15 }, (_, i) => [
        basePrice - (i + 1) * 0.5,
        Math.random() * 5,
      ]);

      const asks = Array.from({ length: 15 }, (_, i) => [
        basePrice + (i + 1) * 0.5,
        Math.random() * 5,
      ]);

      resolve({
        bids,
        asks,
        spread: 0.50,
      });
    }, 300);
  });
};

// Description: Get recent trades
// Endpoint: GET /api/market/trades/:symbol
// Request: { symbol: string }
// Response: { trades: Array<{ time: string, price: number, amount: number, side: 'BUY' | 'SELL' }> }
export const getRecentTrades = (symbol: string) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const trades = Array.from({ length: 50 }, (_, i) => ({
        time: new Date(Date.now() - i * 5000).toLocaleTimeString(),
        price: 42150 + (Math.random() - 0.5) * 100,
        amount: Math.random() * 2,
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      }));
      resolve({ trades });
    }, 300);
  });
};