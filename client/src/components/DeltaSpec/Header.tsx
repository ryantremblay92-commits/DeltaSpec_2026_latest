import { useState } from 'react';
import { Settings, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';
import { InstrumentSelector } from './InstrumentSelector';
import { SettingsModal } from './SettingsModal';
import { useToast } from '@/hooks/useToast';

interface HeaderProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  isConnected: boolean;
}

export function Header({ currentSymbol, onSymbolChange, isConnected }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    toast({
      title: 'Theme changed',
      description: `Switched to ${newTheme} mode`,
    });
  };

  return (
    <>
      <header className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">
              <span className="text-blue-500">Delta</span>
              <span className="text-foreground">Spec</span>
            </div>
          </div>

          {/* Instrument Selector */}
          <div className="flex-1 mx-8">
            <InstrumentSelector currentSymbol={currentSymbol} onSymbolChange={onSymbolChange} />
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Connection Status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-card border border-border/50">
              {isConnected ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs font-medium text-foreground">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs font-medium text-foreground">Disconnected</span>
                </>
              )}
            </div>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              className="hover:bg-accent"
            >
              <Settings className="h-5 w-5" />
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="hover:bg-accent"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
}