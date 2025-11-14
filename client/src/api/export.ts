// Description: Export data
// Endpoint: POST /api/export
// Request: { dataType: string, format: string, dateRange: { from: string, to: string } }
// Response: { success: boolean, downloadUrl: string, fileName: string }
export const exportData = (dataType: string, format: string, dateRange: { from: string; to: string }) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        downloadUrl: '/api/export/download/data.csv',
        fileName: `${dataType}_${new Date().toISOString().split('T')[0]}.${format}`,
      });
    }, 1000);
  });
};

// Description: Get export history
// Endpoint: GET /api/export/history
// Request: {}
// Response: { exports: Array<{ id: string, timestamp: string, dataType: string, format: string, dateRange: string, fileSize: string }> }
export const getExportHistory = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        exports: [
          {
            id: '1',
            timestamp: new Date(Date.now() - 1 * 3600000).toLocaleString(),
            dataType: 'Trades',
            format: 'CSV',
            dateRange: 'Jan 15 - Jan 16',
            fileSize: '2.4 MB',
          },
          {
            id: '2',
            timestamp: new Date(Date.now() - 3 * 3600000).toLocaleString(),
            dataType: 'Signals',
            format: 'JSON',
            dateRange: 'Last 7 days',
            fileSize: '1.1 MB',
          },
          {
            id: '3',
            timestamp: new Date(Date.now() - 8 * 3600000).toLocaleString(),
            dataType: 'Delta',
            format: 'CSV',
            dateRange: 'Jan 14',
            fileSize: '856 KB',
          },
        ],
      });
    }, 300);
  });
};