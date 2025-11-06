import { supabase } from '@/integrations/supabase/client';
import { realTradingEngine } from './realTrading';
import { coldWalletPaymentSystem } from './coldWalletPayments';

export type AdvancedOrderType = 
  | 'market' 
  | 'limit' 
  | 'stop-loss' 
  | 'take-profit' 
  | 'stop-limit'
  | 'trailing-stop'
  | 'oco'
  | 'iceberg'
  | 'twap'
  | 'vwap';

export interface AdvancedOrder {
  id: string;
  userId: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: AdvancedOrderType;
  amount: number;
  price?: number;
  stopPrice?: number;
  trailingPercent?: number;
  icebergQty?: number;
  timeWindow?: number;
  ocoSellPrice?: number;
  ocoStopPrice?: number;
  status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired';
  filled: number;
  averagePrice: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface OCOOrder {
  limitOrderId: string;
  stopOrderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  limitPrice: number;
  stopPrice: number;
  status: 'pending' | 'filled' | 'cancelled';
}

export interface IcebergOrder {
  parentOrderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  totalAmount: number;
  visibleAmount: number;
  price: number;
  filled: number;
  childOrders: string[];
  status: 'active' | 'filled' | 'cancelled';
}

export interface TWAPOrder {
  orderId: string;
  symbol: string;
  side: 'buy' | 'sell';
  totalAmount: number;
  timeWindow: number;
  intervals: number;
  amountPerInterval: number;
  executed: number;
  childOrders: string[];
  status: 'active' | 'completed' | 'cancelled';
}

export class AdvancedOrderManager {
  private userId: string | null = null;
  private activeOrders: Map<string, AdvancedOrder> = new Map();
  private ocoOrders: Map<string, OCOOrder> = new Map();
  private icebergOrders: Map<string, IcebergOrder> = new Map();
  private twapOrders: Map<string, TWAPOrder> = new Map();

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadActiveOrders();
  }

  private async loadActiveOrders() {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('advanced_orders')
        .select('*')
        .eq('user_id', this.userId)
        .in('status', ['pending', 'active']);

      if (error) throw error;

      (data || []).forEach(order => {
        this.activeOrders.set(order.id, this.mapDbOrderToAdvancedOrder(order));
      });
    } catch (error) {
      console.error('Failed to load active orders:', error);
    }
  }

  private mapDbOrderToAdvancedOrder(dbOrder: any): AdvancedOrder {
    return {
      id: dbOrder.id,
      userId: dbOrder.user_id,
      exchange: dbOrder.exchange,
      symbol: dbOrder.symbol,
      side: dbOrder.side,
      type: dbOrder.type,
      amount: dbOrder.amount,
      price: dbOrder.price,
      stopPrice: dbOrder.stop_price,
      trailingPercent: dbOrder.trailing_percent,
      icebergQty: dbOrder.iceberg_qty,
      timeWindow: dbOrder.time_window,
      ocoSellPrice: dbOrder.oco_sell_price,
      ocoStopPrice: dbOrder.oco_stop_price,
      status: dbOrder.status,
      filled: dbOrder.filled,
      averagePrice: dbOrder.average_price,
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at),
      expiresAt: dbOrder.expires_at ? new Date(dbOrder.expires_at) : undefined
    };
  }

  async createStopLoss(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    stopPrice: number,
    limitPrice?: number
  ): Promise<AdvancedOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const order: AdvancedOrder = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      exchange,
      symbol,
      side,
      type: limitPrice ? 'stop-limit' : 'stop-loss',
      amount,
      price: limitPrice,
      stopPrice,
      status: 'pending',
      filled: 0,
      averagePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveOrder(order);
    this.activeOrders.set(order.id, order);
    this.monitorStopLoss(order.id);

    return order;
  }

  async createTakeProfit(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    targetPrice: number
  ): Promise<AdvancedOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const order: AdvancedOrder = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      exchange,
      symbol,
      side,
      type: 'take-profit',
      amount,
      price: targetPrice,
      status: 'pending',
      filled: 0,
      averagePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveOrder(order);
    this.activeOrders.set(order.id, order);
    this.monitorTakeProfit(order.id);

    return order;
  }

  async createTrailingStop(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    trailingPercent: number,
    currentPrice: number
  ): Promise<AdvancedOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const initialStopPrice = side === 'buy' 
      ? currentPrice * (1 + trailingPercent / 100)
      : currentPrice * (1 - trailingPercent / 100);

    const order: AdvancedOrder = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      exchange,
      symbol,
      side,
      type: 'trailing-stop',
      amount,
      stopPrice: initialStopPrice,
      trailingPercent,
      status: 'active',
      filled: 0,
      averagePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveOrder(order);
    this.activeOrders.set(order.id, order);
    this.monitorTrailingStop(order.id);

    return order;
  }

  async createOCO(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    limitPrice: number,
    stopPrice: number
  ): Promise<OCOOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const limitOrder = await this.createAdvancedOrder(exchange, symbol, side, amount, 'limit', limitPrice);
    const stopOrder = await this.createStopLoss(exchange, symbol, side, amount, stopPrice);

    const ocoOrder: OCOOrder = {
      limitOrderId: limitOrder.id,
      stopOrderId: stopOrder.id,
      symbol,
      side,
      amount,
      limitPrice,
      stopPrice,
      status: 'pending'
    };

    const ocoId = `oco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.ocoOrders.set(ocoId, ocoOrder);

    await supabase.from('oco_orders').insert({
      id: ocoId,
      user_id: this.userId,
      limit_order_id: limitOrder.id,
      stop_order_id: stopOrder.id,
      symbol,
      side,
      amount,
      limit_price: limitPrice,
      stop_price: stopPrice,
      status: 'pending',
      created_at: new Date().toISOString()
    });

    this.monitorOCO(ocoId);

    return ocoOrder;
  }

  async createIcebergOrder(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    totalAmount: number,
    visibleAmount: number,
    price: number
  ): Promise<IcebergOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const icebergId = `ice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const icebergOrder: IcebergOrder = {
      parentOrderId: icebergId,
      symbol,
      side,
      totalAmount,
      visibleAmount,
      price,
      filled: 0,
      childOrders: [],
      status: 'active'
    };

    this.icebergOrders.set(icebergId, icebergOrder);

    await supabase.from('iceberg_orders').insert({
      id: icebergId,
      user_id: this.userId,
      exchange,
      symbol,
      side,
      total_amount: totalAmount,
      visible_amount: visibleAmount,
      price,
      filled: 0,
      status: 'active',
      created_at: new Date().toISOString()
    });

    this.executeIcebergOrder(icebergId, exchange);

    return icebergOrder;
  }

  async createTWAPOrder(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    totalAmount: number,
    timeWindowMinutes: number,
    intervals: number
  ): Promise<TWAPOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const amountPerInterval = totalAmount / intervals;
    const twapId = `twap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const twapOrder: TWAPOrder = {
      orderId: twapId,
      symbol,
      side,
      totalAmount,
      timeWindow: timeWindowMinutes,
      intervals,
      amountPerInterval,
      executed: 0,
      childOrders: [],
      status: 'active'
    };

    this.twapOrders.set(twapId, twapOrder);

    await supabase.from('twap_orders').insert({
      id: twapId,
      user_id: this.userId,
      exchange,
      symbol,
      side,
      total_amount: totalAmount,
      time_window: timeWindowMinutes,
      intervals,
      amount_per_interval: amountPerInterval,
      executed: 0,
      status: 'active',
      created_at: new Date().toISOString()
    });

    this.executeTWAPOrder(twapId, exchange);

    return twapOrder;
  }

  private async createAdvancedOrder(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    type: AdvancedOrderType,
    price?: number
  ): Promise<AdvancedOrder> {
    if (!this.userId) throw new Error('User not initialized');

    const order: AdvancedOrder = {
      id: `adv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      exchange,
      symbol,
      side,
      type,
      amount,
      price,
      status: 'pending',
      filled: 0,
      averagePrice: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveOrder(order);
    this.activeOrders.set(order.id, order);

    return order;
  }

  private async saveOrder(order: AdvancedOrder) {
    await supabase.from('advanced_orders').insert({
      id: order.id,
      user_id: order.userId,
      exchange: order.exchange,
      symbol: order.symbol,
      side: order.side,
      type: order.type,
      amount: order.amount,
      price: order.price,
      stop_price: order.stopPrice,
      trailing_percent: order.trailingPercent,
      iceberg_qty: order.icebergQty,
      time_window: order.timeWindow,
      oco_sell_price: order.ocoSellPrice,
      oco_stop_price: order.ocoStopPrice,
      status: order.status,
      filled: order.filled,
      average_price: order.averagePrice,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
      expires_at: order.expiresAt?.toISOString()
    });
  }

  private monitorStopLoss(orderId: string) {
    const checkInterval = setInterval(async () => {
      const order = this.activeOrders.get(orderId);
      if (!order || order.status !== 'pending') {
        clearInterval(checkInterval);
        return;
      }
    }, 1000);
  }

  private monitorTakeProfit(orderId: string) {
    const checkInterval = setInterval(async () => {
      const order = this.activeOrders.get(orderId);
      if (!order || order.status !== 'pending') {
        clearInterval(checkInterval);
        return;
      }
    }, 1000);
  }

  private monitorTrailingStop(orderId: string) {
    const checkInterval = setInterval(async () => {
      const order = this.activeOrders.get(orderId);
      if (!order || order.status !== 'active') {
        clearInterval(checkInterval);
        return;
      }
    }, 1000);
  }

  private monitorOCO(ocoId: string) {
    const checkInterval = setInterval(async () => {
      const oco = this.ocoOrders.get(ocoId);
      if (!oco || oco.status !== 'pending') {
        clearInterval(checkInterval);
        return;
      }
    }, 1000);
  }

  private async executeIcebergOrder(icebergId: string, exchange: string) {
    const iceberg = this.icebergOrders.get(icebergId);
    if (!iceberg) return;

    const remainingAmount = iceberg.totalAmount - iceberg.filled;
    if (remainingAmount <= 0) {
      iceberg.status = 'filled';
      await supabase.from('iceberg_orders').update({ status: 'filled' }).eq('id', icebergId);
      return;
    }

    const orderAmount = Math.min(iceberg.visibleAmount, remainingAmount);
    
    try {
      const childOrder = await realTradingEngine.executeOrder(
        exchange,
        iceberg.symbol,
        iceberg.side,
        'limit',
        orderAmount,
        iceberg.price
      );

      iceberg.childOrders.push(childOrder.id);
      iceberg.filled += orderAmount;

      if (iceberg.filled < iceberg.totalAmount) {
        setTimeout(() => this.executeIcebergOrder(icebergId, exchange), 5000);
      } else {
        iceberg.status = 'filled';
        await supabase.from('iceberg_orders').update({ status: 'filled', filled: iceberg.filled }).eq('id', icebergId);
      }
    } catch (error) {
      console.error('Iceberg order execution failed:', error);
    }
  }

  private async executeTWAPOrder(twapId: string, exchange: string) {
    const twap = this.twapOrders.get(twapId);
    if (!twap) return;

    const intervalTime = (twap.timeWindow * 60 * 1000) / twap.intervals;
    let executedIntervals = 0;

    const intervalId = setInterval(async () => {
      if (executedIntervals >= twap.intervals) {
        clearInterval(intervalId);
        twap.status = 'completed';
        await supabase.from('twap_orders').update({ status: 'completed' }).eq('id', twapId);
        return;
      }

      try {
        const childOrder = await realTradingEngine.executeOrder(
          exchange,
          twap.symbol,
          twap.side,
          'market',
          twap.amountPerInterval
        );

        twap.childOrders.push(childOrder.id);
        twap.executed += twap.amountPerInterval;
        executedIntervals++;

        await supabase.from('twap_orders').update({ executed: twap.executed }).eq('id', twapId);
      } catch (error) {
        console.error('TWAP interval execution failed:', error);
      }
    }, intervalTime);
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    const order = this.activeOrders.get(orderId);
    if (!order) return false;

    order.status = 'cancelled';
    order.updatedAt = new Date();

    await supabase
      .from('advanced_orders')
      .update({ status: 'cancelled', updated_at: order.updatedAt.toISOString() })
      .eq('id', orderId);

    this.activeOrders.delete(orderId);
    return true;
  }

  getActiveOrders(): AdvancedOrder[] {
    return Array.from(this.activeOrders.values());
  }

  async getOrderHistory(limit: number = 50): Promise<AdvancedOrder[]> {
    if (!this.userId) throw new Error('User not initialized');

    const { data, error } = await supabase
      .from('advanced_orders')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(this.mapDbOrderToAdvancedOrder);
  }
}

export const advancedOrderManager = new AdvancedOrderManager();
