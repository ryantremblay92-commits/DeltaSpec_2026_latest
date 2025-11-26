import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useMarketData } from '@/hooks/useMarketData';

interface PriceDataPoint {
  time: string;
  price: number;
  timestamp: number;
}

export function PriceChart() {
  const { ticker, isConnected } = useMarketData();
  const [priceHistory, setPriceHistory] = useState<PriceDataPoint[]>([]);

  useEffect(() => {
    if (ticker && ticker.mark_price) {
      const newDataPoint: PriceDataPoint = {
        time: new Date().toLocaleTimeString(),
        price: parseFloat(ticker.mark_price),
        timestamp: Date.now()
      };

      setPriceHistory((prev) => {
        const updated = [...prev, newDataPoint];
        // Keep last 50 data points for the chart
        return updated.slice(-50);
      });
    }
  }, [ticker]);

  if (!isConnected && priceHistory.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        Waiting for live data...
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={priceHistory}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis
          dataKey="time"
          stroke="#888"
          tick={{ fill: '#888' }}
        />
        <YAxis
          stroke="#888"
          tick={{ fill: '#888' }}
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          name="Mark Price"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}