import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Trade, Timeframe } from '@/types/trading';
import { coinbase } from '@/lib/exchanges/coinbase';
import { toast } from 'sonner';

export function useCoinbaseData(productId: string, timeframe: Timeframe = '15m') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      const granularity = coinbase.convertTimeframe(timeframe);
      const normalizedProductId = coinbase.normalizeSymbol(productId);
      const url = coinbase.getKlinesUrl(normalizedProductId, granularity);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const formattedCandles = coinbase.formatKlinesToCandles(data);
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setLastPrice(formattedCandles[formattedCandles.length - 1].y[3]);
      }
      
      toast.success(`Coinbase: ${formattedCandles.length} candles loaded`);
    } catch (error) {
      const errorMsg = coinbase.handleError(error);
      console.error('Coinbase candles error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [productId, timeframe]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const normalizedProductId = coinbase.normalizeSymbol(productId);
      const ws = new WebSocket(coinbase.getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        
        // Subscribe to trades
        ws.send(JSON.stringify(coinbase.getTradeSubscription([normalizedProductId])));
        
        toast.success('Coinbase WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          // Handle subscription confirmation
          if (msg.type === 'subscriptions') {
            console.log('Coinbase subscription confirmed:', msg);
            return;
          }
          
          // Handle trade messages
          const trade = coinbase.formatTradeMessage(msg);
          if (trade) {
            setLastPrice(trade.price);
            setTrades(prev => [trade, ...prev.slice(0, 99)]);
            
            // Update last candle
            setCandles(prev => {
              if (prev.length === 0) return prev;
              const updated = [...prev];
              const lastCandle = updated[updated.length - 1];
              lastCandle.y[3] = trade.price;
              if (trade.price > lastCandle.y[1]) lastCandle.y[1] = trade.price;
              if (trade.price < lastCandle.y[2]) lastCandle.y[2] = trade.price;
              return updated;
            });
          }
        } catch (e) {
          console.error('Coinbase WebSocket message error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Coinbase WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
      };
    } catch (error) {
      const errorMsg = coinbase.handleError(error);
      console.error('Coinbase WebSocket connection error:', errorMsg);
      toast.error(errorMsg);
      setConnected(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchCandles();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchCandles, connectWebSocket]);

  return {
    candles,
    lastPrice,
    trades,
    loading,
    connected,
    refetch: fetchCandles,
  };
}
