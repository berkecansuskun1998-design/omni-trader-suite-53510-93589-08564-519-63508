import { memo } from 'react';
import { Watchlist } from '@/components/trading/Watchlist';
import { TimeframeSelector } from '@/components/trading/TimeframeSelector';
import { MultiChartLayout } from '@/components/trading/MultiChartLayout';
import { DrawingTools } from '@/components/trading/DrawingTools';
import { IndicatorControls } from '@/components/trading/IndicatorControls';
import { CandlestickPatterns } from '@/components/trading/CandlestickPatterns';
import { PerformanceMetrics } from '@/components/trading/PerformanceMetrics';
import { QuickStats } from '@/components/trading/QuickStats';
import { TradingSignals } from '@/components/trading/TradingSignals';
import { AdvancedTerminal } from '@/components/trading/AdvancedTerminal';
import { Timeframe, IndicatorSettings, CandlestickPattern, Candle } from '@/types/trading';

interface LeftSidebarProps {
  symbols: string[];
  activeSymbol: string;
  timeframe: Timeframe;
  indicatorSettings: IndicatorSettings;
  detectedPatterns: CandlestickPattern[];
  candles: Candle[];
  lastPrice: number | null;
  logs: Array<{ message: string; level: 'info' | 'warn' | 'error'; timestamp: Date }>;
  onSymbolClick: (symbol: string) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onApplyIndicators: (settings: IndicatorSettings) => void;
}

export const LeftSidebar = memo(({
  symbols,
  activeSymbol,
  timeframe,
  indicatorSettings,
  detectedPatterns,
  candles,
  lastPrice,
  logs,
  onSymbolClick,
  onTimeframeChange,
  onApplyIndicators,
}: LeftSidebarProps) => {
  return (
    <aside className="glass-panel space-y-4 rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:shadow-primary/10 animate-fade-in-up">
      <Watchlist
        symbols={symbols}
        activeSymbol={activeSymbol}
        onSymbolClick={onSymbolClick}
      />
      
      <TimeframeSelector
        selected={timeframe}
        onChange={onTimeframeChange}
      />
      
      <MultiChartLayout />
      
      <DrawingTools />
      
      <IndicatorControls
        settings={indicatorSettings}
        onApply={onApplyIndicators}
      />

      {indicatorSettings.showPatterns && (
        <CandlestickPatterns patterns={detectedPatterns} />
      )}

      <PerformanceMetrics
        candles={candles}
        currentPrice={lastPrice}
        symbol={activeSymbol}
      />

      <QuickStats symbol={activeSymbol} price={lastPrice} />

      <TradingSignals candles={candles} symbol={activeSymbol} />

      <AdvancedTerminal logs={logs} />
    </aside>
  );
});

LeftSidebar.displayName = 'LeftSidebar';