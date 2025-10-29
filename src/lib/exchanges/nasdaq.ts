import { Candle, Trade, OrderBookLevel } from '@/types/trading';

export interface NASDAQQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
}

export class NASDAQExchange {
  private baseUrl = 'https://api.nasdaq.com/api';
  private alternativeUrl = 'https://query1.finance.yahoo.com/v8/finance';

  // API Endpoints (using Yahoo Finance as alternative)
  getQuoteUrl(symbol: string): string {
    return `${this.alternativeUrl}/chart/${symbol}?interval=1d&range=1d`;
  }

  getHistoricalUrl(symbol: string, period1: number, period2: number, interval: string = '1d'): string {
    return `${this.alternativeUrl}/chart/${symbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
  }

  getChartUrl(symbol: string, range: string = '1d', interval: string = '1m'): string {
    return `${this.alternativeUrl}/chart/${symbol}?range=${range}&interval=${interval}`;
  }

  // Data Formatters
  formatYahooDataToCandles(data: any): Candle[] {
    const quotes = data.chart?.result?.[0];
    if (!quotes) return [];

    const timestamps = quotes.timestamp || [];
    const ohlc = quotes.indicators?.quote?.[0];
    
    if (!ohlc) return [];

    return timestamps.map((timestamp: number, index: number) => ({
      x: timestamp * 1000,
      y: [
        ohlc.open?.[index] || 0,
        ohlc.high?.[index] || 0,
        ohlc.low?.[index] || 0,
        ohlc.close?.[index] || 0
      ]
    })).filter((candle: Candle) => 
      candle.y.every(v => v > 0)
    );
  }

  formatQuoteResponse(data: any): NASDAQQuote | null {
    const result = data.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const current = result.indicators?.quote?.[0];
    
    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice || 0,
      change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
      changePercent: ((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1) * 100,
      volume: meta.regularMarketVolume || 0,
      marketCap: 0, // Not available in this endpoint
      high: meta.regularMarketDayHigh || 0,
      low: meta.regularMarketDayLow || 0,
      open: meta.regularMarketOpen || 0,
      previousClose: meta.previousClose || 0
    };
  }

  // Symbol Formatters
  formatSymbol(symbol: string): string {
    return symbol.toUpperCase();
  }

  // Timeframe conversion
  convertTimeframe(timeframe: string): { range: string; interval: string } {
    const mapping: Record<string, { range: string; interval: string }> = {
      '1m': { range: '1d', interval: '1m' },
      '5m': { range: '5d', interval: '5m' },
      '15m': { range: '5d', interval: '15m' },
      '1h': { range: '1mo', interval: '1h' },
      '4h': { range: '3mo', interval: '1d' },
      '1d': { range: '1y', interval: '1d' },
      '1w': { range: '5y', interval: '1wk' }
    };
    return mapping[timeframe] || { range: '1d', interval: '1m' };
  }

  // Rate Limiting
  readonly rateLimits = {
    requests: 2000,    // requests per hour
    burst: 50          // requests per minute
  };

  // Popular Stocks
  readonly popularStocks = [
    'AAPL',   // Apple
    'MSFT',   // Microsoft
    'GOOGL',  // Alphabet
    'AMZN',   // Amazon
    'NVDA',   // NVIDIA
    'TSLA',   // Tesla
    'META',   // Meta
    'BRK.B',  // Berkshire Hathaway
    'V',      // Visa
    'JPM',    // JPMorgan Chase
    'JNJ',    // Johnson & Johnson
    'WMT',    // Walmart
    'PG',     // Procter & Gamble
    'MA',     // Mastercard
    'DIS'     // Disney
  ];

  // Market Hours
  readonly marketHours = {
    preMarket: { start: '04:00', end: '09:30' },
    regular: { start: '09:30', end: '16:00' },
    afterHours: { start: '16:00', end: '20:00' }
  };

  isMarketOpen(): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Weekend check
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const hour = now.getHours();
    const minute = now.getMinutes();
    const time = hour * 60 + minute;

    const marketOpen = 9 * 60 + 30;  // 9:30 AM
    const marketClose = 16 * 60;      // 4:00 PM

    return time >= marketOpen && time <= marketClose;
  }

  // Validation
  validateSymbol(symbol: string): boolean {
    const regex = /^[A-Z]{1,5}(\.[A-Z])?$/;
    return regex.test(symbol.toUpperCase());
  }

  // Error Handler
  handleError(error: any): string {
    if (error.response?.data?.message) {
      return `NASDAQ Error: ${error.response.data.message}`;
    }
    if (error.message) {
      return `NASDAQ Error: ${error.message}`;
    }
    return 'NASDAQ: Unknown error occurred';
  }

  // Mock OrderBook (stocks don't have public order books like crypto)
  generateMockOrderBook(currentPrice: number): {
    bids: OrderBookLevel[];
    asks: OrderBookLevel[];
  } {
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    for (let i = 1; i <= 10; i++) {
      bids.push({
        price: currentPrice - (currentPrice * 0.0001 * i),
        volume: Math.random() * 1000 * (11 - i)
      });

      asks.push({
        price: currentPrice + (currentPrice * 0.0001 * i),
        volume: Math.random() * 1000 * (11 - i)
      });
    }

    return { bids, asks };
  }
}

export const nasdaq = new NASDAQExchange();
