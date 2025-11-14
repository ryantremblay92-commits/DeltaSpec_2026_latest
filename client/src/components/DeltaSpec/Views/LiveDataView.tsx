import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getMarketData, getRecentTrades } from '@/api/marketData';
import { formatDistanceToNow } from 'date-fns';

interface LiveDataViewProps {
  symbol: string;
}

export function LiveDataView({ symbol }: LiveDataViewProps) {
  const [marketData, setMarketData] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState('5m');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [market, tradesData] = await Promise.all([
          getMarketData(symbol),
          getRecentTrades(symbol),
        ]);
        setMarketData(market);
        setTrades(tradesData.trades);
      } catch (error) {
        console.error('Failed to load live data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

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
              Loading market data...
            </div>
          ) : marketData ? (
            <div className="grid grid-cols-2 gap-8">
              {/* Left Section */}
              <div>
                <div className="text-5xl font-bold text-foreground font-mono">
                  ${marketData.price.toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {marketData.change24h >= 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-semibold text-green-500">
                        +${(marketData.price * (marketData.change24h / 100)).toFixed(2)}
                      </span>
                      <span className="text-lg text-green-500">
                        (+{marketData.change24h.toFixed(2)}%)
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      <span className="text-2xl font-semibold text-red-500">
                        -${Math.abs(marketData.price * (marketData.change24h / 100)).toFixed(2)}
                      </span>
                      <span className="text-lg text-red-500">
                        ({marketData.change24h.toFixed(2)}%)
                      </span>
                    </>
                  )}
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
                    24h Trades
                  </p>
                  <p className="text-xl font-bold text-foreground font-mono mt-1">
                    {marketData.trades24h.toLocaleString()}
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
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              timeframe === tf
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
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-semibold">Chart visualization</p>
            <p className="text-sm">Candlestick chart for {timeframe} timeframe</p>
          </div>
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
            {trades.slice(0, 10).map((trade, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-b-0">
                <span className="text-muted-foreground font-mono">{trade.time}</span>
                <span
                  className={`font-mono font-semibold ${
                    trade.side === 'BUY' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  ${trade.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground font-mono">
                  {trade.amount.toFixed(2)} BTC
                </span>
                <Badge
                  variant={trade.side === 'BUY' ? 'default' : 'destructive'}
                  className="text-xs"
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