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
  const [intensity, setIntensity] = useState(50);
  const [minVolume, setMinVolume] = useState(0); // Minimum volume threshold
  const { footprint, volumeImbalance, isConnected } = useMarketData();
  const [footprintMap, setFootprintMap] = useState<Map<number, FootprintLevel>>(new Map());

  // Accumulate footprint data
  useEffect(() => {
    if (footprint) {
      setFootprintMap(new Map());
      setFootprintMap((prev) => {
        const newMap = new Map(prev);
        // Convert array to Map
        footprint.forEach((item) => {
          const price = item.price_level;
          newMap.set(price, item);
        });
        return newMap;
      });
    }
  }, [footprint]);

  const sortedLevels = useMemo(() => {
    return Array.from(footprintMap.values())
      .filter(level => (level.bidVolume + level.askVolume) >= minVolume)
      .sort((a, b) => b.price - a.price) // Sort by price descending
      .sort((a, b) => b.price - a.price);
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
          <CardTitle>Footprint Ladder</CardTitle>
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
                      const bgOpacity = intensityRatio * 0.5; // Max 0.5 opacity

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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}