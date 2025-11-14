// Description: Get active alerts
// Endpoint: GET /api/alerts/active
// Request: {}
// Response: { alerts: Array<{ id: string, type: string, message: string, strength: string, price?: number, timestamp: string }> }
export const getActiveAlerts = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const alerts = [
        {
          id: '1',
          type: 'BUY_SIGNAL',
          message: 'Strong buying pressure detected above $42,000',
          strength: 'Strong',
          price: 42150.50,
          timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
        },
        {
          id: '2',
          type: 'SELL_SIGNAL',
          message: 'Resistance level reached at $42,500',
          strength: 'Medium',
          price: 42485.00,
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
        },
        {
          id: '3',
          type: 'WARNING',
          message: 'High volatility detected',
          strength: 'Strong',
          timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
        },
      ];
      resolve({ alerts });
    }, 300);
  });
};