import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { PriceChart } from './PriceChart';

interface LiveDataViewProps {
  symbol: string;
}

export function LiveDataView({ symbol }: LiveDataViewProps) {
  const { ticker, trades, isConnected } = useMarketData();
  const [timeframe, setTimeframe] = useState('5m');

  const marketData = ticker ? {
    price: parseFloat(ticker.mark_price),
    change24h: 0, // Placeholder as ticker doesn't have 24h change percentage directly usually
    high24h: parseFloat(ticker.high_24h),
    low24h: parseFloat(ticker.low_24h),
    volume24h: parseFloat(ticker.volume_24h),
    trades24h: 0
  } : null;

  const loading = !isConnected && !marketData;

  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <div className="space-y-6">
      {/* Price Overview */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Price Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">
              Waiting for live data...
            </div>
          ) : marketData ? (
            <div className="grid grid-cols-2 gap-8">
              {/* Left Section */}
              <div>
                <div className="text-5xl font-bold text-foreground font-mono">
                  ${marketData.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {/* Change logic is simplified here as we don't have 24h change % in ticker stream yet */}
                  <span className="text-lg text-muted-foreground">
                    Live Updates
                  </span>
                </div>
              </div>

              {/* Right Section - Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    24h High
                  </p>
                  <p className="text-xl font-bold text-green-500 font-mono mt-1">
                    ${marketData.high24h.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    24h Low
                  </p>
                  <p className="text-xl font-bold text-red-500 font-mono mt-1">
                    ${marketData.low24h.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    24h Volume
                  </p>
                  <p className="text-xl font-bold text-foreground font-mono mt-1">
                    ${(marketData.volume24h / 1e9).toFixed(2)}B
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Trades
                  </p>
                  <p className="text-xl font-bold text-foreground font-mono mt-1">
                    {trades.length}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Timeframe Selector */}
      <div className="flex gap-2">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${timeframe === tf
                ? 'bg-blue-500 text-white'
                : 'bg-card border border-border/40 text-foreground hover:bg-accent'
              }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Placeholder */}
      <Card className="bg-card/50 border-border/40 h-96">
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceChart />
        </CardContent>
      </Card>

      {/* Recent Trades */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Trades</CardTitle>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-muted-foreground">Live</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {trades.map((trade, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-b-0">
                <span className="text-muted-foreground font-mono">
                  {new Date(trade.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`font-mono font-semibold ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                    }`}
                >
                  ${trade.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground font-mono">
                  {trade.size.toFixed(4)}
                </span>
                <Badge
                  variant={trade.side === 'buy' ? 'default' : 'destructive'}
                  className="text-xs uppercase"
                >
                  {trade.side}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}