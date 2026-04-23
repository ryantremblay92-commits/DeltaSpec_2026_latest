import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: parseFloat(ticker.mark_price),
        timestamp: Date.now()
      };

      setPriceHistory((prev) => {
        const updated = [...prev, newDataPoint];
        return updated.slice(-60); // Show last 1 minute at 1s intervals
      });
    }
  }, [ticker]);

  if (!isConnected && priceHistory.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="animate-pulse">Connecting to Delta Stream...</p>
      </div>
    );
  }

  const latestPrice = priceHistory.length > 0 ? priceHistory[priceHistory.length - 1].price : 0;
  const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : latestPrice;
  const isUp = latestPrice >= prevPrice;

  return (
    <div className="w-full h-[320px] relative">
      <div className="absolute top-0 right-4 z-10 text-right">
        <p className={`text-2xl font-black font-mono tracking-tighter ${isUp ? 'text-green-500' : 'text-red-500'} animate-in fade-in slide-in-from-top-2`}>
          ${latestPrice.toLocaleString(undefined, { minimumFractionDigits: 1 })}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Live Mark Price</p>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={isUp ? '#22c55e' : '#3b82f6'} stopOpacity={0.3} />
              <stop offset="95%" stopColor={isUp ? '#22c55e' : '#3b82f6'} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
          <XAxis
            dataKey="time"
            hide
          />
          <YAxis
            stroke="#666"
            fontSize={10}
            tickFormatter={(val) => `$${Math.round(val)}`}
            domain={['auto', 'auto']}
            orientation="right"
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)'
            }}
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            formatter={(val: number) => [`$${val.toFixed(2)}`, 'Price']}
            labelStyle={{ color: '#64748b', marginBottom: '4px' }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={isUp ? '#22c55e' : '#3b82f6'}
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorPrice)"
            animationDuration={300}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}