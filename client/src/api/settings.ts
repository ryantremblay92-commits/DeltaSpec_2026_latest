// Description: Get user settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { apiEndpoint: string, refreshRate: number, chartType: string, decimalPlaces: number, timeFormat: string, timezone: string }
export const getSettings = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        apiEndpoint: 'wss://api.deltaspec.io/v1',
        refreshRate: 5,
        chartType: 'candlestick',
        decimalPlaces: 2,
        timeFormat: '24-hour',
        timezone: 'UTC',
      });
    }, 200);
  });
};

// Description: Save user settings
// Endpoint: POST /api/settings
// Request: { settings: object }
// Response: { success: boolean, message: string }
export const saveSettings = (settings: any) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, message: 'Settings saved successfully' });
    }, 300);
  });
};