import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Flag,
  BarChart3,
  Lightbulb,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Button } from '../../../ui/button';
import { QuickInsight } from '../../../../types';

interface QuickInsightsWidgetProps {
  insights: QuickInsight[];
  onRefresh: () => void;
}

export const QuickInsightsWidget: React.FC<QuickInsightsWidgetProps> = ({ insights, onRefresh }) => {
  // Get icon based on insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'sentiment':
        return <TrendingUp className="w-5 h-5" />;
      case 'level':
        return <Shield className="w-5 h-5" />;
      case 'pattern':
        return <Flag className="w-5 h-5" />;
      case 'tip':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Lightbulb className="w-5 h-5" />;
    }
  };

  // Get color based on insight type
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'sentiment':
        return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
      case 'level':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
      case 'pattern':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30';
      case 'tip':
        return 'from-amber-500/20 to-orange-500/20 border-amber-500/30';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30';
    }
  };

  // Format time ago
  const getTimeAgo = (timestamp: string) => {
    const now = Date.now();
    const time = new Date(timestamp).getTime();
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (insights.length === 0) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-700/50 shadow-xl">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No insights available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Quick Insights</h3>
          <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
            {insights.length} Active
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="h-8 hover:bg-gray-700/50"
        >
          <RefreshCw className="w-4 h-4 text-gray-400" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((insight) => (
          <Card
            key={insight.id}
            className={`bg-gradient-to-br ${getInsightColor(
              insight.type
            )} backdrop-blur-xl border shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer group animate-fade-in`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`${insight.color} transition-transform duration-300 group-hover:scale-110`}>
                  {getInsightIcon(insight.type)}
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-gray-600/30 text-gray-400 bg-gray-900/30"
                >
                  {getTimeAgo(insight.timestamp)}
                </Badge>
              </div>

              <h4 className="text-sm font-semibold text-white mb-2 line-clamp-1">
                {insight.title}
              </h4>

              <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                {insight.description}
              </p>

              {/* Animated indicator */}
              <div className="mt-3 pt-3 border-t border-gray-700/30">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-500">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
