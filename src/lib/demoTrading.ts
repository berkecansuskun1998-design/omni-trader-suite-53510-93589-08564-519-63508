export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdate: Date;
}

export interface Order {
  id: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop';
  price: number;
  amount: number;
  filled: number;
  status: 'pending' | 'filled' | 'cancelled' | 'partial';
  timestamp: Date;
}

export interface Trade {
  id: string;
  orderId: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  amount: number;
  fee: number;
  timestamp: Date;
}

const baseSymbols: Record<string, number> = {
  BTCUSDT: 67890,
  ETHUSDT: 3456,
  BNBUSDT: 589,
  SOLUSDT: 145,
  XRPUSDT: 0.62,
  ADAUSDT: 0.58,
  DOGEUSDT: 0.15,
  MATICUSDT: 0.89,
  AVAXUSDT: 38.5,
  LINKUSDT: 15.8,
};

export class DemoTradingEngine {
  private marketData: Map<string, MarketData> = new Map();
  private orders: Map<string, Order> = new Map();
  private trades: Trade[] = [];
  private priceUpdateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeMarketData();
    this.startPriceSimulation();
  }

  private initializeMarketData() {
    Object.entries(baseSymbols).forEach(([symbol, basePrice]) => {
      this.marketData.set(symbol, {
        symbol,
        price: basePrice,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: Math.random() * 1000000000,
        high24h: basePrice * (1 + Math.random() * 0.05),
        low24h: basePrice * (1 - Math.random() * 0.05),
        lastUpdate: new Date(),
      });
    });
  }

  private startPriceSimulation() {
    this.priceUpdateInterval = setInterval(() => {
      this.marketData.forEach((data, symbol) => {
        const volatility = 0.002;
        const change = (Math.random() - 0.5) * volatility;
        const newPrice = data.price * (1 + change);

        this.marketData.set(symbol, {
          ...data,
          price: newPrice,
          high24h: Math.max(data.high24h, newPrice),
          low24h: Math.min(data.low24h, newPrice),
          lastUpdate: new Date(),
        });
      });
    }, 1000);
  }

  getMarketData(symbol: string): MarketData | undefined {
    return this.marketData.get(symbol);
  }

  getAllMarketData(): MarketData[] {
    return Array.from(this.marketData.values());
  }

  createOrder(
    exchange: string,
    symbol: string,
    side: 'buy' | 'sell',
    type: 'market' | 'limit' | 'stop',
    amount: number,
    price?: number
  ): Order {
    const marketData = this.getMarketData(symbol);
    const executionPrice = price || marketData?.price || 0;

    const order: Order = {
      id: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exchange,
      symbol,
      side,
      type,
      price: executionPrice,
      amount,
      filled: 0,
      status: 'pending',
      timestamp: new Date(),
    };

    this.orders.set(order.id, order);

    if (type === 'market') {
      this.executeOrder(order.id);
    }

    return order;
  }

  private executeOrder(orderId: string): Trade | null {
    const order = this.orders.get(orderId);
    if (!order || order.status === 'filled') return null;

    const marketData = this.getMarketData(order.symbol);
    if (!marketData) return null;

    const executionPrice = order.type === 'market' ? marketData.price : order.price;
    const fee = executionPrice * order.amount * 0.001;

    const trade: Trade = {
      id: `TRD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId: order.id,
      exchange: order.exchange,
      symbol: order.symbol,
      side: order.side,
      price: executionPrice,
      amount: order.amount,
      fee,
      timestamp: new Date(),
    };

    order.filled = order.amount;
    order.status = 'filled';
    this.orders.set(order.id, order);
    this.trades.push(trade);

    return trade;
  }

  cancelOrder(orderId: string): boolean {
    const order = this.orders.get(orderId);
    if (!order || order.status === 'filled') return false;

    order.status = 'cancelled';
    this.orders.set(orderId, order);
    return true;
  }

  getOrder(orderId: string): Order | undefined {
    return this.orders.get(orderId);
  }

  getOrders(filter?: { exchange?: string; symbol?: string; status?: string }): Order[] {
    let orders = Array.from(this.orders.values());

    if (filter) {
      if (filter.exchange) {
        orders = orders.filter(o => o.exchange === filter.exchange);
      }
      if (filter.symbol) {
        orders = orders.filter(o => o.symbol === filter.symbol);
      }
      if (filter.status) {
        orders = orders.filter(o => o.status === filter.status);
      }
    }

    return orders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getTrades(filter?: { exchange?: string; symbol?: string }): Trade[] {
    let trades = [...this.trades];

    if (filter) {
      if (filter.exchange) {
        trades = trades.filter(t => t.exchange === filter.exchange);
      }
      if (filter.symbol) {
        trades = trades.filter(t => t.symbol === filter.symbol);
      }
    }

    return trades.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  calculatePnL(
    entryPrice: number,
    currentPrice: number,
    amount: number,
    side: 'buy' | 'sell'
  ): { pnl: number; pnlPercent: number } {
    const priceDiff = side === 'buy' ? currentPrice - entryPrice : entryPrice - currentPrice;
    const pnl = priceDiff * amount;
    const pnlPercent = (priceDiff / entryPrice) * 100;

    return { pnl, pnlPercent };
  }

  destroy() {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = null;
    }
  }
}

export const demoTradingEngine = new DemoTradingEngine();
