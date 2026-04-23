import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, Zap, Activity, Sparkles } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';
import { formatDistanceToNow } from 'date-fns';

interface SignalsViewProps {
  symbol: string;
}

const safeFormatDistance = (timestamp: string) => {
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Just now';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return 'Just now';
  }
};

const getSignalIcon = (type: string) => {
  switch (type) {
    case 'BUY': return <TrendingUp className="h-5 w-5 text-green-500" />;
    case 'SELL': return <TrendingDown className="h-5 w-5 text-red-500" />;
    case 'WARNING': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
    default: return <Zap className="h-5 w-5" />;
  }
};

export function SignalsView({ symbol }: SignalsViewProps) {
  const [sensitivity, setSensitivity] = useState('medium');
  const { trades, isConnected } = useMarketData();

  // 1. Real-Time Signal Detection Engine
  const activeSignals = useMemo(() => {
    try {
      if (!trades || trades.length < 5) return [];

      const signals: any[] = [];
      const recentTrades = trades.slice(0, 20); // MarketDataContext prepends new trades
      
      // A. Whale Detection (> 0.5 BTC)
      const largeTrades = recentTrades.filter(t => t && t.size && parseFloat(t.size) > 0.5);
      largeTrades.forEach((t, i) => {
        if (!t.price || !t.timestamp) return;
        signals.push({
          id: `whale-${i}-${t.timestamp}`,
          type: t.side === 'buy' ? 'BUY' : 'SELL',
          strength: 'High',
          entry: parseFloat(t.price),
          target: parseFloat(t.price) * (t.side === 'buy' ? 1.005 : 0.995),
          stopLoss: parseFloat(t.price) * (t.side === 'buy' ? 0.998 : 1.002),
          confidence: 85,
          reason: `Whale ${t.side.toUpperCase()} detected: ${parseFloat(t.size).toFixed(2)} BTC`,
          timestamp: t.timestamp
        });
      });

      // B. Absorption Detection
      const priceCounts: Record<string, number> = {};
      recentTrades.forEach(t => {
        if (!t || !t.price) return;
        const p = parseFloat(t.price).toFixed(1);
        priceCounts[p] = (priceCounts[p] || 0) + 1;
      });

      Object.entries(priceCounts).forEach(([price, count]) => {
        if (count > 8) {
          signals.push({
            id: `abs-${price}`,
            type: 'WARNING',
            strength: 'Medium',
            entry: parseFloat(price),
            target: parseFloat(price) + 10,
            stopLoss: parseFloat(price) - 10,
            confidence: 70,
            reason: `Price Absorption at $${price} (${count} hits)`,
            timestamp: new Date().toISOString()
          });
        }
      });

      // C. Delta Momentum Shift
      const last5 = recentTrades.slice(0, 5);
      if (last5.length >= 4) {
        const buyCount = last5.filter(t => t.side === 'buy').length;
        const lastTrade = last5[0]; // Newest is at index 0
        if (buyCount >= 4 && lastTrade && lastTrade.price) {
          signals.push({
            id: `mom-buy-${Date.now()}`,
            type: 'BUY',
            strength: 'Medium',
            entry: parseFloat(lastTrade.price),
            target: parseFloat(lastTrade.price) + 50,
            stopLoss: parseFloat(lastTrade.price) - 20,
            confidence: 65,
            reason: 'Aggressive Buying Momentum',
            timestamp: new Date().toISOString()
          });
        }
      }

      return signals.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);
    } catch (err) {
      console.error("Signal Detection Error:", err);
      return [];
    }
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20 shadow-lg">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-blue-500/20 rounded-lg"><Activity className="text-blue-500 h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Market Scan</p>
              <p className="text-xl font-black">ACTIVE</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-transparent border-green-500/20 shadow-lg">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-green-500/20 rounded-lg"><Zap className="text-green-500 h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Signal Count</p>
              <p className="text-xl font-black">{activeSignals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20 shadow-lg">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-orange-500/20 rounded-lg"><AlertTriangle className="text-orange-500 h-5 w-5" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Market Status</p>
              <p className="text-xl font-black">{isConnected ? 'LIVE' : 'IDLE'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Signals Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
            <Sparkles className="h-5 w-5 text-purple-500 fill-purple-500/20" /> Live Detection Feed
          </h3>
          <div className="flex gap-2">
            {['low', 'medium', 'high'].map(l => (
              <Button 
                key={l} 
                size="sm" 
                variant={sensitivity === l ? 'default' : 'outline'}
                onClick={() => setSensitivity(l)}
                className="h-7 px-3 text-[10px] uppercase font-black tracking-widest"
              >
                {l}
              </Button>
            ))}
          </div>
        </div>

        {activeSignals.length === 0 ? (
          <Card className="bg-card/30 border-dashed border-border/20 py-16 text-center text-muted-foreground italic">
            Scanning real-time tape for high-confidence patterns...
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeSignals.map((signal: any) => (
              <Card
                key={signal.id}
                className={`bg-card/50 border-l-4 hover:bg-muted/30 transition-all cursor-default group ${
                  signal.type === 'BUY' ? 'border-l-green-500' : 
                  signal.type === 'SELL' ? 'border-l-red-500' : 'border-l-orange-500'
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(signal.type)}
                      <Badge variant={signal.type === 'BUY' ? 'default' : signal.type === 'SELL' ? 'destructive' : 'secondary'} className="font-black text-[10px]">
                        {signal.type}
                      </Badge>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono opacity-60">{signal.strength}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-bold leading-tight group-hover:text-primary transition-colors">{signal.reason}</p>
                  
                  <div className="grid grid-cols-2 gap-2 py-3 border-y border-border/5">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Target</p>
                      <p className="text-sm font-black text-green-500 font-mono">${signal.target.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black">Stop</p>
                      <p className="text-sm font-black text-red-500 font-mono">${signal.stopLoss.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {safeFormatDistance(signal.timestamp)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${signal.confidence}%` }} />
                      </div>
                      <span className="text-[10px] font-black">{signal.confidence}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Logic Documentation */}
      <Card className="bg-blue-500/5 border-dashed border-blue-500/20">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
          <div className="text-[11px] text-muted-foreground leading-relaxed">
            <p className="font-black text-foreground uppercase tracking-wider mb-1">Detection Logic Engine Active</p>
            The engine is performing real-time analysis on the last 20 ticks. It monitors for **Order Flow Absorption** (price stalls), **Aggressive Delta Momentum** (rapid side bias), and **Whale Participation** ({"&gt;"}0.5 BTC). Signals are dynamic and update with every new trade in the buffer.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}