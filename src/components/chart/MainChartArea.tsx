import { memo } from 'react';
import { RealHeatmap } from '@/components/trading/RealHeatmap';
import { PriceDisplay } from '@/components/trading/PriceDisplay';
import { OptimizedChart } from '@/components/trading/OptimizedChart';
import { VolumeChart } from '@/components/trading/VolumeChart';
import { DepthChart } from '@/components/trading/DepthChart';
import { TradeFeed } from '@/components/trading/TradeFeed';
import { OrderBook } from '@/components/trading/OrderBook';
import { Exchange, IndicatorSettings, Candle, Trade } from '@/types/trading';

interface MainChartAreaProps {
  symbol: string;
  exchange: Exchange;
  source: string;
  candles: Candle[];
  trades: Trade[];
  lastPrice: number | null;
  previousPrice: number | null;
  indicatorSettings: IndicatorSettings;
}

export const MainChartArea = memo(({
  symbol,
  exchange,
  source,
  candles,
  trades,
  lastPrice,
  previousPrice,
  indicatorSettings,
}: MainChartAreaProps) => {
  return (
    <main className="glass-panel space-y-4 rounded-2xl p-5 shadow-2xl animate-scale-in gradient-glow">
      <RealHeatmap />
      
      <PriceDisplay
        symbol={symbol}
        price={lastPrice}
        previousPrice={previousPrice}
        source={source.toUpperCase()}
      />

      <OptimizedChart
        candles={candles}
        showSMA={indicatorSettings.showSMA}
        showEMA={indicatorSettings.showEMA}
        showRSI={indicatorSettings.showRSI}
        showMACD={indicatorSettings.showMACD}
        showBB={indicatorSettings.showBB}
        showFib={indicatorSettings.showFib}
        smaPeriod={indicatorSettings.smaPeriod}
        emaPeriod={indicatorSettings.emaPeriod}
        rsiPeriod={indicatorSettings.rsiPeriod}
        symbol={symbol}
      />

      <VolumeChart
        data={candles.map((c) => ({
          x: c.x,
          y: (c.y[1] - c.y[2]) * Math.random() * 1000,
        }))}
      />

      <DepthChart exchange={exchange} symbol={symbol} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TradeFeed trades={trades} />
        <OrderBook exchange={exchange} symbol={symbol} lastPrice={lastPrice} />
      </div>
    </main>
  );
});

MainChartArea.displayName = 'MainChartArea';