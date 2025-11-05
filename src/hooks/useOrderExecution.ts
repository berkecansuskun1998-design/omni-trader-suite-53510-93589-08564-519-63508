import { useState, useCallback } from 'react';
import { demoTradingEngine, Order, Trade } from '@/lib/demoTrading';
import { multiExchangeManager } from '@/lib/multiExchange';
import { toast } from 'sonner';

export interface OrderRequest {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
}

export interface Position {
  id: string;
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  amount: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  leverage: number;
  timestamp: Date;
}

export const useOrderExecution = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [balance, setBalance] = useState(100000);
  const [isExecuting, setIsExecuting] = useState(false);

  const executeOrder = useCallback(async (request: OrderRequest): Promise<Order | null> => {
    setIsExecuting(true);

    try {
      const exchange = multiExchangeManager.getExchange(request.exchange);
      if (!exchange) {
        toast.error(`Exchange ${request.exchange} not found`);
        return null;
      }

      const price = request.price || await multiExchangeManager.getPrice(request.exchange, request.symbol);
      
      const cost = request.amount * price;
      if (cost > balance) {
        toast.error(`Insufficient balance. Required: $${cost.toFixed(2)}, Available: $${balance.toFixed(2)}`);
        return null;
      }

      const order = demoTradingEngine.createOrder(
        request.exchange,
        request.symbol,
        request.side,
        request.type,
        request.amount,
        price
      );

      setOrders(prev => [order, ...prev]);

      if (order.status === 'filled') {
        const fee = cost * exchange.config.fees.taker;
        const totalCost = cost + fee;
        setBalance(prev => prev - totalCost);

        const position: Position = {
          id: `POS-${Date.now()}`,
          exchange: request.exchange,
          symbol: request.symbol,
          side: request.side === 'buy' ? 'long' : 'short',
          entryPrice: price,
          amount: request.amount,
          currentPrice: price,
          pnl: 0,
          pnlPercent: 0,
          leverage: 1,
          timestamp: new Date(),
        };

        setPositions(prev => [...prev, position]);
        toast.success(`Order executed: ${request.side.toUpperCase()} ${request.amount} ${request.symbol} @ $${price.toFixed(2)}`);
      }

      return order;
    } catch (error) {
      console.error('Order execution error:', error);
      toast.error('Failed to execute order');
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [balance]);

  const closePosition = useCallback(async (positionId: string) => {
    const position = positions.find(p => p.id === positionId);
    if (!position) {
      toast.error('Position not found');
      return;
    }

    try {
      const currentPrice = await multiExchangeManager.getPrice(position.exchange, position.symbol);
      
      const { pnl } = demoTradingEngine.calculatePnL(
        position.entryPrice,
        currentPrice,
        position.amount,
        position.side === 'long' ? 'buy' : 'sell'
      );

      const returnAmount = (position.amount * currentPrice) + pnl;
      setBalance(prev => prev + returnAmount);
      setPositions(prev => prev.filter(p => p.id !== positionId));

      const message = pnl >= 0 
        ? `Position closed with profit: $${pnl.toFixed(2)}`
        : `Position closed with loss: $${pnl.toFixed(2)}`;
      
      toast[pnl >= 0 ? 'success' : 'error'](message);

      const trade: Trade = {
        id: `TRD-${Date.now()}`,
        orderId: positionId,
        exchange: position.exchange,
        symbol: position.symbol,
        side: position.side === 'long' ? 'sell' : 'buy',
        price: currentPrice,
        amount: position.amount,
        fee: returnAmount * 0.001,
        timestamp: new Date(),
      };

      setTrades(prev => [trade, ...prev]);
    } catch (error) {
      console.error('Failed to close position:', error);
      toast.error('Failed to close position');
    }
  }, [positions]);

  const cancelOrder = useCallback((orderId: string) => {
    const success = demoTradingEngine.cancelOrder(orderId);
    if (success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' as const } : o));
      toast.success('Order cancelled');
    } else {
      toast.error('Failed to cancel order');
    }
  }, []);

  const updatePositions = useCallback(async () => {
    const updatedPositions = await Promise.all(
      positions.map(async (pos) => {
        try {
          const currentPrice = await multiExchangeManager.getPrice(pos.exchange, pos.symbol);
          const { pnl, pnlPercent } = demoTradingEngine.calculatePnL(
            pos.entryPrice,
            currentPrice,
            pos.amount,
            pos.side === 'long' ? 'buy' : 'sell'
          );

          return {
            ...pos,
            currentPrice,
            pnl,
            pnlPercent,
          };
        } catch {
          return pos;
        }
      })
    );

    setPositions(updatedPositions);
  }, [positions]);

  const getPortfolioValue = useCallback(() => {
    const positionsValue = positions.reduce((sum, pos) => sum + pos.pnl, 0);
    return balance + positionsValue;
  }, [balance, positions]);

  const getTotalPnL = useCallback(() => {
    return positions.reduce((sum, pos) => sum + pos.pnl, 0);
  }, [positions]);

  return {
    orders,
    positions,
    trades,
    balance,
    isExecuting,
    executeOrder,
    closePosition,
    cancelOrder,
    updatePositions,
    getPortfolioValue,
    getTotalPnL,
  };
};
