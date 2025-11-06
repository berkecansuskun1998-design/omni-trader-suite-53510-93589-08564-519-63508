import { UnifiedExchangeInterface, ExchangeConfig, OrderBookLevel } from '../multiExchange';

export class HuobiMultiTool implements UnifiedExchangeInterface {
  config: ExchangeConfig = {
    name: 'huobi',
    displayName: 'Huobi (HTX)',
    type: 'crypto',
    features: ['spot', 'margin', 'futures', 'swaps', 'otc', 'mining'],
    supportedSymbols: ['btcusdt', 'ethusdt', 'htusdt', 'xrpusdt', 'adausdt'],
    fees: { maker: 0.002, taker: 0.002 },
    limits: { minOrder: 5, maxOrder: 5000000 }
  };

  private baseUrl = 'https://api.huobi.pro';

  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/market/detail/merged?symbol=${symbol.toLowerCase()}`);
      const data = await response.json();
      if (data.status === 'ok' && data.tick) {
        return parseFloat(data.tick.close);
      }
    } catch (error) {
      console.error('Huobi price fetch failed:', error);
    }
    
    const mockPrices: Record<string, number> = {
      'btcusdt': 67890,
      'ethusdt': 3456,
      'htusdt': 4.2,
      'xrpusdt': 0.62,
      'adausdt': 0.58
    };
    return mockPrices[symbol.toLowerCase()] || 100;
  }

  async getOrderBook(symbol: string): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/market/depth?symbol=${symbol.toLowerCase()}&type=step0&depth=20`);
      const data = await response.json();
      if (data.status === 'ok' && data.tick) {
        return {
          bids: data.tick.bids.map(([price, volume]: [number, number]) => ({
            price,
            volume
          })),
          asks: data.tick.asks.map(([price, volume]: [number, number]) => ({
            price,
            volume
          }))
        };
      }
    } catch (error) {
      console.error('Huobi order book fetch failed:', error);
    }
    return { bids: [], asks: [] };
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/market/detail/merged?symbol=${symbol.toLowerCase()}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  formatSymbol(base: string, quote: string): string {
    return `${base.toLowerCase()}${quote.toLowerCase()}`;
  }

  validateSymbol(symbol: string): boolean {
    return /^[a-z]{3,10}$/.test(symbol);
  }
}
