import { Candle, Trade, OrderBookLevel } from '@/types/trading';

export interface OKXKline {
  [0]: string;  // Timestamp
  [1]: string;  // Open
  [2]: string;  // High
  [3]: string;  // Low
  [4]: string;  // Close
  [5]: string;  // Volume (base currency)
  [6]: string;  // Volume (quote currency)
  [7]: string;  // Confirm status
}

export interface OKXDepthResponse {
  code: string;
  msg: string;
  data: [{
    asks: [string, string, string, string][];
    bids: [string, string, string, string][];
    ts: string;
  }];
}

export interface OKXTradeResponse {
  arg: {
    channel: string;
    instId: string;
  };
  data: [{
    instId: string;
    tradeId: string;
    px: string;      // Price
    sz: string;      // Size
    side: string;    // Side: buy or sell
    ts: string;      // Timestamp
  }][];
}

export class OKXExchange {
  private baseUrl = 'https://www.okx.com/api/v5';
  private wsBaseUrl = 'wss://ws.okx.com:8443/ws/v5/public';

  // API Endpoints
  getKlinesUrl(instId: string, bar: string = '1m', limit: number = 500): string {
    return `${this.baseUrl}/market/history-candles?instId=${instId.toUpperCase()}&bar=${bar}&limit=${limit}`;
  }

  getDepthUrl(instId: string, sz: number = 100): string {
    return `${this.baseUrl}/market/books?instId=${instId.toUpperCase()}&sz=${sz}`;
  }

  getTickerUrl(instId: string): string {
    return `${this.baseUrl}/market/ticker?instId=${instId.toUpperCase()}`;
  }

  get24hrTickerUrl(instId: string): string {
    return `${this.baseUrl}/market/ticker?instId=${instId.toUpperCase()}`;
  }

  getWebSocketUrl(): string {
    return this.wsBaseUrl;
  }

  // WebSocket subscription messages
  getTradeSubscription(instId: string) {
    return {
      op: 'subscribe',
      args: [{
        channel: 'trades',
        instId: instId.toUpperCase()
      }]
    };
  }

  getDepthSubscription(instId: string) {
    return {
      op: 'subscribe',
      args: [{
        channel: 'books',
        instId: instId.toUpperCase()
      }]
    };
  }

  getKlineSubscription(instId: string, bar: string = '1m') {
    return {
      op: 'subscribe',
      args: [{
        channel: `candle${bar}`,
        instId: instId.toUpperCase()
      }]
    };
  }

  // Data Formatters
  formatKlinesToCandles(klines: OKXKline[]): Candle[] {
    return klines.map(k => ({
      x: parseInt(k[0]),
      y: [
        parseFloat(k[1]), // open
        parseFloat(k[2]), // high
        parseFloat(k[3]), // low
        parseFloat(k[4])  // close
      ]
    }));
  }

  formatDepthResponse(response: OKXDepthResponse): { 
    bids: OrderBookLevel[]; 
    asks: OrderBookLevel[]; 
  } {
    const data = response.data[0];
    return {
      bids: data.bids.map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume)
      })),
      asks: data.asks.map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume)
      }))
    };
  }

  formatTradeMessage(data: any): Trade {
    return {
      price: parseFloat(data.px),
      volume: parseFloat(data.sz),
      timestamp: parseInt(data.ts),
      side: data.side as 'buy' | 'sell'
    };
  }

  // Symbol Formatters
  formatSymbol(base: string, quote: string, instType: string = 'SPOT'): string {
    return `${base.toUpperCase()}-${quote.toUpperCase()}`;
  }

  parseSymbol(instId: string): { base: string; quote: string } {
    const parts = instId.split('-');
    return {
      base: parts[0],
      quote: parts[1] || 'USDT'
    };
  }

  // Timeframe conversion
  convertTimeframe(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1H',
      '4h': '4H',
      '1d': '1D',
      '1w': '1W'
    };
    return mapping[timeframe] || '1m';
  }

  // Rate Limiting
  readonly rateLimits = {
    public: 20,        // requests per 2 seconds
    private: 60,       // requests per 2 seconds
    websocket: 100     // subscriptions per connection
  };

  // Default Trading Pairs
  readonly defaultPairs = [
    'BTC-USDT',
    'ETH-USDT',
    'SOL-USDT',
    'DOT-USDT',
    'XRP-USDT',
    'ADA-USDT',
    'MATIC-USDT',
    'AVAX-USDT',
    'ATOM-USDT',
    'LINK-USDT'
  ];

  // Validation
  validateInstId(instId: string): boolean {
    const regex = /^[A-Z]+-[A-Z]+(-[A-Z0-9]+)?$/;
    return regex.test(instId.toUpperCase());
  }

  // Error Handler
  handleError(error: any): string {
    if (error.response?.data?.msg) {
      return `OKX Error: ${error.response.data.msg}`;
    }
    if (error.data?.msg) {
      return `OKX Error: ${error.data.msg}`;
    }
    if (error.message) {
      return `OKX Error: ${error.message}`;
    }
    return 'OKX: Unknown error occurred';
  }
}

export const okx = new OKXExchange();
