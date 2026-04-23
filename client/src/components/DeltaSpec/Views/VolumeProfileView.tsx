import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useMarketData } from '@/hooks/useMarketData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface VolumeProfileViewProps {
  symbol: string;
}

export function VolumeProfileView({ symbol }: VolumeProfileViewProps) {
  const [profileType, setProfileType] = useState('session');
  const [valueArea, setValueArea] = useState(70);
  const { trades, ticker, isConnected } = useMarketData();

  // 1. Calculate Profile Data
  const profileData = useMemo(() => {
    if (trades.length === 0) return { list: [], poc: 0, vah: 0, val: 0, vwap: 0 };

    const priceVolumes: Record<string, number> = {};
    let totalVol = 0;
    let sumPV = 0;

    trades.forEach(t => {
      const p = parseFloat(t.price);
      const s = parseFloat(t.size) || 0;
      // Use $1.0 steps for high prices, $0.1 for low
      const step = p > 1000 ? 5.0 : 0.5;
      const rounded = (Math.round(p / step) * step).toFixed(1);
      
      priceVolumes[rounded] = (priceVolumes[rounded] || 0) + s;
      totalVol += s;
      sumPV += p * s;
    });

    const sortedPrices = Object.keys(priceVolumes)
      .map(Number)
      .sort((a, b) => a - b);

    const list = sortedPrices.map(p => ({
      price: p,
      volume: priceVolumes[p.toFixed(1)]
    }));

    // Find POC
    let poc = 0;
    let maxV = 0;
    list.forEach(d => {
      if (d.volume > maxV) {
        maxV = d.volume;
        poc = d.price;
      }
    });

    const vwap = sumPV / totalVol;

    // Proper Value Area Calculation (70% of volume centered around POC)
    const targetVol = totalVol * (valueArea / 100);
    let currentVol = maxV;
    let lowIdx = list.findIndex(d => d.price === poc);
    let highIdx = lowIdx;

    while (currentVol < targetVol && (lowIdx > 0 || highIdx < list.length - 1)) {
      const lowVol = lowIdx > 0 ? list[lowIdx - 1].volume : 0;
      const highVol = highIdx < list.length - 1 ? list[highIdx + 1].volume : 0;

      if (lowVol > highVol) {
        lowIdx--;
        currentVol += lowVol;
      } else {
        highIdx++;
        currentVol += highVol;
      }
    }

    const val = list[lowIdx]?.price || 0;
    const vah = list[highIdx]?.price || 0;

    return { list, poc, vah, val, vwap };
  }, [trades, valueArea]);

  return (
    <div className="space-y-6">
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
                </SelectContent>
              </Select>
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
          </div>
        </CardContent>
      </Card>

      {!isConnected && profileData.list.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          Waiting for volume profile data...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <MetricCard title="Point of Control" value={profileData.poc} color="blue" subtitle="Highest volume price" />
            <MetricCard title="Value Area High" value={profileData.vah} color="green" subtitle={`Upper ${valueArea}% boundary`} />
            <MetricCard title="Value Area Low" value={profileData.val} color="red" subtitle={`Lower ${valueArea}% boundary`} />
            <MetricCard title="VWAP" value={profileData.vwap} color="purple" subtitle="Volume weighted avg" />
          </div>

          <Card className="bg-card/50 border-border/40">
            <CardHeader>
              <CardTitle>Volume Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={[...profileData.list].reverse()}
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="price" 
                      type="category" 
                      stroke="#888" 
                      fontSize={10} 
                      tickFormatter={(val) => `$${val}`}
                      width={50}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => [val.toFixed(2), 'Volume']}
                    />
                    <Bar dataKey="volume">
                      {[...profileData.list].reverse().map((entry, index) => {
                        const isVA = entry.price >= profileData.val && entry.price <= profileData.vah;
                        const isPOC = entry.price === profileData.poc;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isPOC ? '#eab308' : (isVA ? '#3b82f6' : '#374151')} 
                            fillOpacity={isVA ? 0.8 : 0.3}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MetricCard({ title, value, color, subtitle }: any) {
  const colorMap: any = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-500',
    green: 'from-green-500/10 to-green-500/5 border-green-500/20 text-green-500',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20 text-red-500',
    purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/20 text-purple-500',
  };

  return (
    <Card className={`bg-gradient-to-br ${colorMap[color].split(' text-')[0]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground uppercase">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${colorMap[color].split('border-')[1].split(' ')[1]}`}>
          ${value.toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );
}