import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Trade, Timeframe } from '@/types/trading';
import { binance } from '@/lib/exchanges/binance';
import { toast } from 'sonner';

export function useBinanceData(symbol: string, timeframe: Timeframe = '15m') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      const interval = binance.convertTimeframe?.(timeframe) || timeframe;
      const url = binance.getKlinesUrl(symbol, interval, 500);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const formattedCandles = binance.formatKlinesToCandles(data);
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setLastPrice(formattedCandles[formattedCandles.length - 1].y[3]);
      }
      
      toast.success(`Binance: ${formattedCandles.length} candles loaded`);
      reconnectAttempts.current = 0;
    } catch (error) {
      const errorMsg = binance.handleError(error);
      console.error('Binance candles error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      toast.error('Binance: Max reconnection attempts reached');
      return;
    }

    try {
      const ws = new WebSocket(binance.getTradeWebSocketUrl(symbol));
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        reconnectAttempts.current = 0;
        toast.success('Binance WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const trade = binance.formatTradeMessage(msg);
          
          setLastPrice(trade.price);
          setTrades(prev => [trade, ...prev.slice(0, 99)]);
          
          // Update last candle
          setCandles(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastCandle = updated[updated.length - 1];
            lastCandle.y[3] = trade.price; // Update close
            if (trade.price > lastCandle.y[1]) lastCandle.y[1] = trade.price; // Update high
            if (trade.price < lastCandle.y[2]) lastCandle.y[2] = trade.price; // Update low
            return updated;
          });
        } catch (e) {
          console.error('Binance WebSocket message error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('Binance WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        
        // Attempt reconnection
        reconnectAttempts.current++;
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        }
      };
    } catch (error) {
      const errorMsg = binance.handleError(error);
      console.error('Binance WebSocket connection error:', errorMsg);
      toast.error(errorMsg);
      setConnected(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchCandles();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
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
