// Description: Get list of available trading instruments
// Endpoint: GET /api/instruments
// Request: {}
// Response: { instruments: Array<{ symbol: string, name: string, icon: string, price: number, change24h: number }> }
export const getInstruments = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        instruments: [
          { symbol: 'BTCUSDT', name: 'Bitcoin', icon: '₿', price: 42150.50, change24h: 3.05 },
          { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'Ξ', price: 2250.75, change24h: 2.45 },
          { symbol: 'SOLUSDT', name: 'Solana', icon: '◎', price: 98.50, change24h: 5.12 },
          { symbol: 'BNBUSDT', name: 'Binance Coin', icon: 'B', price: 612.30, change24h: 1.89 },
          { symbol: 'XRPUSDT', name: 'Ripple', icon: 'X', price: 2.45, change24h: -0.50 },
          { symbol: 'ADAUSDT', name: 'Cardano', icon: 'A', price: 0.98, change24h: 2.15 },
          { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'D', price: 0.38, change24h: 4.25 },
          { symbol: 'MATICUSDT', name: 'Polygon', icon: 'M', price: 0.85, change24h: 1.75 },
          { symbol: 'DOTUSDT', name: 'Polkadot', icon: '●', price: 7.45, change24h: 3.50 },
          { symbol: 'AVAXUSDT', name: 'Avalanche', icon: 'A', price: 35.20, change24h: 2.80 },
        ],
      });
    }, 300);
  });
};