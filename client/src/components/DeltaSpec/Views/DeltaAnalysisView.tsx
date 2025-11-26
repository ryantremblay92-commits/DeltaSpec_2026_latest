import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMarketData } from '@/hooks/useMarketData';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DeltaAnalysisViewProps {
  symbol: string;
}

export function DeltaAnalysisView({ symbol }: DeltaAnalysisViewProps) {
  const [lookback, setLookback] = useState('15m');
  const [method, setMethod] = useState('time-based');
  const [sensitivity, setSensitivity] = useState('medium');
  const { cumulativeDelta, trades, isConnected } = useMarketData();

  // Calculate buy/sell volumes from trades
  const buyVolume = trades
    .filter(t => t.side === 'buy')
    .reduce((sum, t) => sum + (parseFloat(t.size) || 0), 0);

  const sellVolume = trades
    .filter(t => t.side === 'sell')
    .reduce((sum, t) => sum + (parseFloat(t.size) || 0), 0);

  const totalVolume = buyVolume + sellVolume;
  const buyPercentage = totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50;
  const sellPercentage = totalVolume > 0 ? (sellVolume / totalVolume) * 100 : 50;
  const netDelta = buyVolume - sellVolume;

  const cumulativeDeltaValue = cumulativeDelta?.cumulative_delta
    ? parseFloat(cumulativeDelta.cumulative_delta)
    : 0;

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Analysis Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Lookback Period
            </label>
            <Select value={lookback} onValueChange={setLookback}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5 minutes</SelectItem>
                <SelectItem value="15m">15 minutes</SelectItem>
                <SelectItem value="30m">30 minutes</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="4h">4 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Calculation Method
            </label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tick-based">Tick-based</SelectItem>
                <SelectItem value="time-based">Time-based</SelectItem>
                <SelectItem value="volume-based">Volume-based</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase">
              Sensitivity
            </label>
            <Select value={sensitivity} onValueChange={setSensitivity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      {!isConnected && trades.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Waiting for live data...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {/* Cumulative Delta */}
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase">
                Cumulative Delta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500 font-mono">
                {cumulativeDeltaValue.toFixed(2)}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {cumulativeDeltaValue >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-xs font-medium ${cumulativeDeltaValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {cumulativeDeltaValue >= 0 ? 'Bullish' : 'Bearish'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Buy Volume */}
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase">
                Buy Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500 font-mono">
                {buyVolume.toFixed(4)}
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">
                  {buyPercentage.toFixed(1)}% of total
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${buyPercentage}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sell Volume */}
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase">
                Sell Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500 font-mono">
                {sellVolume.toFixed(4)}
              </div>
              <div className="mt-2">
                <div className="text-xs text-muted-foreground mb-1">
                  {sellPercentage.toFixed(1)}% of total
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: `${sellPercentage}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Delta */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground uppercase">
                Net Delta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500 font-mono">
                {netDelta.toFixed(4)}
              </div>
              <div className="mt-2">
                <div className={`text-xs font-medium ${netDelta > 0 ? 'text-green-500' : netDelta < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {netDelta > 0 ? 'Strong Buying Pressure' : netDelta < 0 ? 'Strong Selling Pressure' : 'Neutral'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}