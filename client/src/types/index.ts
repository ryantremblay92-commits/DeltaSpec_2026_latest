export interface Instrument {
  symbol: string;
  name: string;
  icon: string;
  price: number;
  change24h: number;
}

export interface MarketData {
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  trades24h: number;
}

export interface OrderBookData {
  bids: Array<[number, number]>;
  asks: Array<[number, number]>;
  spread: number;
}

export interface Trade {
  time: string;
  price: number;
  amount: number;
  side: 'BUY' | 'SELL';
}

export interface DeltaMetrics {
  cumulativeDelta: number;
  buyVolume: number;
  sellVolume: number;
  netDelta: number;
}

export interface Signal {
  id: string;
  type: 'BUY' | 'SELL' | 'WARNING';
  strength: 'Strong' | 'Medium' | 'Weak';
  entry: number;
  target: number;
  stopLoss: number;
  confidence: number;
  timestamp: string;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  strength: string;
  price?: number;
  timestamp: string;
}

export interface SignalPerformance {
  winRate: number;
  avgGain: number;
  totalSignals: number;
  activeNow: number;
}

export interface VolumeProfileData {
  poc: number;
  vah: number;
  val: number;
  vwap: number;
  profile: Array<{ price: number; volume: number }>;
}

export interface FootprintData {
  heatmap: Array<Array<{ bid: number; ask: number; total: number }>>;
  stats: {
    levels: number;
    highestLevel: string;
    avgVolume: number;
  };
}

export interface ExportData {
  success: boolean;
  downloadUrl: string;
  fileName: string;
}

export interface ExportHistory {
  id: string;
  timestamp: string;
  dataType: string;
  format: string;
  dateRange: string;
  fileSize: string;
}

export interface UserSettings {
  apiEndpoint: string;
  refreshRate: number;
  chartType: string;
  decimalPlaces: number;
  timeFormat: string;
  timezone: string;
}