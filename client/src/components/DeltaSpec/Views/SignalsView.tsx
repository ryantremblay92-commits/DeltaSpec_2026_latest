import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from 'lucide-react';
import { getActiveSignals, getSignalPerformance, getSignalHistory } from '@/api/signals';
import { formatDistanceToNow } from 'date-fns';

interface SignalsViewProps {
  symbol: string;
}

export function SignalsView({ symbol }: SignalsViewProps) {
  const [filters, setFilters] = useState(['all']);
  const [sensitivity, setSensitivity] = useState('medium');
  const [signals, setSignals] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [signalsData, perfData, historyData] = await Promise.all([
          getActiveSignals(filters, sensitivity),
          getSignalPerformance(),
          getSignalHistory(page),
        ]);
        setSignals(signalsData.signals);
        setPerformance(perfData);
        setHistory(historyData.signals);
      } catch (error) {
        console.error('Failed to load signals:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters, sensitivity, page]);

  const toggleFilter = (filter: string) => {
    if (filter === 'all') {
      setFilters(['all']);
    } else {
      const newFilters = filters.includes('all')
        ? [filter]
        : filters.includes(filter)
        ? filters.filter((f) => f !== filter)
        : [...filters, filter];
      setFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'SELL':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Signal Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {['all', 'buy', 'sell', 'warning'].map((filter) => (
              <Button
                key={filter}
                variant={filters.includes(filter) ? 'default' : 'outline'}
                onClick={() => toggleFilter(filter)}
                className={`capitalize ${
                  filters.includes(filter)
                    ? filter === 'buy'
                      ? 'bg-green-500 hover:bg-green-600'
                      : filter === 'sell'
                      ? 'bg-red-500 hover:bg-red-600'
                      : filter === 'warning'
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-blue-500 hover:bg-blue-600'
                    : ''
                }`}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Sensitivity</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high'].map((level) => (
                <Button
                  key={level}
                  variant={sensitivity === level ? 'default' : 'outline'}
                  onClick={() => setSensitivity(level)}
                  className="capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {performance && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {performance.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">↑ +2.3% this week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase">
                Avg Gain
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                +{performance.avgGain.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">per signal</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase">
                Total Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {performance.totalSignals.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-muted-foreground uppercase">
                Active Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">
                {performance.activeNow}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                3 Buy • 2 Sell • 2 Warning
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Signals */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Active Signals</h3>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading signals...
          </div>
        ) : signals.length === 0 ? (
          <Card className="bg-card/50 border-border/40">
            <CardContent className="py-12 text-center text-muted-foreground">
              No active signals
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {signals.map((signal) => (
              <Card
                key={signal.id}
                className={`bg-card/50 border-l-4 ${
                  signal.type === 'BUY'
                    ? 'border-l-green-500'
                    : signal.type === 'SELL'
                    ? 'border-l-red-500'
                    : 'border-l-orange-500'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getSignalIcon(signal.type)}
                      <Badge
                        variant={
                          signal.type === 'BUY'
                            ? 'default'
                            : signal.type === 'SELL'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {signal.type}
                      </Badge>
                    </div>
                    <Badge variant="outline">{signal.strength}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Entry</p>
                    <p className="text-xl font-bold font-mono">
                      ${signal.entry.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="text-sm font-bold text-green-500 font-mono">
                        ${signal.target.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stop Loss</p>
                      <p className="text-sm font-bold text-red-500 font-mono">
                        ${signal.stopLoss.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className="text-xs font-bold">{signal.confidence}%</p>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(signal.timestamp), {
                      addSuffix: true,
                    })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Signal History */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Signal History</h3>
        <Card className="bg-card/50 border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40 bg-accent/50">
                  <th className="px-4 py-3 text-left font-semibold">Date/Time</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Entry</th>
                  <th className="px-4 py-3 text-left font-semibold">Exit</th>
                  <th className="px-4 py-3 text-left font-semibold">Result</th>
                  <th className="px-4 py-3 text-left font-semibold">P/L</th>
                  <th className="px-4 py-3 text-left font-semibold">Duration</th>
                </tr>
              </thead>
              <tbody>
                {history.map((signal) => (
                  <tr key={signal.id} className="border-b border-border/40 hover:bg-accent/30">
                    <td className="px-4 py-3 text-muted-foreground">{signal.date}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          signal.type === 'BUY'
                            ? 'default'
                            : signal.type === 'SELL'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {signal.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${signal.entry.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${signal.exit.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={signal.result === 'WIN' ? 'default' : 'destructive'}
                      >
                        {signal.result}
                      </Badge>
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-semibold ${
                        signal.profitLoss >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {signal.profitLoss >= 0 ? '+' : ''}
                      {signal.profitLoss.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {signal.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground">
              Showing 1-10 of 247 signals
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}