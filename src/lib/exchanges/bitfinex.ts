import { UnifiedExchangeInterface, ExchangeConfig, OrderBookLevel } from '../multiExchange';

export class BitfinexMultiTool implements UnifiedExchangeInterface {
  config: ExchangeConfig = {
    name: 'bitfinex',
    displayName: 'Bitfinex',
    type: 'crypto',
    features: ['spot', 'margin', 'derivatives', 'lending', 'otc', 'staking'],
    supportedSymbols: ['tBTCUSD', 'tETHUSD', 'tLEOUSD', 'tXRPUSD', 'tSOLUSD'],
    fees: { maker: 0.001, taker: 0.002 },
    limits: { minOrder: 10, maxOrder: 10000000 }
  };

  private baseUrl = 'https://api-pub.bitfinex.com/v2';

  async getPrice(symbol: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/${symbol}`);
      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 6) {
        return parseFloat(data[6]);
      }
    } catch (error) {
      console.error('Bitfinex price fetch failed:', error);
    }
    
    const mockPrices: Record<string, number> = {
      'tBTCUSD': 67890,
      'tETHUSD': 3456,
      'tLEOUSD': 5.8,
      'tXRPUSD': 0.62,
      'tSOLUSD': 145
    };
    return mockPrices[symbol] || 100;
  }

  async getOrderBook(symbol: string): Promise<{ bids: OrderBookLevel[]; asks: OrderBookLevel[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/book/${symbol}/P0?len=25`);
      const data = await response.json();
      if (data && Array.isArray(data)) {
        const bids: OrderBookLevel[] = [];
        const asks: OrderBookLevel[] = [];
        
        data.forEach((item: any[]) => {
          if (item[2] > 0) {
            bids.push({ price: item[0], volume: item[2] });
          } else {
            asks.push({ price: item[0], volume: Math.abs(item[2]) });
          }
        });
        
        return { bids, asks };
      }
    } catch (error) {
      console.error('Bitfinex order book fetch failed:', error);
    }
    return { bids: [], asks: [] };
  }

  async getTicker(symbol: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/ticker/${symbol}`);
      return await response.json();
    } catch {
      return null;
    }
  }

  formatSymbol(base: string, quote: string): string {
    return `t${base.toUpperCase()}${quote.toUpperCase()}`;
  }

  validateSymbol(symbol: string): boolean {
    return /^t[A-Z]{3,10}$/.test(symbol);
  }
}
