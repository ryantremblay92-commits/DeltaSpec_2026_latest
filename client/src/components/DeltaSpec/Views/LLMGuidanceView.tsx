import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Target,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import { ScrollArea } from '../../ui/scroll-area';
import { Separator } from '../../ui/separator';
import { Skeleton } from '../../ui/skeleton';
import { sendLLMMessage, getLLMGuidance, getQuickInsights, getChatHistory } from '../../../api/llmGuidance';
import { LLMMessage, LLMGuidance, QuickInsight } from '../../../types';
import { QuickInsightsWidget } from './LLMGuidance/QuickInsightsWidget';
import { GuidanceCard } from './LLMGuidance/GuidanceCard';
import { ChatMessage } from './LLMGuidance/ChatMessage';

interface LLMGuidanceViewProps {
  symbol: string;
}

export const LLMGuidanceView: React.FC<LLMGuidanceViewProps> = ({ symbol }) => {
  const [messages, setMessages] = useState<LLMMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guidance, setGuidance] = useState<LLMGuidance | null>(null);
  const [quickInsights, setQuickInsights] = useState<QuickInsight[]>([]);
  const [isLoadingGuidance, setIsLoadingGuidance] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load initial data
  useEffect(() => {
    loadChatHistory();
    loadGuidance();
    loadQuickInsights();
    console.log('[LLMGuidanceView] Component mounted for symbol:', symbol);
  }, [symbol]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistory();
      setMessages(history);
      console.log('[LLMGuidanceView] Chat history loaded:', history.length);
    } catch (error) {
      console.error('[LLMGuidanceView] Failed to load chat history:', error);
    }
  };

  const loadGuidance = async () => {
    setIsLoadingGuidance(true);
    try {
      const guidanceData = await getLLMGuidance(symbol);
      setGuidance(guidanceData);
      console.log('[LLMGuidanceView] Guidance loaded:', guidanceData);
    } catch (error) {
      console.error('[LLMGuidanceView] Failed to load guidance:', error);
    } finally {
      setIsLoadingGuidance(false);
    }
  };

  const loadQuickInsights = async () => {
    try {
      const insights = await getQuickInsights(symbol);
      setQuickInsights(insights);
      console.log('[LLMGuidanceView] Quick insights loaded:', insights.length);
    } catch (error) {
      console.error('[LLMGuidanceView] Failed to load quick insights:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputMessage.trim() || isLoading) return;

    const userMessage: LLMMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    console.log('[LLMGuidanceView] Sending message:', userMessage);

    try {
      const response = await sendLLMMessage(inputMessage, symbol);
      setMessages(prev => [...prev, response]);
      console.log('[LLMGuidanceView] Received response:', response);
    } catch (error) {
      console.error('[LLMGuidanceView] Failed to send message:', error);

      // Add error message
      const errorMessage: LLMMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshGuidance = () => {
    loadGuidance();
    loadQuickInsights();
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputMessage(prompt);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg backdrop-blur-sm border border-purple-500/30">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">AI Trading Assistant</h2>
            <p className="text-sm text-gray-400">Powered by advanced LLM analysis</p>
          </div>
        </div>
        <Button
          onClick={handleRefreshGuidance}
          variant="outline"
          size="sm"
          disabled={isLoadingGuidance}
          className="border-purple-500/30 hover:bg-purple-500/10"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingGuidance ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Insights */}
      <QuickInsightsWidget insights={quickInsights} onRefresh={loadQuickInsights} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface - 2 columns */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-900/40 backdrop-blur-xl border-gray-700/50 shadow-xl">
            <CardHeader className="border-b border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                  <CardTitle className="text-white">Chat with AI</CardTitle>
                </div>
                <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                  Online
                </Badge>
              </div>
              <CardDescription className="text-gray-400">
                Ask questions about {symbol} or get trading insights
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages Area */}
              <ScrollArea ref={scrollRef} className="h-[500px] p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      </div>
                      <div className="flex-1 bg-gray-800/50 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 border border-gray-700/30">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full bg-gray-700/50" />
                          <Skeleton className="h-4 w-4/5 bg-gray-700/50" />
                          <Skeleton className="h-4 w-3/4 bg-gray-700/50" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <Separator className="bg-gray-700/50" />

              {/* Quick Prompts */}
              <div className="p-3 bg-gray-800/30">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt(`Analyze ${symbol}`)}
                    className="text-xs border-gray-600/50 hover:bg-gray-700/50 text-gray-300"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Analyze {symbol}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('Should I buy now?')}
                    className="text-xs border-gray-600/50 hover:bg-gray-700/50 text-gray-300"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Entry Points
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('What are the risks?')}
                    className="text-xs border-gray-600/50 hover:bg-gray-700/50 text-gray-300"
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Risk Assessment
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickPrompt('Key support and resistance levels?')}
                    className="text-xs border-gray-600/50 hover:bg-gray-700/50 text-gray-300"
                  >
                    <ChevronRight className="w-3 h-3 mr-1" />
                    Key Levels
                  </Button>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-gray-800/30">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about trading..."
                    disabled={isLoading}
                    className="flex-1 bg-gray-900/50 border-gray-700/50 text-white placeholder:text-gray-500 focus:ring-purple-500/50 focus:border-purple-500/50"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guidance Panel - 1 column */}
        <div className="lg:col-span-1">
          <GuidanceCard
            guidance={guidance}
            isLoading={isLoadingGuidance}
            onRefresh={loadGuidance}
          />
        </div>
      </div>
    </div>
  );
};
