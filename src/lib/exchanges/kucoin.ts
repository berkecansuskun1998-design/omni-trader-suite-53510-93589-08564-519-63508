import { Candle, Trade, OrderBookLevel } from '@/types/trading';

export interface KuCoinKline {
  [0]: string;  // Start time
  [1]: string;  // Open
  [2]: string;  // Close
  [3]: string;  // High
  [4]: string;  // Low
  [5]: string;  // Volume
  [6]: string;  // Amount
}

export interface KuCoinDepthResponse {
  code: string;
  data: {
    time: number;
    sequence: string;
    bids: [string, string][];
    asks: [string, string][];
  };
}

export interface KuCoinWSToken {
  code: string;
  data: {
    token: string;
    instanceServers: [{
      endpoint: string;
      encrypt: boolean;
      protocol: string;
      pingInterval: number;
      pingTimeout: number;
    }][];
  };
}

export class KuCoinExchange {
  private baseUrl = 'https://api.kucoin.com/api/v1';
  private wsToken: string | null = null;
  private wsEndpoint: string | null = null;

  // API Endpoints
  getKlinesUrl(symbol: string, type: string = '1min', startAt?: number, endAt?: number): string {
    let url = `${this.baseUrl}/market/candles?symbol=${symbol.toUpperCase()}&type=${type}`;
    if (startAt) url += `&startAt=${startAt}`;
    if (endAt) url += `&endAt=${endAt}`;
    return url;
  }

  getDepthUrl(symbol: string): string {
    return `${this.baseUrl}/market/orderbook/level2_20?symbol=${symbol.toUpperCase()}`;
  }

  getFullDepthUrl(symbol: string): string {
    return `${this.baseUrl}/market/orderbook/level2_100?symbol=${symbol.toUpperCase()}`;
  }

  getTickerUrl(symbol: string): string {
    return `${this.baseUrl}/market/orderbook/level1?symbol=${symbol.toUpperCase()}`;
  }

  get24hrTickerUrl(symbol: string): string {
    return `${this.baseUrl}/market/stats?symbol=${symbol.toUpperCase()}`;
  }

  async getWebSocketToken(): Promise<KuCoinWSToken> {
    const response = await fetch(`${this.baseUrl}/bullet-public`);
    return response.json();
  }

  async getWebSocketUrl(): Promise<string> {
    if (this.wsEndpoint && this.wsToken) {
      return `${this.wsEndpoint}?token=${this.wsToken}`;
    }

    const tokenData = await this.getWebSocketToken();
    this.wsToken = tokenData.data.token;
    this.wsEndpoint = tokenData.data.instanceServers[0][0].endpoint;
    
    return `${this.wsEndpoint}?token=${this.wsToken}`;
  }

  // WebSocket subscription messages
  getTradeSubscription(symbol: string, id: number = 1) {
    return {
      id: id,
      type: 'subscribe',
      topic: `/market/match:${symbol.toUpperCase()}`,
      privateChannel: false,
      response: true
    };
  }

  getDepthSubscription(symbol: string, id: number = 2) {
    return {
      id: id,
      type: 'subscribe',
      topic: `/market/level2:${symbol.toUpperCase()}`,
      response: true
    };
  }

  getKlineSubscription(symbol: string, type: string = '1min', id: number = 3) {
    return {
      id: id,
      type: 'subscribe',
      topic: `/market/candles:${symbol.toUpperCase()}_${type}`,
      response: true
    };
  }

  // Data Formatters
  formatKlinesToCandles(klines: KuCoinKline[]): Candle[] {
    return klines.map(k => {
      const timestamp = parseInt(k[0]);
      return {
        x: timestamp > 1e12 ? timestamp : timestamp * 1000,
        y: [
          parseFloat(k[1]), // open
          parseFloat(k[3]), // high
          parseFloat(k[4]), // low
          parseFloat(k[2])  // close
        ]
      };
    });
  }

  formatDepthResponse(response: KuCoinDepthResponse): { 
    bids: OrderBookLevel[]; 
    asks: OrderBookLevel[]; 
  } {
    return {
      bids: response.data.bids.map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume)
      })),
      asks: response.data.asks.map(([price, volume]) => ({
        price: parseFloat(price),
        volume: parseFloat(volume)
      }))
    };
  }

  formatTradeMessage(data: any): Trade {
    return {
      price: parseFloat(data.price),
      volume: parseFloat(data.size),
      timestamp: parseInt(data.time),
      side: data.side as 'buy' | 'sell'
    };
  }

  // Symbol Formatters
  formatSymbol(base: string, quote: string): string {
    return `${base.toUpperCase()}-${quote.toUpperCase()}`;
  }

  parseSymbol(symbol: string): { base: string; quote: string } {
    const parts = symbol.split('-');
    return {
      base: parts[0],
      quote: parts[1] || 'USDT'
    };
  }

  // Timeframe conversion
  convertTimeframe(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '1h': '1hour',
      '4h': '4hour',
      '1d': '1day',
      '1w': '1week'
    };
    return mapping[timeframe] || '1min';
  }

  // Rate Limiting
  readonly rateLimits = {
    public: 100,       // requests per 10 seconds
    private: 200,      // requests per 10 seconds
    websocket: 300     // subscriptions per connection
  };

  // Default Trading Pairs
  readonly defaultPairs = [
    'BTC-USDT',
    'ETH-USDT',
    'SOL-USDT',
    'XRP-USDT',
    'ADA-USDT',
    'DOT-USDT',
    'MATIC-USDT',
    'AVAX-USDT',
    'ATOM-USDT',
    'LINK-USDT'
  ];

  // Validation
  validateSymbol(symbol: string): boolean {
    const regex = /^[A-Z]+-[A-Z]+$/;
    return regex.test(symbol.toUpperCase());
  }

  // Error Handler
  handleError(error: any): string {
    if (error.response?.data?.msg) {
      return `KuCoin Error: ${error.response.data.msg}`;
    }
    if (error.data?.msg) {
      return `KuCoin Error: ${error.data.msg}`;
    }
    if (error.message) {
      return `KuCoin Error: ${error.message}`;
    }
    return 'KuCoin: Unknown error occurred';
  }
}

export const kucoin = new KuCoinExchange();
