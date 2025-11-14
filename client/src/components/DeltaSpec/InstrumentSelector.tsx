import { useState, useMemo } from 'react';
import { ChevronDown, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getInstruments } from '@/api/instruments';
import { useEffect } from 'react';

interface InstrumentSelectorProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
}

export function InstrumentSelector({ currentSymbol, onSymbolChange }: InstrumentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [instruments, setInstruments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInstruments = async () => {
      setLoading(true);
      try {
        const response = await getInstruments();
        setInstruments(response.instruments);
      } catch (error) {
        console.error('Failed to load instruments:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInstruments();
  }, []);

  const currentInstrument = instruments.find((i) => i.symbol === currentSymbol);
  const filteredInstruments = useMemo(
    () =>
      instruments.filter(
        (i) =>
          i.symbol.toLowerCase().includes(search.toLowerCase()) ||
          i.name.toLowerCase().includes(search.toLowerCase())
      ),
    [instruments, search]
  );

  return (
    <div className="relative w-full max-w-xs">
      <Button
        variant="outline"
        className="w-full justify-between bg-card hover:bg-card/80"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {currentInstrument && (
            <>
              <span className="text-lg font-semibold">{currentInstrument.symbol}</span>
              <div className="flex flex-col items-start">
                <span className="text-xs text-muted-foreground">${currentInstrument.price.toFixed(2)}</span>
                <span
                  className={`text-xs font-medium ${
                    currentInstrument.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {currentInstrument.change24h >= 0 ? '+' : ''}
                  {currentInstrument.change24h.toFixed(2)}%
                </span>
              </div>
            </>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search instruments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 bg-background"
                  autoFocus
                />
              </div>
            </div>

            {/* Instruments List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredInstruments.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No results found</div>
              ) : (
                filteredInstruments.map((instrument) => (
                  <button
                    key={instrument.symbol}
                    onClick={() => {
                      onSymbolChange(instrument.symbol);
                      setOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-b-0 ${
                      currentSymbol === instrument.symbol ? 'bg-accent' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {instrument.icon}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{instrument.symbol}</div>
                          <div className="text-xs text-muted-foreground">{instrument.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">${instrument.price.toFixed(2)}</div>
                        <div
                          className={`text-xs font-medium flex items-center gap-1 ${
                            instrument.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {instrument.change24h >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {Math.abs(instrument.change24h).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}