import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMarketData } from '@/hooks/useMarketData';

interface VolumeProfileViewProps {
  symbol: string;
}

export function VolumeProfileView({ symbol }: VolumeProfileViewProps) {
  const [profileType, setProfileType] = useState('session');
  const [valueArea, setValueArea] = useState(70);
  const { trades, ticker, isConnected } = useMarketData();
  const [volumeProfile, setVolumeProfile] = useState<any>(null);

  useEffect(() => {
    if (trades.length > 0 && ticker) {
      // Calculate volume profile from trades
      const priceVolumes: Record<number, number> = {};
      let totalVolume = 0;

      trades.forEach(trade => {
        const price = Math.floor(parseFloat(trade.price));
        const size = parseFloat(trade.size) || 0;
        priceVolumes[price] = (priceVolumes[price] || 0) + size;
        totalVolume += size;
      });

      // Find POC (Point of Control - highest volume price)
      let poc = 0;
      let maxVolume = 0;
      Object.entries(priceVolumes).forEach(([price, volume]) => {
        if (volume > maxVolume) {
          maxVolume = volume;
          poc = parseFloat(price);
        }
      });

      // Calculate VWAP
      let sumPriceVolume = 0;
      trades.forEach(trade => {
        sumPriceVolume += parseFloat(trade.price) * parseFloat(trade.size);
      });
      const vwap = totalVolume > 0 ? sumPriceVolume / totalVolume : 0;

      // Estimate VAH and VAL (simplified)
      const currentPrice = parseFloat(ticker.mark_price);
      const vah = currentPrice * 1.01; // 1% above current
      const val = currentPrice * 0.99; // 1% below current

      setVolumeProfile({ poc, vah, val, vwap });
    }
  }, [trades, ticker]);

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
      {!isConnected && !volumeProfile ? (
        <div className="text-center text-muted-foreground py-8">
          Waiting for volume profile data...
        </div>
      ) : volumeProfile ? (
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
                  ${volumeProfile.poc.toFixed(2)}
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
                  ${volumeProfile.vah.toFixed(2)}
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
                  ${volumeProfile.val.toFixed(2)}
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
                  ${volumeProfile.vwap.toFixed(2)}
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
                  <p className="text-xs mt-2">Based on {trades.length} recent trades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}