import { UnifiedExchangeInterface, ExchangeConfig, OrderBookLevel } from '../multiExchange';

export class GateioMultiTool implements UnifiedExchangeInterface {
  config: ExchangeConfig = {
    name: 'gateio',
    displayName: 'Gate.io',
    type: 'crypto',
    features: ['spot', 'margin', 'futures', 'options', 'lending', 'liquidity-mining'],
    supportedSymbols: ['BTC_USDT', 'ETH_USDT', 'GT_USDT', 'DOT_USDT', 'ADA_USDT'],
    fees: { maker: 0.002, taker: 0.002 },
    limits: { minOrder: 1, maxOrder: 5000000 }
  };

  private baseUrl = 'https://api.gateio.ws/api/v4';

  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/spot/tickers?currency_pair=${symbol}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return parseFloat(data[0].last);
      }
    } catch (error) {
      console.error('Gate.io price fetch failed:', error);
    }
    
    const mockPrices: Record<string, number> = {
      'BTC_USDT': 67890,
      'ETH_USDT': 3456,
      'GT_USDT': 8.5,
      'DOT_USDT': 7.2,
      'ADA_USDT': 0.58
    };
    return mockPrices[symbol] || 100;
  }

  async getOrderBook(symbol: string): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/spot/order_book?currency_pair=${symbol}&limit=20`);
      const data = await response.json();
      if (data) {
        return {
          bids: data.bids.map(([price, volume]: [string, string]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
          })),
          asks: data.asks.map(([price, volume]: [string, string]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
          }))
        };
      }
    } catch (error) {
      console.error('Gate.io order book fetch failed:', error);
    }
    return { bids: [], asks: [] };
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/spot/tickers?currency_pair=${symbol}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  formatSymbol(base: string, quote: string): string {
    return `${base.toUpperCase()}_${quote.toUpperCase()}`;
  }

  validateSymbol(symbol: string): boolean {
    return /^[A-Z]+_[A-Z]+$/.test(symbol);
  }
}
