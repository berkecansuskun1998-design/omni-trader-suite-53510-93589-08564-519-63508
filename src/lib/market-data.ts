import { AssetType, Exchange } from '@/types/trading';

export const MARKET_DATA_SOURCES = {
  // Crypto Exchanges
  BINANCE: {
    name: 'Binance',
    assetType: 'crypto' as AssetType,
    restApi: 'https://api.binance.com/api/v3',
    wsBase: 'wss://stream.binance.com:9443/ws',
    ticker24h: (symbol: string) => 
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`,
    klines: (symbol: string, interval = '1m', limit = 500) =>
      `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`,
    wsTicker: (symbol: string) => 
      `wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`,
  },
  
  // Stock Market - Free APIs
  NASDAQ: {
    name: 'NASDAQ',
    assetType: 'stock' as AssetType,
    restApi: 'https://api.polygon.io/v2',
    // Using Yahoo Finance as free alternative
    ticker: (symbol: string) =>
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    historical: (symbol: string) =>
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
  },
  
  NYSE: {
    name: 'NYSE',
    assetType: 'stock' as AssetType,
    restApi: 'https://query1.finance.yahoo.com/v8/finance',
    ticker: (symbol: string) =>
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
    historical: (symbol: string) =>
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
  },
  
  // Forex Market
  FOREX: {
    name: 'Forex',
    assetType: 'forex' as AssetType,
    restApi: 'https://api.exchangerate-api.com/v4',
    latest: (base: string) =>
      `https://api.exchangerate-api.com/v4/latest/${base}`,
    // Alternative: Fixer.io or CurrencyAPI
  },
  
  // Commodities
  CME: {
    name: 'CME (Commodities)',
    assetType: 'commodity' as AssetType,
    // Using free commodity API
    restApi: 'https://www.commodities-api.com/api',
  },
} as const;

export interface MarketDataConfig {
  exchange: Exchange;
  assetType: AssetType;
  symbol: string;
}

export async function fetchMarketPrice(config: MarketDataConfig): Promise<number | null> {
  const { exchange, assetType, symbol } = config;
  
  try {
    switch (assetType) {
      case 'crypto':
        if (exchange === 'BINANCE') {
          const response = await fetch(MARKET_DATA_SOURCES.BINANCE.ticker24h(symbol));
          const data = await response.json();
          return parseFloat(data.lastPrice);
        }
        break;
        
      case 'stock':
        if (exchange === 'NASDAQ' || exchange === 'NYSE') {
          const source = exchange === 'NASDAQ' ? MARKET_DATA_SOURCES.NASDAQ : MARKET_DATA_SOURCES.NYSE;
          const response = await fetch(source.ticker(symbol));
          const data = await response.json();
          const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;
          return quote ? parseFloat(quote) : null;
        }
        break;
        
      case 'forex':
        if (exchange === 'FOREX') {
          const [base, quote] = symbol.split('/');
          const response = await fetch(MARKET_DATA_SOURCES.FOREX.latest(base));
          const data = await response.json();
          return data.rates?.[quote] || null;
        }
        break;
        
      case 'commodity':
        // Commodity prices would need specialized API
        return null;
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Error fetching market price:', error);
    return null;
  }
  
  return null;
}

export const POPULAR_SYMBOLS = {
  crypto: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'BNBUSDT', 'XRPUSDT'],
  stock: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'],
  forex: ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'],
  commodity: ['GOLD', 'SILVER', 'OIL', 'NATURAL_GAS'],
  index: ['SPX', 'NDX', 'DJI', 'FTSE', 'DAX'],
};

export function getDefaultExchange(assetType: AssetType): Exchange {
  switch (assetType) {
    case 'crypto':
      return 'BINANCE';
    case 'stock':
      return 'NASDAQ';
    case 'forex':
      return 'FOREX';
    case 'commodity':
      return 'CME';
    default:
      return 'BINANCE';
  }
}
