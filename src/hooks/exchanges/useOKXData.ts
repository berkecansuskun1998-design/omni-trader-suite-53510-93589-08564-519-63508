import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Trade, Timeframe } from '@/types/trading';
import { okx } from '@/lib/exchanges/okx';
import { toast } from 'sonner';

export function useOKXData(instId: string, timeframe: Timeframe = '15m') {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true);
      const bar = okx.convertTimeframe(timeframe);
      const url = okx.getKlinesUrl(instId, bar, 500);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.code !== '0') {
        throw new Error(data.msg || 'OKX API Error');
      }
      
      const formattedCandles = okx.formatKlinesToCandles(data.data);
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setLastPrice(formattedCandles[formattedCandles.length - 1].y[3]);
      }
      
      toast.success(`OKX: ${formattedCandles.length} candles loaded`);
    } catch (error) {
      const errorMsg = okx.handleError(error);
      console.error('OKX candles error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [instId, timeframe]);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(okx.getWebSocketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        
        // Subscribe to trades
        ws.send(JSON.stringify(okx.getTradeSubscription(instId)));
        
        // Setup ping interval (OKX requires ping every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('ping');
          }
        }, 30000);
        
        toast.success('OKX WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          
          const msg = JSON.parse(event.data);
          
          if (msg.event === 'subscribe') {
            console.log('OKX subscription confirmed:', msg);
            return;
          }
          
          if (msg.data && msg.data.length > 0) {
            const tradeData = msg.data[0];
            const trade = okx.formatTradeMessage(tradeData);
            
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
          console.error('OKX WebSocket message error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('OKX WebSocket error:', error);
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
      };
    } catch (error) {
      const errorMsg = okx.handleError(error);
      console.error('OKX WebSocket connection error:', errorMsg);
      toast.error(errorMsg);
      setConnected(false);
    }
  }, [instId]);

  useEffect(() => {
    fetchCandles();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
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
