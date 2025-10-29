import { Candle, Trade, OrderBookLevel } from '@/types/trading';

export interface CoinbaseKline {
  [0]: number;  // Timestamp
  [1]: number;  // Low
  [2]: number;  // High
  [3]: number;  // Open
  [4]: number;  // Close
  [5]: number;  // Volume
}

export interface CoinbaseDepthResponse {
  bids: [string, string, number][];
  asks: [string, string, number][];
  sequence: number;
  auction_mode: boolean;
  auction: string | null;
}

export interface CoinbaseWSMessage {
  type: string;
  product_id: string;
  time: string;
  sequence: number;
  trade_id?: number;
  maker_order_id?: string;
  taker_order_id?: string;
  price?: string;
  size?: string;
  side?: string;
}

export class CoinbaseExchange {
  private baseUrl = 'https://api.exchange.coinbase.com';
  private wsUrl = 'wss://ws-feed.exchange.coinbase.com';
  private advancedTradeUrl = 'https://api.coinbase.com/api/v3/brokerage';
  private advancedWsUrl = 'wss://advanced-trade-ws.coinbase.com';

  // API Endpoints
  getKlinesUrl(productId: string, granularity: number = 60, start?: string, end?: string): string {
    let url = `${this.baseUrl}/products/${productId}/candles?granularity=${granularity}`;
    if (start) url += `&start=${start}`;
    if (end) url += `&end=${end}`;
    return url;
  }

  getDepthUrl(productId: string, level: number = 2): string {
    return `${this.baseUrl}/products/${productId}/book?level=${level}`;
  }

  getTickerUrl(productId: string): string {
    return `${this.baseUrl}/products/${productId}/ticker`;
  }

  get24hrStatsUrl(productId: string): string {
    return `${this.baseUrl}/products/${productId}/stats`;
  }

  getWebSocketUrl(): string {
    return this.wsUrl;
  }

  getAdvancedWebSocketUrl(): string {
    return this.advancedWsUrl;
  }

  // WebSocket subscription messages
  getTradeSubscription(productIds: string[]) {
    return {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['matches']
    };
  }

  getDepthSubscription(productIds: string[]) {
    return {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['level2']
    };
  }

  getTickerSubscription(productIds: string[]) {
    return {
      type: 'subscribe',
      product_ids: productIds,
      channels: ['ticker']
    };
  }

  // Data Formatters
  formatKlinesToCandles(klines: CoinbaseKline[]): Candle[] {
    return klines.map(k => ({
      x: k[0] * 1000, // Convert to milliseconds
      y: [
        k[3],  // open
        k[2],  // high
        k[1],  // low
        k[4]   // close
      ]
    }));
  }

  formatDepthResponse(response: CoinbaseDepthResponse): { 
    bids: OrderBookLevel[]; 
    asks: OrderBookLevel[]; 
  } {
    return {
      bids: response.bids.map(([price, size]) => ({
        price: parseFloat(price),
        volume: parseFloat(size)
      })),
      asks: response.asks.map(([price, size]) => ({
        price: parseFloat(price),
        volume: parseFloat(size)
      }))
    };
  }

  formatTradeMessage(msg: CoinbaseWSMessage): Trade | null {
    if (msg.type !== 'match' && msg.type !== 'last_match') {
      return null;
    }

    return {
      price: parseFloat(msg.price || '0'),
      volume: parseFloat(msg.size || '0'),
      timestamp: new Date(msg.time).getTime(),
      side: msg.side as 'buy' | 'sell'
    };
  }

  // Symbol Formatters
  formatSymbol(base: string, quote: string = 'USD'): string {
    return `${base.toUpperCase()}-${quote.toUpperCase()}`;
  }

  parseSymbol(productId: string): { base: string; quote: string } {
    const parts = productId.split('-');
    return {
      base: parts[0],
      quote: parts[1] || 'USD'
    };
  }

  // Convert USDT symbols to USD for Coinbase
  normalizeSymbol(symbol: string): string {
    return symbol.replace('USDT', 'USD').replace('USDC', 'USD');
  }

  // Timeframe conversion
  convertTimeframe(timeframe: string): number {
    const mapping: Record<string, number> = {
      '1m': 60,
      '5m': 300,
      '15m': 900,
      '1h': 3600,
      '4h': 14400,
      '1d': 86400,
      '1w': 604800
    };
    return mapping[timeframe] || 60;
  }

  // Rate Limiting
  readonly rateLimits = {
    public: 10,        // requests per second
    private: 15,       // requests per second
    websocket: 750     // messages per connection
  };

  // Default Trading Pairs
  readonly defaultPairs = [
    'BTC-USD',
    'ETH-USD',
    'SOL-USD',
    'DOGE-USD',
    'ADA-USD',
    'DOT-USD',
    'MATIC-USD',
    'AVAX-USD',
    'ATOM-USD',
    'LINK-USD'
  ];

  // Validation
  validateProductId(productId: string): boolean {
    const regex = /^[A-Z]+-[A-Z]+$/;
    return regex.test(productId.toUpperCase());
  }

  // Error Handler
  handleError(error: any): string {
    if (error.response?.data?.message) {
      return `Coinbase Error: ${error.response.data.message}`;
    }
    if (error.data?.message) {
      return `Coinbase Error: ${error.data.message}`;
    }
    if (error.message) {
      return `Coinbase Error: ${error.message}`;
    }
    return 'Coinbase: Unknown error occurred';
  }
}

export const coinbase = new CoinbaseExchange();
