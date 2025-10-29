import { Candle, Trade, OrderBookLevel } from '@/types/trading';

export interface BinanceKline {
  [0]: number;  // Open time
  [1]: string;  // Open
  [2]: string;  // High
  [3]: string;  // Low
  [4]: string;  // Close
  [5]: string;  // Volume
  [6]: number;  // Close time
  [7]: string;  // Quote asset volume
  [8]: number;  // Number of trades
  [9]: string;  // Taker buy base asset volume
  [10]: string; // Taker buy quote asset volume
  [11]: string; // Ignore
}

export interface BinanceDepthResponse {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

export interface BinanceTradeMessage {
  e: string;      // Event type
  E: number;      // Event time
  s: string;      // Symbol
  t: number;      // Trade ID
  p: string;      // Price
  q: string;      // Quantity
  b: number;      // Buyer order ID
  a: number;      // Seller order ID
  T: number;      // Trade time
  m: boolean;     // Is buyer the market maker
  M: boolean;     // Ignore
}

export class BinanceExchange {
  private baseUrl = 'https://api.binance.com/api/v3';
  private wsBaseUrl = 'wss://stream.binance.com:9443/ws';

  // API Endpoints
  getKlinesUrl(symbol: string, interval: string, limit: number = 500): string {
    return `${this.baseUrl}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  }

  getDepthUrl(symbol: string, limit: number = 100): string {
    return `${this.baseUrl}/depth?symbol=${symbol.toUpperCase()}&limit=${limit}`;
  }

  getTickerUrl(symbol: string): string {
    return `${this.baseUrl}/ticker/price?symbol=${symbol.toUpperCase()}`;
  }

  get24hrTickerUrl(symbol: string): string {
    return `${this.baseUrl}/ticker/24hr?symbol=${symbol.toUpperCase()}`;
  }

  getTradeWebSocketUrl(symbol: string): string {
    return `${this.wsBaseUrl}/${symbol.toLowerCase()}@trade`;
  }

  getDepthWebSocketUrl(symbol: string): string {
    return `${this.wsBaseUrl}/${symbol.toLowerCase()}@depth`;
  }

  getKlineWebSocketUrl(symbol: string, interval: string): string {
    return `${this.wsBaseUrl}/${symbol.toLowerCase()}@kline_${interval}`;
  }

  // Data Formatters
  formatKlinesToCandles(klines: BinanceKline[]): Candle[] {
    return klines.map(k => ({
      x: k[0],
      y: [
        parseFloat(k[1]), // open
        parseFloat(k[2]), // high
        parseFloat(k[3]), // low
        parseFloat(k[4])  // close
      ]
    }));
  }

  formatDepthResponse(data: BinanceDepthResponse): { 
    bids: OrderBookLevel[]; 
    asks: OrderBookLevel[]; 
  } {
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

  formatTradeMessage(msg: BinanceTradeMessage): Trade {
    return {
      price: parseFloat(msg.p),
      volume: parseFloat(msg.q),
      timestamp: msg.T,
      side: msg.m ? 'sell' : 'buy'
    };
  }

  // Timeframe conversion
  convertTimeframe(timeframe: string): string {
    const mapping: Record<string, string> = {
      '1m': '1m',
      '5m': '5m',
      '15m': '15m',
      '1h': '1h',
      '4h': '4h',
      '1d': '1d',
      '1w': '1w'
    };
    return mapping[timeframe] || '1m';
  }

  // Symbol Formatters
  formatSymbol(base: string, quote: string): string {
    return `${base.toUpperCase()}${quote.toUpperCase()}`;
  }

  parseSymbol(symbol: string): { base: string; quote: string } {
    // For Binance, common quote assets
    const quoteAssets = ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH', 'BNB'];
    
    for (const quote of quoteAssets) {
      if (symbol.endsWith(quote)) {
        return {
          base: symbol.slice(0, -quote.length),
          quote: quote
        };
      }
    }
    
    // Default fallback
    return {
      base: symbol.slice(0, -4),
      quote: symbol.slice(-4)
    };
  }

  // Rate Limiting
  readonly rateLimits = {
    weight: 1200,      // requests per minute
    orders: 10,        // orders per second
    rawRequests: 6100  // raw requests per 5 minutes
  };

  // Default Trading Pairs
  readonly defaultPairs = [
    'BTCUSDT',
    'ETHUSDT',
    'BNBUSDT',
    'SOLUSDT',
    'ADAUSDT',
    'XRPUSDT',
    'DOGEUSDT',
    'DOTUSDT',
    'MATICUSDT',
    'AVAXUSDT'
  ];

  // Validation
  validateSymbol(symbol: string): boolean {
    const regex = /^[A-Z]{3,10}$/;
    return regex.test(symbol.toUpperCase());
  }

  // Error Handler
  handleError(error: any): string {
    if (error.response?.data?.msg) {
      return `Binance Error: ${error.response.data.msg}`;
    }
    if (error.message) {
      return `Binance Error: ${error.message}`;
    }
    return 'Binance: Unknown error occurred';
  }
}

export const binance = new BinanceExchange();
