import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getOrderBook, getRecentTrades } from '@/api/marketData';
import { getActiveAlerts } from '@/api/alerts';
import { formatDistanceToNow } from 'date-fns';

interface RightPanelsProps {
  symbol: string;
}

export function RightPanels({ symbol }: RightPanelsProps) {
  const [orderBook, setOrderBook] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [orderBookData, alertsData] = await Promise.all([
          getOrderBook(symbol),
          getActiveAlerts(),
        ]);
        setOrderBook(orderBookData);
        setAlerts(alertsData.alerts);
      } catch (error) {
        console.error('Failed to load right panels data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol]);

  return (
    <aside className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-80 border-l border-border/40 bg-background/50 backdrop-blur-sm overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Order Book */}
        <Card className="bg-card/50 border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Order Book</CardTitle>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                Loading order book...
              </div>
            ) : orderBook ? (
              <>
                {/* Bids */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Bids
                  </div>
                  {orderBook.bids.slice(0, 5).map((bid: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-green-500 font-mono">
                        ${bid[0].toFixed(2)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {bid[1].toFixed(2)} BTC
                      </span>
                    </div>
                  ))}
                </div>

                {/* Spread */}
                <div className="py-2 px-2 bg-accent/50 rounded text-center text-xs font-medium">
                  Spread: ${orderBook.spread.toFixed(2)}
                </div>

                {/* Asks */}
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">
                    Asks
                  </div>
                  {orderBook.asks.slice(0, 5).map((ask: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-xs">
                      <span className="text-red-500 font-mono">
                        ${ask[0].toFixed(2)}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        {ask[1].toFixed(2)} BTC
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
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
            {alerts.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-4">
                No active alerts
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-2 rounded border-l-4 bg-card/50 ${
                    alert.type === 'BUY_SIGNAL'
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