import { memo } from 'react';
import { BuyOmni99 } from '@/components/tokens/BuyOmni99';
import { WalletButton } from '@/components/web3/WalletButton';
import { MarketSelector } from '@/components/trading/MarketSelector';
import { OrderPanel } from '@/components/trading/OrderPanel';
import { AdvancedOrderTypes } from '@/components/trading/AdvancedOrderTypes';
import { PortfolioTracker } from '@/components/trading/PortfolioTracker';
import { AutoTradingSignals } from '@/components/trading/AutoTradingSignals';
import { SocialTrading } from '@/components/trading/SocialTrading';
import { MarketScanner } from '@/components/trading/MarketScanner';
import { MarketSentiment } from '@/components/trading/MarketSentiment';
import { PriceAlerts } from '@/components/trading/PriceAlerts';
import { RiskCalculator } from '@/components/trading/RiskCalculator';
import { LiquidityZones } from '@/components/trading/LiquidityZones';
import { EconomicCalendar } from '@/components/trading/EconomicCalendar';
import { HotkeyPanel } from '@/components/trading/HotkeyPanel';
import { TradeJournal } from '@/components/trading/TradeJournal';
import { SwapInterface } from '@/components/web3/SwapInterface';
import { CryptoPayment } from '@/components/web3/CryptoPayment';
import { MarketSummary } from '@/components/trading/MarketSummary';
import { NewsFeed } from '@/components/trading/NewsFeed';
import { Exchange, AssetType } from '@/types/trading';

interface RightSidebarProps {
  symbol: string;
  exchange: Exchange;
  currentPrice: number | null;
  assetType: AssetType;
  onSelectSymbol: (symbol: string, type: AssetType) => void;
}

export const RightSidebar = memo(({
  symbol,
  exchange,
  currentPrice,
  assetType,
  onSelectSymbol,
}: RightSidebarProps) => {
  return (
    <aside className="glass-panel space-y-4 rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:shadow-primary/10 animate-slide-in-right">
      <BuyOmni99 />
      <WalletButton />
      <MarketSelector 
        onSelectSymbol={onSelectSymbol} 
        selectedSymbol={symbol}
      />
      <OrderPanel 
        symbol={symbol} 
        currentPrice={currentPrice} 
        assetType={assetType}
        exchange={exchange}
      />
      <AdvancedOrderTypes />
      <PortfolioTracker />
      <AutoTradingSignals />
      <SocialTrading />
      <MarketScanner />
      <MarketSentiment />
      <PriceAlerts />
      <RiskCalculator />
      <LiquidityZones />
      <EconomicCalendar />
      <HotkeyPanel />
      <TradeJournal />
      <SwapInterface />
      <CryptoPayment />
      <MarketSummary exchange={exchange} symbol={symbol} />
      <NewsFeed />
    </aside>
  );
});

RightSidebar.displayName = 'RightSidebar';