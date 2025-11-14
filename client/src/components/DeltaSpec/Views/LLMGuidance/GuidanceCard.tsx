import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Shield,
  AlertTriangle,
  DollarSign,
  Activity,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Separator } from '../../../ui/separator';
import { Skeleton } from '../../../ui/skeleton';
import { Button } from '../../../ui/button';
import { LLMGuidance } from '../../../../types';

interface GuidanceCardProps {
  guidance: LLMGuidance | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const GuidanceCard: React.FC<GuidanceCardProps> = ({ guidance, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-700/50 shadow-xl sticky top-6">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-gray-700/50" />
          <Skeleton className="h-4 w-full bg-gray-700/50 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full bg-gray-700/50" />
          <Skeleton className="h-24 w-full bg-gray-700/50" />
          <Skeleton className="h-24 w-full bg-gray-700/50" />
        </CardContent>
      </Card>
    );
  }

  if (!guidance) {
    return (
      <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-700/50 shadow-xl sticky top-6">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">No guidance available</p>
        </CardContent>
      </Card>
    );
  }

  // Get sentiment icon and color
  const getSentimentDisplay = () => {
    switch (guidance.analysis.sentiment) {
      case 'bullish':
        return {
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-green-400 bg-green-500/10 border-green-500/30',
          text: 'Bullish'
        };
      case 'bearish':
        return {
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-red-400 bg-red-500/10 border-red-500/30',
          text: 'Bearish'
        };
      case 'neutral':
        return {
          icon: <Minus className="w-5 h-5" />,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
          text: 'Neutral'
        };
    }
  };

  // Get action color
  const getActionColor = () => {
    switch (guidance.recommendations.action) {
      case 'buy':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'sell':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'hold':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }
  };

  // Get risk color
  const getRiskColor = () => {
    switch (guidance.risks.level) {
      case 'low':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const sentiment = getSentimentDisplay();

  return (
    <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-700/50 shadow-xl sticky top-6 animate-fade-in">
      <CardHeader className="border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            AI Guidance
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0 hover:bg-gray-700/50"
          >
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </Button>
        </div>
        <CardDescription className="text-gray-400">{guidance.symbol}</CardDescription>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Sentiment & Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className={`${sentiment.color} font-medium`}>
              {sentiment.icon}
              <span className="ml-2">{sentiment.text}</span>
            </Badge>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/10">
              {guidance.analysis.confidence}% Confident
            </Badge>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 border border-gray-700/30">
          <p className="text-sm text-gray-300 leading-relaxed">{guidance.analysis.summary}</p>
        </div>

        <Separator className="bg-gray-700/30" />

        {/* Key Points */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" />
            Key Points
          </h4>
          <div className="space-y-1.5">
            {guidance.analysis.keyPoints.slice(0, 3).map((point, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-gray-400">
                <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-gray-700/30" />

        {/* Recommendations */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            Recommendations
          </h4>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Action:</span>
            <Badge variant="outline" className={`${getActionColor()} font-medium uppercase`}>
              {guidance.recommendations.action}
            </Badge>
          </div>

          {guidance.recommendations.entryPrice && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Entry:</span>
              <span className="text-sm font-medium text-white">
                ${guidance.recommendations.entryPrice.toLocaleString()}
              </span>
            </div>
          )}

          {guidance.recommendations.stopLoss && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Stop Loss:</span>
              <span className="text-sm font-medium text-red-400">
                ${guidance.recommendations.stopLoss.toLocaleString()}
              </span>
            </div>
          )}

          {guidance.recommendations.takeProfit && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Take Profit:</span>
              <span className="text-sm font-medium text-green-400">
                ${guidance.recommendations.takeProfit.toLocaleString()}
              </span>
            </div>
          )}

          {guidance.recommendations.positionSize && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Position Size:</span>
              <span className="text-sm font-medium text-purple-400">
                {guidance.recommendations.positionSize}
              </span>
            </div>
          )}

          <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-2.5 border border-gray-700/30 mt-2">
            <p className="text-xs text-gray-400 leading-relaxed">
              {guidance.recommendations.reasoning}
            </p>
          </div>
        </div>

        <Separator className="bg-gray-700/30" />

        {/* Risks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Risk Assessment
            </h4>
            <Badge variant="outline" className={`${getRiskColor()} font-medium uppercase text-xs`}>
              {guidance.risks.level} Risk
            </Badge>
          </div>

          <div className="space-y-1.5">
            {guidance.risks.factors.slice(0, 3).map((factor, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-gray-400">
                <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>{factor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamp */}
        <div className="pt-2 border-t border-gray-700/30">
          <p className="text-xs text-gray-500 text-center">
            Updated {new Date(guidance.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
