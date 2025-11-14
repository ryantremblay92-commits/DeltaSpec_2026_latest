import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/useToast';
import { saveSettings } from '@/api/settings';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    refreshRate: '5',
    chartType: 'candlestick',
    decimalPlaces: '2',
    timeFormat: '24-hour',
    timezone: 'UTC',
    tradeAlerts: true,
    signalNotifications: true,
    connectionAlerts: true,
    soundEnabled: true,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveSettings(settings);
      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="display" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>

          {/* Display Tab */}
          <TabsContent value="display" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="refresh-rate">Data Refresh Rate</Label>
              <Select value={settings.refreshRate} onValueChange={(value) => setSettings({ ...settings, refreshRate: value })}>
                <SelectTrigger id="refresh-rate">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 second (Real-time)</SelectItem>
                  <SelectItem value="5">5 seconds (Default)</SelectItem>
                  <SelectItem value="10">10 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chart-type">Default Chart Type</Label>
              <Select value={settings.chartType} onValueChange={(value) => setSettings({ ...settings, chartType: value })}>
                <SelectTrigger id="chart-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="decimal-places">Price Decimal Places</Label>
              <Select value={settings.decimalPlaces} onValueChange={(value) => setSettings({ ...settings, decimalPlaces: value })}>
                <SelectTrigger id="decimal-places">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} decimals
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time-format">Time Format</Label>
              <Select value={settings.timeFormat} onValueChange={(value) => setSettings({ ...settings, timeFormat: value })}>
                <SelectTrigger id="time-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12-hour">12-hour (3:45 PM)</SelectItem>
                  <SelectItem value="24-hour">24-hour (15:45)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select value={settings.timezone} onValueChange={(value) => setSettings({ ...settings, timezone: value })}>
                <SelectTrigger id="timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="GMT">GMT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="trade-alerts">Trade Alerts</Label>
              <Switch
                id="trade-alerts"
                checked={settings.tradeAlerts}
                onCheckedChange={(checked) => setSettings({ ...settings, tradeAlerts: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="signal-notifications">Trading Signals</Label>
              <Switch
                id="signal-notifications"
                checked={settings.signalNotifications}
                onCheckedChange={(checked) => setSettings({ ...settings, signalNotifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="connection-alerts">Connection Status</Label>
              <Switch
                id="connection-alerts"
                checked={settings.connectionAlerts}
                disabled
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled">Sound Effects</Label>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, soundEnabled: checked })}
              />
            </div>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint</Label>
              <Input
                id="api-endpoint"
                value="wss://api.deltaspec.io/v1"
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Contact support to change endpoint</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-secret">API Secret</Label>
              <Input
                id="api-secret"
                type="password"
                placeholder="Enter your API secret"
              />
            </div>

            <Button variant="outline" className="w-full">
              Test Connection
            </Button>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}