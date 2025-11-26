import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMarketData } from '@/hooks/useMarketData';
import { getActiveAlerts } from '@/api/alerts';
import { formatDistanceToNow } from 'date-fns';

interface RightPanelsProps {
  symbol: string;
}

export function RightPanels({ symbol }: RightPanelsProps) {
  const { orderbook, isConnected } = useMarketData();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoadingAlerts(true);
      try {
        const alertsData = await getActiveAlerts();
        setAlerts(alertsData.alerts);
      } catch (error) {
        console.error('Failed to load alerts:', error);
      } finally {
        setLoadingAlerts(false);
      }
    };

    loadData();
  }, [symbol]);

  // Convert Map to sorted array for display
  const bids = Array.from(orderbook.bids.entries())
    .sort((a, b) => b[0] - a[0]) // Descending price
    .slice(0, 15);

  const asks = Array.from(orderbook.asks.entries())
    .sort((a, b) => a[0] - b[0]) // Ascending price
    .slice(0, 15);

  const bestBid = bids.length > 0 ? bids[0][0] : 0;
  const bestAsk = asks.length > 0 ? asks[0][0] : 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l border-border/40 bg-background/50 backdrop-blur-sm overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Order Book */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Order Book</CardTitle>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {!isConnected && bids.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                Waiting for order book...
              </div>
            ) : (
              <>
                {/* Asks (Sell Orders) - Reversed to show lowest ask at bottom */}
                <div className="space-y-1 flex flex-col-reverse">
                  {asks.map(([price, size]) => (
                    <div key={price} className="flex justify-between text-xs">
                      <span className="text-red-500 font-mono">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {size.toFixed(4)}
                      </span>
                    </div>
                  ))}
                  <div className="text-xs font-semibold text-muted-foreground uppercase pb-1">
                    Asks
                  </div>
                </div>

                {/* Spread */}
                <div className="py-2 px-2 bg-accent/50 rounded text-center text-xs font-medium my-2">
                  Spread: ${spread.toFixed(2)}
                </div>

                {/* Bids (Buy Orders) */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Bids
                  </div>
                  {bids.map(([price, size]) => (
                    <div key={price} className="flex justify-between text-xs">
                      <span className="text-green-500 font-mono">
                        ${price.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {size.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Active Alerts</CardTitle>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingAlerts ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                Loading alerts...
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                No active alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded border-l-4 bg-card/50 ${alert.type === 'BUY_SIGNAL'
                      ? 'border-l-green-500'
                      : alert.type === 'SELL_SIGNAL'
                        ? 'border-l-red-500'
                        : 'border-l-orange-500'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-foreground">
                        {alert.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(alert.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}