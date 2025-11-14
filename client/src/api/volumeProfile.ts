// Description: Get volume profile data
// Endpoint: GET /api/analysis/volume-profile/:symbol
// Request: { symbol: string, profileType: string, valueAreaPercent: number, dateRange: { from: string, to: string } }
// Response: { poc: number, vah: number, val: number, vwap: number, profile: Array<{ price: number, volume: number }> }
export const getVolumeProfile = (
  symbol: string,
  profileType: string = 'session',
  valueAreaPercent: number = 70,
  dateRange?: { from: string; to: string }
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        poc: 42150.00,
        vah: 42500.00,
        val: 41800.00,
        vwap: 42075.00,
        profile: Array.from({ length: 50 }, (_, i) => ({
          price: 41000 + i * 100,
          volume: Math.random() * 5000,
        })),
      });
    }, 400);
  });
};