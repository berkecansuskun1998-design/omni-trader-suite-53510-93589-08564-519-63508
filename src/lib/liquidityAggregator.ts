import { multiExchangeManager } from './multiExchange';

export interface LiquiditySource {
  exchange: string;
  symbol: string;
  bidPrice: number;
  askPrice: number;
  bidVolume: number;
  askVolume: number;
  spread: number;
  lastUpdated: Date;
}

export interface AggregatedLiquidity {
  symbol: string;
  bestBid: number;
  bestAsk: number;
  bestBidExchange: string;
  bestAskExchange: string;
  totalBidVolume: number;
  totalAskVolume: number;
  weightedAverageBid: number;
  weightedAverageAsk: number;
  sources: LiquiditySource[];
  timestamp: Date;
}

export interface SmartOrderRoute {
  totalAmount: number;
  totalCost: number;
  averagePrice: number;
  routes: Array<{
    exchange: string;
    amount: number;
    price: number;
    cost: number;
    percentage: number;
  }>;
  estimatedSavings: number;
  executionTime: number;
}

export class LiquidityAggregator {
  private liquidityCache: Map<string, AggregatedLiquidity> = new Map();
  private cacheExpiryMs: number = 5000;
  private supportedExchanges = [
    'binance',
    'okx',
    'kucoin',
    'coinbase',
    'kraken',
    'bybit',
    'gateio',
    'huobi',
    'bitfinex'
  ];

  async getAggregatedLiquidity(symbol: string): Promise<AggregatedLiquidity> {
    const cached = this.liquidityCache.get(symbol);
    if (cached && Date.now() - cached.timestamp.getTime() < this.cacheExpiryMs) {
      return cached;
    }

    const sources: LiquiditySource[] = [];

    await Promise.allSettled(
      this.supportedExchanges.map(async (exchange) => {
        try {
          const orderBook = await multiExchangeManager.getOrderBook(exchange, symbol);
          
          if (orderBook.bids.length > 0 && orderBook.asks.length > 0) {
            const bestBid = orderBook.bids[0];
            const bestAsk = orderBook.asks[0];
            
            sources.push({
              exchange,
              symbol,
              bidPrice: bestBid.price,
              askPrice: bestAsk.price,
              bidVolume: bestBid.volume,
              askVolume: bestAsk.volume,
              spread: ((bestAsk.price - bestBid.price) / bestBid.price) * 100,
              lastUpdated: new Date()
            });
          }
        } catch (error) {
          console.error(`Failed to fetch liquidity from ${exchange}:`, error);
        }
      })
    );

    if (sources.length === 0) {
      throw new Error(`No liquidity sources available for ${symbol}`);
    }

    sources.sort((a, b) => b.bidPrice - a.bidPrice);
    const bestBid = sources[0].bidPrice;
    const bestBidExchange = sources[0].exchange;

    sources.sort((a, b) => a.askPrice - b.askPrice);
    const bestAsk = sources[0].askPrice;
    const bestAskExchange = sources[0].exchange;

    const totalBidVolume = sources.reduce((sum, s) => sum + s.bidVolume, 0);
    const totalAskVolume = sources.reduce((sum, s) => sum + s.askVolume, 0);

    const weightedBidSum = sources.reduce((sum, s) => sum + (s.bidPrice * s.bidVolume), 0);
    const weightedAskSum = sources.reduce((sum, s) => sum + (s.askPrice * s.askVolume), 0);

    const aggregated: AggregatedLiquidity = {
      symbol,
      bestBid,
      bestAsk,
      bestBidExchange,
      bestAskExchange,
      totalBidVolume,
      totalAskVolume,
      weightedAverageBid: weightedBidSum / totalBidVolume,
      weightedAverageAsk: weightedAskSum / totalAskVolume,
      sources,
      timestamp: new Date()
    };

    this.liquidityCache.set(symbol, aggregated);

    return aggregated;
  }

  async calculateSmartOrderRoute(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number
  ): Promise<SmartOrderRoute> {
    const startTime = Date.now();
    const liquidity = await this.getAggregatedLiquidity(symbol);

    const sources = side === 'buy'
      ? liquidity.sources.sort((a, b) => a.askPrice - b.askPrice)
      : liquidity.sources.sort((a, b) => b.bidPrice - a.bidPrice);

    const routes: SmartOrderRoute['routes'] = [];
    let remainingAmount = amount;
    let totalCost = 0;

    for (const source of sources) {
      if (remainingAmount <= 0) break;

      const availableVolume = side === 'buy' ? source.askVolume : source.bidVolume;
      const price = side === 'buy' ? source.askPrice : source.bidPrice;
      
      const tradeAmount = Math.min(remainingAmount, availableVolume);
      const cost = tradeAmount * price;

      routes.push({
        exchange: source.exchange,
        amount: tradeAmount,
        price,
        cost,
        percentage: 0
      });

      totalCost += cost;
      remainingAmount -= tradeAmount;
    }

    const totalTraded = amount - remainingAmount;
    routes.forEach(route => {
      route.percentage = (route.amount / totalTraded) * 100;
    });

    const averagePrice = totalCost / totalTraded;

    const worstPrice = side === 'buy' 
      ? Math.max(...sources.map(s => s.askPrice))
      : Math.min(...sources.map(s => s.bidPrice));
    
    const worstCaseCost = totalTraded * worstPrice;
    const estimatedSavings = Math.abs(worstCaseCost - totalCost);

    return {
      totalAmount: totalTraded,
      totalCost,
      averagePrice,
      routes,
      estimatedSavings,
      executionTime: Date.now() - startTime
    };
  }

  async findArbitrageOpportunities(symbol: string): Promise<Array<{
    buyExchange: string;
    sellExchange: string;
    buyPrice: number;
    sellPrice: number;
    spread: number;
    spreadPercent: number;
    maxVolume: number;
    potentialProfit: number;
  }>> {
    const liquidity = await this.getAggregatedLiquidity(symbol);
    const opportunities: Array<any> = [];

    for (let i = 0; i < liquidity.sources.length; i++) {
      for (let j = i + 1; j < liquidity.sources.length; j++) {
        const source1 = liquidity.sources[i];
        const source2 = liquidity.sources[j];

        if (source1.askPrice < source2.bidPrice) {
          const spread = source2.bidPrice - source1.askPrice;
          const spreadPercent = (spread / source1.askPrice) * 100;
          const maxVolume = Math.min(source1.askVolume, source2.bidVolume);
          
          const estimatedFees = (source1.askPrice + source2.bidPrice) * 0.002;
          const netProfit = spread - estimatedFees;

          if (netProfit > 0 && spreadPercent > 0.5) {
            opportunities.push({
              buyExchange: source1.exchange,
              sellExchange: source2.exchange,
              buyPrice: source1.askPrice,
              sellPrice: source2.bidPrice,
              spread,
              spreadPercent,
              maxVolume,
              potentialProfit: netProfit * maxVolume
            });
          }
        }

        if (source2.askPrice < source1.bidPrice) {
          const spread = source1.bidPrice - source2.askPrice;
          const spreadPercent = (spread / source2.askPrice) * 100;
          const maxVolume = Math.min(source2.askVolume, source1.bidVolume);
          
          const estimatedFees = (source2.askPrice + source1.bidPrice) * 0.002;
          const netProfit = spread - estimatedFees;

          if (netProfit > 0 && spreadPercent > 0.5) {
            opportunities.push({
              buyExchange: source2.exchange,
              sellExchange: source1.exchange,
              buyPrice: source2.askPrice,
              sellPrice: source1.bidPrice,
              spread,
              spreadPercent,
              maxVolume,
              potentialProfit: netProfit * maxVolume
            });
          }
        }
      }
    }

    return opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
  }

  async compareExchangePrices(symbol: string): Promise<Array<{
    exchange: string;
    bidPrice: number;
    askPrice: number;
    midPrice: number;
    spread: number;
    volume: number;
    rank: number;
  }>> {
    const liquidity = await this.getAggregatedLiquidity(symbol);

    const comparison = liquidity.sources.map(source => ({
      exchange: source.exchange,
      bidPrice: source.bidPrice,
      askPrice: source.askPrice,
      midPrice: (source.bidPrice + source.askPrice) / 2,
      spread: source.spread,
      volume: source.bidVolume + source.askVolume,
      rank: 0
    }));

    comparison.sort((a, b) => a.spread - b.spread);
    comparison.forEach((item, index) => {
      item.rank = index + 1;
    });

    return comparison;
  }

  getVolumeWeightedPrice(sources: LiquiditySource[], side: 'buy' | 'sell'): number {
    const totalVolume = sources.reduce((sum, s) => 
      sum + (side === 'buy' ? s.askVolume : s.bidVolume), 0
    );

    const weightedSum = sources.reduce((sum, s) => {
      const price = side === 'buy' ? s.askPrice : s.bidPrice;
      const volume = side === 'buy' ? s.askVolume : s.bidVolume;
      return sum + (price * volume);
    }, 0);

    return weightedSum / totalVolume;
  }

  async estimateSlippage(
    symbol: string,
    side: 'buy' | 'sell',
    amount: number
  ): Promise<{
    expectedPrice: number;
    worstPrice: number;
    slippage: number;
    slippagePercent: number;
  }> {
    const route = await this.calculateSmartOrderRoute(symbol, side, amount);
    const liquidity = await this.getAggregatedLiquidity(symbol);

    const expectedPrice = side === 'buy' ? liquidity.bestAsk : liquidity.bestBid;
    const worstPrice = route.averagePrice;
    const slippage = Math.abs(worstPrice - expectedPrice);
    const slippagePercent = (slippage / expectedPrice) * 100;

    return {
      expectedPrice,
      worstPrice,
      slippage,
      slippagePercent
    };
  }

  async getMarketDepth(symbol: string): Promise<{
    bids: Array<{ price: number; volume: number; exchanges: string[] }>;
    asks: Array<{ price: number; volume: number; exchanges: string[] }>;
    totalBidVolume: number;
    totalAskVolume: number;
  }> {
    const liquidity = await this.getAggregatedLiquidity(symbol);

    const bidMap = new Map<number, { volume: number; exchanges: string[] }>();
    const askMap = new Map<number, { volume: number; exchanges: string[] }>();

    for (const source of liquidity.sources) {
      if (!bidMap.has(source.bidPrice)) {
        bidMap.set(source.bidPrice, { volume: 0, exchanges: [] });
      }
      const bidEntry = bidMap.get(source.bidPrice)!;
      bidEntry.volume += source.bidVolume;
      bidEntry.exchanges.push(source.exchange);

      if (!askMap.has(source.askPrice)) {
        askMap.set(source.askPrice, { volume: 0, exchanges: [] });
      }
      const askEntry = askMap.get(source.askPrice)!;
      askEntry.volume += source.askVolume;
      askEntry.exchanges.push(source.exchange);
    }

    const bids = Array.from(bidMap.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => b.price - a.price);

    const asks = Array.from(askMap.entries())
      .map(([price, data]) => ({ price, ...data }))
      .sort((a, b) => a.price - b.price);

    return {
      bids,
      asks,
      totalBidVolume: bids.reduce((sum, b) => sum + b.volume, 0),
      totalAskVolume: asks.reduce((sum, a) => sum + a.volume, 0)
    };
  }

  clearCache(): void {
    this.liquidityCache.clear();
  }

  getCacheSize(): number {
    return this.liquidityCache.size;
  }
}

export const liquidityAggregator = new LiquidityAggregator();
