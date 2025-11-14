import React from 'react';
import { Sparkles, User } from 'lucide-react';
import { Badge } from '../../../ui/badge';
import { LLMMessage } from '../../../../types';

interface ChatMessageProps {
  message: LLMMessage;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  // Format timestamp
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish':
        return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'bearish':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'neutral':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center my-4 animate-fade-in">
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-full px-4 py-2 border border-gray-700/30">
          <p className="text-sm text-gray-400">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
            : 'bg-gradient-to-br from-purple-500 to-blue-500'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Sparkles className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`max-w-[85%] rounded-2xl p-4 backdrop-blur-sm border transition-all duration-200 hover:shadow-lg ${
            isUser
              ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/30 rounded-tr-sm'
              : 'bg-gray-800/50 border-gray-700/30 rounded-tl-sm'
          }`}
        >
          {/* Message Text */}
          <div className="text-sm text-gray-200 whitespace-pre-line leading-relaxed">
            {message.content}
          </div>

          {/* Metadata */}
          {message.metadata && !isUser && (
            <div className="mt-3 pt-3 border-t border-gray-700/30 flex flex-wrap gap-2">
              {message.metadata.sentiment && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getSentimentColor(message.metadata.sentiment)}`}
                >
                  {message.metadata.sentiment.charAt(0).toUpperCase() + message.metadata.sentiment.slice(1)}
                </Badge>
              )}
              {message.metadata.confidence && (
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400 bg-purple-500/10">
                  {message.metadata.confidence}% Confidence
                </Badge>
              )}
              {message.metadata.symbol && (
                <Badge variant="outline" className="text-xs border-gray-600/30 text-gray-400 bg-gray-600/10">
                  {message.metadata.symbol}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 px-2">
          <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
};
