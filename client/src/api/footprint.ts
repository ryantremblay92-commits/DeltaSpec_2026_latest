// Description: Get footprint heatmap data
// Endpoint: GET /api/analysis/footprint/:symbol
// Request: { symbol: string, intensityFilter: number, minVolume: number }
// Response: { heatmap: Array<Array<{ bid: number, ask: number, total: number }>>, stats: { levels: number, highestLevel: string, avgVolume: number } }
export const getFootprintData = (
  symbol: string,
  intensityFilter: number = 50,
  minVolume: number = 2500
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const heatmap = Array.from({ length: 30 }, (_, row) =>
        Array.from({ length: 20 }, (_, col) => ({
          bid: Math.random() * 1000,
          ask: Math.random() * 1000,
          total: Math.random() * 2000,
        }))
      );

      resolve({
        heatmap,
        stats: {
          levels: 45,
          highestLevel: '$42,150.00 (2.5K BTC)',
          avgVolume: 450,
        },
      });
    }, 500);
  });
};