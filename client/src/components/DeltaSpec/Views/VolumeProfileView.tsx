import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { getVolumeProfile } from '@/api/volumeProfile';

interface VolumeProfileViewProps {
  symbol: string;
}

export function VolumeProfileView({ symbol }: VolumeProfileViewProps) {
  const [profileType, setProfileType] = useState('session');
  const [valueArea, setValueArea] = useState(70);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await getVolumeProfile(symbol, profileType, valueArea);
        setData(result);
      } catch (error) {
        console.error('Failed to load volume profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [symbol, profileType, valueArea]);

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card className="bg-card/50 border-border/40">
        <CardHeader>
          <CardTitle>Volume Profile Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Profile Type</label>
              <Select value={profileType} onValueChange={setProfileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="visible-range">Visible Range</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold">Value Area %</label>
              <span className="text-lg font-bold text-blue-500">{valueArea}%</span>
            </div>
            <Slider
              value={[valueArea]}
              onValueChange={(value) => setValueArea(value[0])}
              min={60}
              max={90}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Levels */}
      {loading ? (
        <div className="text-center text-muted-foreground py-8">
          Loading volume profile...
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            {/* POC */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">
                  Point of Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500 font-mono">
                  ${data.poc.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Highest volume price
                </p>
              </CardContent>
            </Card>

            {/* VAH */}
            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">
                  Value Area High
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500 font-mono">
                  ${data.vah.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Upper {valueArea}% boundary
                </p>
              </CardContent>
            </Card>

            {/* VAL */}
            <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">
                  Value Area Low
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500 font-mono">
                  ${data.val.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Lower {valueArea}% boundary
                </p>
              </CardContent>
            </Card>

            {/* VWAP */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase">
                  VWAP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500 font-mono">
                  ${data.vwap.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Volume weighted avg
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Chart */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>Volume Profile Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-border/40 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="font-semibold">Horizontal Bar Chart</p>
                  <p className="text-sm">Volume distribution by price level</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}