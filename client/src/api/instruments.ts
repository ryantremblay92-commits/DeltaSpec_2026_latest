// Description: Get list of available trading instruments
// Endpoint: GET /api/instruments
// Request: {}
// Response: { instruments: Array<{ symbol: string, name: string, icon: string, price: number, change24h: number }> }
export const getInstruments = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        instruments: [
          { symbol: 'BTC/USDT', name: 'Bitcoin', icon: '₿', price: 42150.50, change24h: 3.05 },
          { symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', price: 2250.75, change24h: 2.45 },
          { symbol: 'SOL/USDT', name: 'Solana', icon: '◎', price: 98.50, change24h: 5.12 },
          { symbol: 'BNB/USDT', name: 'Binance Coin', icon: 'B', price: 612.30, change24h: 1.89 },
          { symbol: 'XRP/USDT', name: 'Ripple', icon: 'X', price: 2.45, change24h: -0.50 },
          { symbol: 'ADA/USDT', name: 'Cardano', icon: 'A', price: 0.98, change24h: 2.15 },
          { symbol: 'DOGE/USDT', name: 'Dogecoin', icon: 'D', price: 0.38, change24h: 4.25 },
          { symbol: 'MATIC/USDT', name: 'Polygon', icon: 'M', price: 0.85, change24h: 1.75 },
          { symbol: 'DOT/USDT', name: 'Polkadot', icon: '●', price: 7.45, change24h: 3.50 },
          { symbol: 'AVAX/USDT', name: 'Avalanche', icon: 'A', price: 35.20, change24h: 2.80 },
        ],
      });
    }, 300);
  });
};