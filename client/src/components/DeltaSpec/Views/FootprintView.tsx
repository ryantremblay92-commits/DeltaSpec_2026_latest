import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getFootprintData } from '@/api/footprint';

interface FootprintViewProps {
  symbol: string;
}

export function FootprintView({ symbol }: FootprintViewProps) {
  const [intensity, setIntensity] = useState(50);
  const [minVolume, setMinVolume] = useState(2500);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getFootprintData(symbol, intensity, minVolume);
        setData(result);
      } catch (error) {
        console.error('Failed to load footprint data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, intensity, minVolume]);

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
              <span className="text-lg font-bold text-blue-500">{intensity}</span>
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
              <label className="text-sm font-semibold">Minimum Volume</label>
              <span className="text-lg font-bold text-blue-500">
                {(minVolume / 1000).toFixed(1)}K
              </span>
            </div>
            <Slider
              value={[minVolume]}
              onValueChange={(value) => setMinVolume(value[0])}
              min={0}
              max={10000}
              step={100}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Heatmap */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Footprint Heatmap</CardTitle>
          <Button size="sm" variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center text-muted-foreground py-12">
              Loading footprint data...
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-border/40 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="font-semibold">Heatmap Visualization</p>
                  <p className="text-sm">Price levels × Time intervals</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Price Levels
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data.stats.levels}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Highest Volume
                  </p>
                  <p className="text-lg font-bold text-foreground mt-1">
                    {data.stats.highestLevel}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground uppercase font-semibold">
                    Avg Volume
                  </p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {data.stats.avgVolume}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}