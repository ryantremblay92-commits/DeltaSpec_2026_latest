import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    high24h: parseFloat(ticker.high_24h),
    low24h: parseFloat(ticker.low_24h),
    volume24h: parseFloat(ticker.volume_24h),
    bid: parseFloat(ticker.best_bid || 0),
    ask: parseFloat(ticker.best_ask || 0)
  } : null;

  const spread = marketData ? Math.abs(marketData.ask - marketData.bid) : 0;
  const loading = !isConnected && !marketData;
  const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

  return (
    <div className="space-y-6">
      {/* Price Overview */}
      <Card className="bg-gradient-to-br from-card to-card/50 border-border/40 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-widest">Market Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-8 italic">
              Synchronizing with Delta Exchange...
            </div>
          ) : marketData ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="flex flex-col justify-center">
                <div className="text-6xl font-black text-foreground font-mono tracking-tighter">
                  ${marketData.price.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-full border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-500 uppercase">Live Feed</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">
                    Spread: <span className="text-foreground font-mono">${spread.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-muted/20 p-6 rounded-2xl border border-border/10">
                <StatItem label="24h High" value={`$${marketData.high24h.toLocaleString()}`} color="text-green-500" />
                <StatItem label="24h Low" value={`$${marketData.low24h.toLocaleString()}`} color="text-red-500" />
                <StatItem label="24h Volume" value={`${(marketData.volume24h / 1e6).toFixed(1)}M`} />
                <StatItem label="Recent Ticks" value={trades.length.toString()} />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex gap-2 p-1 bg-muted/30 rounded-xl w-fit">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${timeframe === tf
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <Card className="bg-card/50 border-border/40 overflow-hidden">
        <CardHeader className="border-b border-border/10">
          <CardTitle className="text-lg">Price Action</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="pt-6 pb-2 px-4">
            <PriceChart />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/40 shadow-inner">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Tape History</CardTitle>
          <Badge variant="outline" className="font-mono text-[10px]">{symbol}</Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {trades.slice(-15).reverse().map((trade, idx) => (
              <div key={idx} className="flex items-center justify-between text-[13px] py-2 px-3 hover:bg-muted/30 rounded-lg transition-colors border-b border-border/5 last:border-b-0">
                <span className="text-muted-foreground font-mono w-20">
                  {new Date(trade.timestamp).toLocaleTimeString([], { hour12: false })}
                </span>
                <span className={`font-mono font-bold w-32 text-right ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                  ${parseFloat(trade.price).toFixed(1)}
                </span>
                <span className="text-muted-foreground font-mono w-24 text-right">
                  {parseFloat(trade.size).toFixed(3)}
                </span>
                <Badge
                  variant={trade.side === 'buy' ? 'default' : 'destructive'}
                  className="text-[10px] h-5 w-14 flex justify-center uppercase font-black"
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

function StatItem({ label, value, color = "text-foreground" }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{label}</p>
      <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
    </div>
  );
}