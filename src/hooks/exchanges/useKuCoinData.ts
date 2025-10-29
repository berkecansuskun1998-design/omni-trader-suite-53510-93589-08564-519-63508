import { useState, useEffect, useCallback, useRef } from 'react';
import { Candle, Trade, Timeframe } from '@/types/trading';
import { kucoin } from '@/lib/exchanges/kucoin';
import { toast } from 'sonner';

export function useKuCoinData(symbol: string, timeframe: Timeframe = '15m') {
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
      const type = kucoin.convertTimeframe(timeframe);
      const url = kucoin.getKlinesUrl(symbol, type);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.code !== '200000') {
        throw new Error(result.msg || 'KuCoin API Error');
      }
      
      const formattedCandles = kucoin.formatKlinesToCandles(result.data);
      
      setCandles(formattedCandles);
      if (formattedCandles.length > 0) {
        setLastPrice(formattedCandles[formattedCandles.length - 1].y[3]);
      }
      
      toast.success(`KuCoin: ${formattedCandles.length} candles loaded`);
    } catch (error) {
      const errorMsg = kucoin.handleError(error);
      console.error('KuCoin candles error:', errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  const connectWebSocket = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      // Get WebSocket token and endpoint
      const wsUrl = await kucoin.getWebSocketUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        
        // Subscribe to trades
        ws.send(JSON.stringify(kucoin.getTradeSubscription(symbol)));
        
        // Setup ping interval (KuCoin requires ping every 30 seconds)
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              id: Date.now(),
              type: 'ping'
            }));
          }
        }, 30000);
        
        toast.success('KuCoin WebSocket connected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'pong') return;
          
          if (msg.type === 'ack') {
            console.log('KuCoin subscription confirmed:', msg);
            return;
          }
          
          if (msg.type === 'message' && msg.topic?.includes('/market/match:')) {
            const tradeData = msg.data;
            const trade = kucoin.formatTradeMessage(tradeData);
            
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
          console.error('KuCoin WebSocket message error:', e);
        }
      };

      ws.onerror = (error) => {
        console.error('KuCoin WebSocket error:', error);
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
      const errorMsg = kucoin.handleError(error);
      console.error('KuCoin WebSocket connection error:', errorMsg);
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
