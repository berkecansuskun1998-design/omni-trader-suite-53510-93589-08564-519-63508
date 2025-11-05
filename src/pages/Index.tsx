import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/navigation/Navbar';
import { Header } from '@/components/trading/Header';
import { ParticleBackground } from '@/components/effects/ParticleBackground';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { LeftSidebar } from '@/components/sidebars/LeftSidebar';
import { RightSidebar } from '@/components/sidebars/RightSidebar';
import { MainChartArea } from '@/components/chart/MainChartArea';
import { Exchange, DataSource, IndicatorSettings, Timeframe, AssetType } from '@/types/trading';
import { getExchangeDefaults } from '@/lib/exchanges';
import { useTradingData } from '@/hooks/useTradingData';
import { detectCandlestickPatterns } from '@/lib/indicators';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);
      
      if (roleData) {
        toast.success('Admin Panel Erişimi Aktif', {
          description: 'Yönetici özellikleri kullanıma hazır'
        });
      }
    };

    checkAuth();
  }, [navigate]);

  const [exchange, setExchange] = useState<Exchange>(
    (localStorage.getItem('omni_exchange') as Exchange) || 'BINANCE'
  );
  const [symbol, setSymbol] = useState<string>(
    localStorage.getItem('omni_symbol') || getExchangeDefaults('BINANCE')[0].toLowerCase()
  );
  const [source, setSource] = useState<DataSource>(
    (localStorage.getItem('omni_source') as DataSource) || 'ws'
  );
  const [timeframe, setTimeframe] = useState<Timeframe>(
    (localStorage.getItem('omni_timeframe') as Timeframe) || '15m'
  );
  const [previousPrice, setPreviousPrice] = useState<number | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [assetType, setAssetType] = useState<AssetType>('crypto');
  
  const [indicatorSettings, setIndicatorSettings] = useState<IndicatorSettings>({
    showSMA: true,
    showEMA: true,
    showRSI: true,
    showMACD: false,
    showBB: false,
    showFib: false,
    showPatterns: true,
    smaPeriod: parseInt(localStorage.getItem('omni_sma') || '20'),
    emaPeriod: parseInt(localStorage.getItem('omni_ema') || '20'),
    rsiPeriod: parseInt(localStorage.getItem('omni_rsi') || '14'),
  });

  const [logs, setLogs] = useState<Array<{ message: string; level: 'info' | 'warn' | 'error'; timestamp: Date }>>([]);

  const addLog = useCallback((message: string, level: 'info' | 'warn' | 'error' = 'info') => {
    setLogs(prev => [{ message, level, timestamp: new Date() }, ...prev.slice(0, 199)]);
  }, []);

  const { candles, lastPrice, trades, loading, refetch } = useTradingData(exchange, symbol, source, timeframe);
  
  const detectedPatterns = useMemo(() => {
    if (!indicatorSettings.showPatterns || candles.length < 10) return [];
    return detectCandlestickPatterns(candles);
  }, [candles, indicatorSettings.showPatterns]);

  useEffect(() => {
    const defaults = getExchangeDefaults(exchange).map(s => s.toLowerCase());
    setSymbols(defaults);
    if (!defaults.includes(symbol)) {
      setSymbol(defaults[0]);
    }
  }, [exchange]);

  useEffect(() => {
    localStorage.setItem('omni_exchange', exchange);
    localStorage.setItem('omni_symbol', symbol);
    localStorage.setItem('omni_source', source);
    localStorage.setItem('omni_timeframe', timeframe);
  }, [exchange, symbol, source, timeframe]);

  useEffect(() => {
    if (lastPrice !== null && previousPrice !== null) {
      addLog(`Price updated: $${lastPrice.toFixed(6)}`, 'info');
    }
    setPreviousPrice(lastPrice);
  }, [lastPrice]);

  useEffect(() => {
    addLog(`Trading terminal initialized - ${exchange} / ${symbol.toUpperCase()}`, 'info');
  }, []);

  const handleExchangeChange = (newExchange: Exchange) => {
    setExchange(newExchange);
    const defaults = getExchangeDefaults(newExchange);
    setSymbol(defaults[0].toLowerCase());
    addLog(`Switched to ${newExchange}`, 'info');
    toast.success(`Switched to ${newExchange}`);
  };

  const handleSymbolChange = (newSymbol: string) => {
    setSymbol(newSymbol);
    addLog(`Symbol changed to ${newSymbol.toUpperCase()}`, 'info');
  };

  const handleSourceChange = (newSource: DataSource) => {
    setSource(newSource);
    addLog(`Data source changed to ${newSource.toUpperCase()}`, 'info');
    toast.info(`Using ${newSource.toUpperCase()} data source`);
  };

  const handleRefresh = () => {
    refetch();
    addLog('Manual refresh triggered', 'info');
    toast.success('Data refreshed');
  };

  const handleApplyIndicators = (settings: IndicatorSettings) => {
    setIndicatorSettings(settings);
    localStorage.setItem('omni_sma', settings.smaPeriod.toString());
    localStorage.setItem('omni_ema', settings.emaPeriod.toString());
    localStorage.setItem('omni_rsi', settings.rsiPeriod.toString());
    addLog('Indicators updated', 'info');
    toast.success('Indicators applied');
  };

  if (showAdminPanel && isAdmin) {
    return (
      <>
        <Navbar onAdminClick={() => setShowAdminPanel(false)} isAdmin={isAdmin} />
        <div className="relative min-h-screen pt-24 p-4 animate-fade-in">
          <ParticleBackground />
          <div className="relative z-10 mx-auto max-w-[1800px] space-y-4">
            <div className="glass-panel-strong rounded-2xl p-6 animate-scale-in">
              <AdminPanel />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onAdminClick={() => setShowAdminPanel(true)} isAdmin={isAdmin} />
      <div className="relative min-h-screen pt-24 p-4 animate-fade-in">
        <ParticleBackground />
        <div className="relative z-10 mx-auto max-w-[1800px] space-y-4">
          <div className="glass-panel-strong rounded-2xl p-4 neon-border-strong animate-slide-fade-down">
            <Header
              exchange={exchange}
              symbol={symbol}
              source={source}
              symbols={symbols}
              onExchangeChange={handleExchangeChange}
              onSymbolChange={handleSymbolChange}
              onSourceChange={handleSourceChange}
              onRefresh={handleRefresh}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[380px_1fr_380px]">
            <LeftSidebar
              symbols={symbols}
              activeSymbol={symbol}
              timeframe={timeframe}
              indicatorSettings={indicatorSettings}
              detectedPatterns={detectedPatterns}
              candles={candles}
              lastPrice={lastPrice}
              logs={logs}
              onSymbolClick={handleSymbolChange}
              onTimeframeChange={setTimeframe}
              onApplyIndicators={handleApplyIndicators}
            />

            <MainChartArea
              symbol={symbol}
              exchange={exchange}
              source={source}
              candles={candles}
              trades={trades}
              lastPrice={lastPrice}
              previousPrice={previousPrice}
              indicatorSettings={indicatorSettings}
            />

            <RightSidebar
              symbol={symbol}
              exchange={exchange}
              currentPrice={lastPrice}
              assetType={assetType}
              onSelectSymbol={(sym, type) => {
                setSymbol(sym.toLowerCase());
                setAssetType(type);
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
