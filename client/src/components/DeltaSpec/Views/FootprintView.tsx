import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { useMarketData } from '@/hooks/useMarketData';

interface FootprintViewProps {
  symbol: string;
}

interface FootprintLevel {
  price: number;
  bidVolume: number;
  askVolume: number;
  delta: number;
  timestamp: number;
}

export function FootprintView({ symbol }: FootprintViewProps) {
  const [viewMode, setViewMode] = useState<'ladder' | 'candles'>('candles');
  const [intensity, setIntensity] = useState(50);
  const [minVolume, setMinVolume] = useState(0); 
  const { footprint, trades, volumeImbalance, isConnected } = useMarketData();
  const [footprintMap, setFootprintMap] = useState<Map<number, FootprintLevel>>(new Map());
  const [candles, setCandles] = useState<any[]>([]);

  // Accumulate footprint data for ladder
  useEffect(() => {
    if (footprint && footprint.price_level !== undefined) {
      setFootprintMap((prev) => {
        const newMap = new Map(prev);
        const price = parseFloat(footprint.price_level);
        newMap.set(price, {
          price: price,
          bidVolume: parseFloat(footprint.bid_volume || 0),
          askVolume: parseFloat(footprint.ask_volume || 0),
          delta: parseFloat(footprint.delta || 0),
          timestamp: Date.now()
        });
        
        if (newMap.size > 100) {
          const sortedPrices = Array.from(newMap.keys()).sort((a, b) => b - a);
          const pricesToRemove = sortedPrices.slice(100);
          pricesToRemove.forEach(p => newMap.delete(p));
        }
        return newMap;
      });
    }
  }, [footprint]);

  // Generate candle clusters from trades
  useEffect(() => {
    if (trades && trades.length > 0) {
      // Group trades into 1-minute buckets for demo
      const buckets: Record<string, any> = {};
      
      trades.forEach(trade => {
        const date = new Date(trade.timestamp);
        const bucketKey = `${date.getHours()}:${date.getMinutes()}`;
        
        if (!buckets[bucketKey]) {
          buckets[bucketKey] = {
            time: bucketKey,
            levels: {}
          };
        }
        
        const pVal = parseFloat(trade.price);
        // Match the dynamic step logic (1.0 for BTC, 0.5 for small)
        const step = pVal > 1000 ? (pVal > 10000 ? 5.0 : 1.0) : 0.5;
        const price = Math.round(pVal / step) * step;
        const priceKey = price.toFixed(1); // Grid uses toFixed(1) for display
        
        if (!buckets[bucketKey].levels[priceKey]) {
          buckets[bucketKey].levels[priceKey] = { bid: 0, ask: 0 };
        }
        
        if (trade.side === 'buy') buckets[bucketKey].levels[priceKey].ask += parseFloat(trade.size);
        else buckets[bucketKey].levels[priceKey].bid += parseFloat(trade.size);
      });

      const sortedCandles = Object.values(buckets)
        .sort((a: any, b: any) => a.time.localeCompare(b.time));
      
      setCandles(sortedCandles);
    }
  }, [trades]);

  const sortedLevels = useMemo(() => {
    return Array.from(footprintMap.values())
      .filter(level => (level.bidVolume + level.askVolume) >= minVolume)
      .sort((a, b) => b.price - a.price); // Sort by price descending
  }, [footprintMap, minVolume]);

  const maxVolume = useMemo(() => {
    return Math.max(...sortedLevels.map(l => l.bidVolume + l.askVolume), 1);
  }, [sortedLevels]);

  const clearData = () => {
    setFootprintMap(new Map());
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Footprint Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Intensity Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Intensity Filter</label>
              <span className="text-lg font-bold text-blue-500">{intensity}%</span>
            </div>
            <Slider
              value={[intensity]}
              onValueChange={(value) => setIntensity(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Min Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Minimum Volume Filter</label>
              <span className="text-lg font-bold text-blue-500">
                {minVolume}
              </span>
            </div>
            <Slider
              value={[minVolume]}
              onValueChange={(value) => setMinVolume(value[0])}
              min={0}
              max={5000}
              step={50}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Heatmap / Ladder View */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle>Footprint Analysis</CardTitle>
            <div className="flex bg-muted p-1 rounded-md w-fit">
              <Button 
                variant={viewMode === 'candles' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('candles')}
                className="h-7 px-3 text-xs"
              >
                Candle Clusters
              </Button>
              <Button 
                variant={viewMode === 'ladder' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('ladder')}
                className="h-7 px-3 text-xs"
              >
                Price Ladder
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearData} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Clear
            </Button>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!isConnected && sortedLevels.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Waiting for footprint data...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Debug Info */}
              <div className="p-2 bg-muted/50 rounded text-xs font-mono overflow-auto max-h-32">
                <p>Map Size: {footprintMap.size}</p>
                <p>Last Footprint: {JSON.stringify(footprint)}</p>
                <p>Sorted Levels: {sortedLevels.length}</p>
              </div>

              {/* Volume Imbalance Stats */}
              {volumeImbalance && (
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border/40">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Bid Imbalance</p>
                    <p className="text-xl font-bold text-green-500">
                      {parseFloat(volumeImbalance.bid_imbalance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Net Imbalance</p>
                    <p className={`text-xl font-bold ${parseFloat(volumeImbalance.total_imbalance || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {parseFloat(volumeImbalance.total_imbalance || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Ask Imbalance</p>
                    <p className="text-xl font-bold text-red-500">
                      {parseFloat(volumeImbalance.ask_imbalance || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {/* Ladder Table */}
              {viewMode === 'ladder' ? (
                <div className="rounded-md border border-border/40 overflow-hidden">
                  <div className="grid grid-cols-4 bg-muted/50 p-2 text-xs font-semibold uppercase text-muted-foreground text-center">
                    <div>Price</div>
                    <div>Bid Vol</div>
                    <div>Ask Vol</div>
                    <div>Delta</div>
                  </div>
                  <div className="max-h-[500px] overflow-y-auto">
                    {sortedLevels.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No footprint data available</p>
                        <p className="text-sm mt-2">Data will appear when trades are processed</p>
                      </div>
                    ) : (
                      sortedLevels.map((level) => {
                        const totalVol = level.bidVolume + level.askVolume;
                        const intensityRatio = Math.min((totalVol / maxVolume) * (intensity / 50), 1);
                        const bgOpacity = intensityRatio * 0.5;

                        return (
                          <div
                            key={level.price}
                            className="grid grid-cols-4 text-sm border-b border-border/10 hover:bg-muted/30 transition-colors"
                            style={{ backgroundColor: `rgba(59, 130, 246, ${bgOpacity * 0.1})` }}
                          >
                            <div className="p-2 text-center font-mono font-medium border-r border-border/10">
                              {level.price.toFixed(1)}
                            </div>
                            <div className="p-2 text-center text-green-500/90 relative">
                              <div
                                className="absolute inset-y-0 left-0 bg-green-500/10"
                                style={{ width: `${(level.bidVolume / maxVolume) * 100}%` }}
                              />
                              <span className="relative z-10">{level.bidVolume.toFixed(2)}</span>
                            </div>
                            <div className="p-2 text-center text-red-500/90 relative">
                              <div
                                className="absolute inset-y-0 left-0 bg-red-500/10"
                                style={{ width: `${(level.askVolume / maxVolume) * 100}%` }}
                              />
                              <span className="relative z-10">{level.askVolume.toFixed(2)}</span>
                            </div>
                            <div className={`p-2 text-center font-medium ${level.delta >= 0 ? 'text-green-500' : 'text-red-500'} border-l border-border/10`}>
                              {level.delta > 0 ? '+' : ''}{level.delta.toFixed(2)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted">
                  {(() => {
                    if (candles.length === 0) {
                      return <div className="w-full text-center py-12 text-muted-foreground italic">Waiting for clusters to form...</div>;
                    }

                    // 1. Find Global Price Range & Generate Grid Rows
                    const allPrices = candles.flatMap(c => Object.keys(c.levels).map(p => parseFloat(p)));
                    const minP = Math.min(...allPrices);
                    const maxP = Math.max(...allPrices);
                    
                    // Dynamic Step: Use $1.0 for BTC-scale, $0.1 for smaller assets
                    const range = maxP - minP;
                    const step = range > 100 ? 5.0 : (maxP > 1000 ? 1.0 : 0.5);
                    
                    const rows: number[] = [];
                    // Ensure we don't create too many rows (limit to 100)
                    const startP = Math.ceil(maxP / step) * step;
                    const endP = Math.floor(minP / step) * step;
                    
                    for (let p = startP; p >= endP; p -= step) {
                      if (rows.length > 100) break; 
                      rows.push(Number(p.toFixed(2)));
                    }

                    // 2. Composite Volume Profile (Total volume at each price across all visible candles)
                    const profile: Record<number, number> = {};
                    rows.forEach(p => {
                      profile[p] = candles.reduce((sum, c) => {
                        const l = c.levels[p] || c.levels[p.toFixed(1)];
                        return sum + (l ? l.bid + l.ask : 0);
                      }, 0);
                    });
                    const maxProfileVol = Math.max(...Object.values(profile), 1);

                    return (
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-1 min-w-max">
                          {/* Integrated Volume Profile */}
                          <div className="flex flex-col pt-6 shrink-0 w-16 border-r border-border/20">
                            {rows.map(price => (
                              <div key={price} className="h-6 flex items-center justify-end pr-1 relative overflow-hidden">
                                <div 
                                  className="absolute inset-y-0 right-0 bg-blue-500/10 border-r border-blue-500/30" 
                                  style={{ width: `${(profile[price] / maxProfileVol) * 100}%` }}
                                />
                                <span className="text-[8px] font-mono text-muted-foreground z-10">{Math.round(profile[price])}</span>
                              </div>
                            ))}
                          </div>

                          {/* Price Axis */}
                          <div className="flex flex-col pt-6 shrink-0 sticky left-0 z-20 bg-background/80 backdrop-blur">
                            {rows.map(price => (
                              <div key={price} className="h-6 flex items-center justify-end px-2 text-[10px] font-mono text-muted-foreground border-r border-border/20 bg-background/50">
                                {price.toFixed(1)}
                              </div>
                            ))}
                          </div>

                          {/* Candles */}
                          {candles.map((candle, idx) => {
                            // ... (rest of candle logic remains same)
                            const candleDelta = Object.values(candle.levels).reduce((sum: number, l: any) => sum + (l.ask - l.bid), 0);
                            const prevCandle = idx > 0 ? candles[idx - 1] : null;
                            const prevDelta = prevCandle ? Object.values(prevCandle.levels).reduce((sum: number, l: any) => sum + (l.ask - l.bid), 0) : 0;
                            const isBearishFlip = prevDelta > 0 && candleDelta < 0;
                            const isBullishFlip = prevDelta < 0 && candleDelta > 0;

                            let pocPrice = -1;
                            let maxVol = -1;
                            Object.entries(candle.levels).forEach(([p, l]: any) => {
                              const v = l.bid + l.ask;
                              if (v > maxVol) {
                                maxVol = v;
                                pocPrice = parseFloat(p);
                              }
                            });

                            return (
                              <div key={idx} className="flex flex-col w-32 shrink-0 group/candle transition-all hover:bg-white/5 relative">
                                {isBearishFlip && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-500 animate-bounce">
                                    <span className="text-lg">↓</span>
                                  </div>
                                )}
                                {isBullishFlip && (
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-green-500 animate-bounce">
                                    <span className="text-lg">↑</span>
                                  </div>
                                )}

                                <div className="h-6 flex items-center justify-center bg-muted/20 text-[10px] font-mono border-x border-t border-border/20 rounded-t group-hover/candle:bg-muted/40">
                                  {candle.time}
                                </div>
                                <div className="flex flex-col border-x border-border/10 bg-background/10">
                                  {rows.map(price => {
                                    const lvl = candle.levels[price] || candle.levels[price.toFixed(1)];
                                    const isPOC = price === pocPrice;
                                    if (!lvl) return <div key={price} className="h-6 border-b border-border/5" />;
                                    const delta = lvl.ask - lvl.bid;
                                    const bidImbalance = lvl.bid > lvl.ask * 3 && lvl.bid > 5;
                                    const askImbalance = lvl.ask > lvl.bid * 3 && lvl.ask > 5;
                                    const isHighVol = (lvl.bid + lvl.ask) > (maxVol * 0.7);

                                    return (
                                      <div 
                                        key={price} 
                                        className={`h-6 flex border-b border-border/5 relative ${isPOC ? 'ring-1 ring-inset ring-yellow-500/50 z-10' : ''}`}
                                        style={{ 
                                          backgroundColor: isHighVol 
                                            ? (delta > 0 ? `rgba(34, 197, 94, 0.25)` : `rgba(239, 68, 68, 0.25)`)
                                            : (delta > 0 ? `rgba(34, 197, 94, ${Math.min(lvl.ask / 1000, 0.15)})` : `rgba(239, 68, 68, ${Math.min(lvl.bid / 1000, 0.15)})`)
                                        }}
                                      >
                                        {isHighVol && <div className={`absolute inset-y-0 left-0 w-1 ${delta > 0 ? 'bg-green-500' : 'bg-red-500'}`} />}
                                        <div className="flex-1 flex justify-between items-center px-1 text-[9px] font-mono z-10">
                                          <span className={`${bidImbalance ? 'text-red-400 font-bold underline decoration-2' : 'text-muted-foreground'}`}>{Math.round(lvl.bid)}</span>
                                          <div className="w-px h-full bg-border/20" />
                                          <span className={`${askImbalance ? 'text-blue-400 font-bold underline decoration-2' : 'text-muted-foreground'}`}>{Math.round(lvl.ask)}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <div className={`p-1 flex flex-col items-center justify-center border border-t-0 border-border/20 rounded-b ${candleDelta >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                                  <div className={`text-[10px] font-bold ${candleDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>{candleDelta > 0 ? '+' : ''}{Math.round(candleDelta)}</div>
                                  <div className="w-full h-1 bg-muted/30 rounded-full mt-0.5 overflow-hidden">
                                    <div className={`h-full ${candleDelta >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(candleDelta) / 500 * 100, 100)}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* LIVE TAPE INDICATOR */}
                        <div className="mt-8 p-4 bg-muted/10 rounded-lg border border-border/20">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            Live Exchange Tape (Recent Trades)
                          </h3>
                          <div className="space-y-1">
                            {trades.length === 0 ? (
                              <div className="text-[10px] text-muted-foreground italic">Listening for trades on BTCUSDT...</div>
                            ) : (
                              trades.slice(0, 5).map((t, i) => (
                                <div key={i} className="flex justify-between text-[10px] font-mono py-1 border-b border-border/5 last:border-0">
                                  <span className="text-muted-foreground">{new Date(t.timestamp).toLocaleTimeString()}</span>
                                  <span className={t.side === 'buy' ? 'text-green-500' : 'text-red-500'}>{t.side.toUpperCase()}</span>
                                  <span className="font-bold">${parseFloat(t.price).toFixed(1)}</span>
                                  <span className="text-muted-foreground">{parseFloat(t.size).toFixed(3)} BTC</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}