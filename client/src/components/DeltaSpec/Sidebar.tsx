import { useState } from 'react';
import { Activity, TrendingUp, Grid3x3, BarChart3, Zap, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'live-data', label: 'Live Data', icon: Activity },
  { id: 'delta-analysis', label: 'Delta Analysis', icon: TrendingUp },
  { id: 'footprint', label: 'Footprint', icon: Grid3x3 },
  { id: 'volume-profile', label: 'Volume Profile', icon: BarChart3 },
  { id: 'signals', label: 'Signals', icon: Zap, badge: '3' },
  { id: 'export-data', label: 'Export Data', icon: Download },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 border-r border-border/40 bg-background/50 backdrop-blur-sm overflow-y-auto">
      <div className="p-6 space-y-8">
        {/* Navigation Tabs */}
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Button
                key={tab.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start gap-3 ${
                  isActive
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'hover:bg-accent'
                }`}
                onClick={() => onTabChange(tab.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{tab.label}</span>
                {tab.badge && (
                  <Badge variant="secondary" className="ml-auto">
                    {tab.badge}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-border/40" />

        {/* Quick Stats */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Stats
          </h3>

          {/* 24h Volume */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                24h Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2.4B</div>
              <p className="text-xs text-green-500 font-medium mt-1">↑ +12.5%</p>
            </CardContent>
          </Card>

          {/* Active Signals */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">7</div>
              <p className="text-xs text-muted-foreground mt-1">
                3 Buy • 2 Sell • 2 Warning
              </p>
            </CardContent>
          </Card>

          {/* Success Rate */}
          <Card className="bg-card/50 border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Success Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">68.5%</div>
              <div className="h-1 bg-border rounded-full mt-2 overflow-hidden">
                <div className="h-full w-[68.5%] bg-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </aside>
  );
}