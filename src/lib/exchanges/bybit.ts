import { UnifiedExchangeInterface, ExchangeConfig, OrderBookLevel } from '../multiExchange';

export class BybitMultiTool implements UnifiedExchangeInterface {
  config: ExchangeConfig = {
    name: 'bybit',
    displayName: 'Bybit',
    type: 'crypto',
    features: ['spot', 'perpetual', 'inverse', 'options', 'copy-trading'],
    supportedSymbols: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOTUSDT'],
    fees: { maker: 0.001, taker: 0.0006 },
    limits: { minOrder: 10, maxOrder: 10000000 }
  };

  private baseUrl = 'https://api.bybit.com/v5';

  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/market/tickers?category=spot&symbol=${symbol}`);
      const data = await response.json();
      if (data.result && data.result.list && data.result.list.length > 0) {
        return parseFloat(data.result.list[0].lastPrice);
      }
    } catch (error) {
      console.error('Bybit price fetch failed:', error);
    }
    
    const mockPrices: Record<string, number> = {
      'BTCUSDT': 67890,
      'ETHUSDT': 3456,
      'SOLUSDT': 145,
      'XRPUSDT': 0.62,
      'DOTUSDT': 7.2
    };
    return mockPrices[symbol] || 100;
  }

  async getOrderBook(symbol: string): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/market/orderbook?category=spot&symbol=${symbol}&limit=20`);
      const data = await response.json();
      if (data.result) {
        return {
          bids: data.result.b.map(([price, volume]: [string, string]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
          })),
          asks: data.result.a.map(([price, volume]: [string, string]) => ({
            price: parseFloat(price),
            volume: parseFloat(volume)
          }))
        };
      }
    } catch (error) {
      console.error('Bybit order book fetch failed:', error);
    }
    return { bids: [], asks: [] };
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/tickers?category=spot&symbol=${symbol}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  formatSymbol(base: string, quote: string): string {
    return `${base.toUpperCase()}${quote.toUpperCase()}`;
  }

  validateSymbol(symbol: string): boolean {
    return /^[A-Z]{3,10}$/.test(symbol);
  }
}
