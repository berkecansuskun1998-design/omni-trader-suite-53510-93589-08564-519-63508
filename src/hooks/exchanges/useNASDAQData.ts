import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Trade, Timeframe } from '@/types/trading';
import { nasdaq } from '@/lib/exchanges/nasdaq';
import { toast } from 'sonner';

export function useNASDAQData(symbol: string, timeframe: Timeframe = '1d') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [marketOpen, setMarketOpen] = useState(false);
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      const { range, interval } = nasdaq.convertTimeframe(timeframe);
      const normalizedSymbol = nasdaq.formatSymbol(symbol);
      const url = nasdaq.getChartUrl(normalizedSymbol, range, interval);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const formattedCandles = nasdaq.formatYahooDataToCandles(data);
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setLastPrice(formattedCandles[formattedCandles.length - 1].y[3]);
      }
      
      // Get current quote
      const quoteData = nasdaq.formatQuoteResponse(data);
      if (quoteData) {
        setLastPrice(quoteData.price);
      }
      
      toast.success(`NASDAQ: ${formattedCandles.length} candles loaded`);
    } catch (error) {
      const errorMsg = nasdaq.handleError(error);
      console.error('NASDAQ candles error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const checkMarketStatus = useCallback(() => {
    const isOpen = nasdaq.isMarketOpen();
    setMarketOpen(isOpen);
    return isOpen;
  }, []);

  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Initial fetch
    fetchCandles();
    checkMarketStatus();

    // Poll every 5 seconds during market hours, every 60 seconds when closed
    const interval = nasdaq.isMarketOpen() ? 5000 : 60000;
    
    pollingIntervalRef.current = setInterval(() => {
      fetchCandles();
      checkMarketStatus();
    }, interval);
  }, [fetchCandles, checkMarketStatus]);

  const generateSimulatedTrade = useCallback(() => {
    if (!lastPrice) return;

    const change = (Math.random() - 0.5) * (lastPrice * 0.001);
    const newPrice = lastPrice + change;
    
    const trade: Trade = {
      price: newPrice,
      volume: Math.random() * 100,
      timestamp: Date.now(),
      side: change > 0 ? 'buy' : 'sell'
    };

    setTrades(prev => [trade, ...prev.slice(0, 99)]);
    setLastPrice(newPrice);

    // Update last candle
    setCandles(prev => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const lastCandle = updated[updated.length - 1];
      lastCandle.y[3] = newPrice;
      if (newPrice > lastCandle.y[1]) lastCandle.y[1] = newPrice;
      if (newPrice < lastCandle.y[2]) lastCandle.y[2] = newPrice;
      return updated;
    });
  }, [lastPrice]);

  useEffect(() => {
    startPolling();

    // Simulate trades during market hours
    const tradeInterval = setInterval(() => {
      if (nasdaq.isMarketOpen() && lastPrice) {
        generateSimulatedTrade();
      }
    }, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      clearInterval(tradeInterval);
    };
  }, [startPolling, generateSimulatedTrade, lastPrice]);

  return {
    candles,
    lastPrice,
    trades,
    loading,
    connected: true, // Always true for REST polling
    marketOpen,
    refetch: fetchCandles,
  };
}
