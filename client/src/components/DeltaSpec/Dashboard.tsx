import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { RightPanels } from './RightPanels';
import { LiveDataView } from './Views/LiveDataView';
import { DeltaAnalysisView } from './Views/DeltaAnalysisView';
import { FootprintView } from './Views/FootprintView';
import { VolumeProfileView } from './Views/VolumeProfileView';
import { SignalsView } from './Views/SignalsView';
import { ExportDataView } from './Views/ExportDataView';

export function Dashboard() {
  const [currentSymbol, setCurrentSymbol] = useState('BTC/USDT');
  const [activeTab, setActiveTab] = useState('live-data');
  const [isConnected, setIsConnected] = useState(true);

  const renderView = () => {
    switch (activeTab) {
      case 'live-data':
        return <LiveDataView symbol={currentSymbol} />;
      case 'delta-analysis':
        return <DeltaAnalysisView symbol={currentSymbol} />;
      case 'footprint':
        return <FootprintView symbol={currentSymbol} />;
      case 'volume-profile':
        return <VolumeProfileView symbol={currentSymbol} />;
      case 'signals':
        return <SignalsView symbol={currentSymbol} />;
      case 'export-data':
        return <ExportDataView symbol={currentSymbol} />;
      default:
        return <LiveDataView symbol={currentSymbol} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Header */}
      <Header
        currentSymbol={currentSymbol}
        onSymbolChange={setCurrentSymbol}
        isConnected={isConnected}
      />

      {/* Main Layout */}
      <div className="flex pt-16 pb-0">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <main className="flex-1 ml-72 mr-80 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderView()}
          </div>
        </main>

        {/* Right Panels */}
        <RightPanels symbol={currentSymbol} />
      </div>
    </div>
  );
}