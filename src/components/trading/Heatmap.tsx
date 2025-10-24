import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CryptoData {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

export const Heatmap = () => {
  const [cryptos, setCryptos] = useState<CryptoData[]>([]);

  useEffect(() => {
    // Mock data - real API would go here
    const mockData: CryptoData[] = [
      { symbol: 'BTC', price: 67890, change24h: 3.5, volume24h: 28000000000, marketCap: 1200000000000 },
      { symbol: 'ETH', price: 3456, change24h: 5.2, volume24h: 15000000000, marketCap: 400000000000 },
      { symbol: 'BNB', price: 587, change24h: -1.8, volume24h: 2000000000, marketCap: 85000000000 },
      { symbol: 'SOL', price: 145, change24h: 8.7, volume24h: 3500000000, marketCap: 65000000000 },
      { symbol: 'XRP', price: 0.68, change24h: -2.4, volume24h: 1800000000, marketCap: 38000000000 },
      { symbol: 'ADA', price: 0.58, change24h: 4.1, volume24h: 850000000, marketCap: 20000000000 },
      { symbol: 'DOGE', price: 0.15, change24h: -3.2, volume24h: 950000000, marketCap: 22000000000 },
      { symbol: 'DOT', price: 7.85, change24h: 6.3, volume24h: 680000000, marketCap: 11000000000 },
      { symbol: 'MATIC', price: 0.92, change24h: 2.8, volume24h: 520000000, marketCap: 9000000000 },
      { symbol: 'AVAX', price: 38.5, change24h: -4.5, volume24h: 480000000, marketCap: 15000000000 },
      { symbol: 'LINK', price: 18.2, change24h: 7.9, volume24h: 750000000, marketCap: 11000000000 },
      { symbol: 'UNI', price: 11.4, change24h: -1.2, volume24h: 320000000, marketCap: 6800000000 },
    ];
    setCryptos(mockData);
  }, []);

  const getSize = (marketCap: number) => {
    const max = Math.max(...cryptos.map(c => c.marketCap));
    const min = Math.min(...cryptos.map(c => c.marketCap));
    const normalized = (marketCap - min) / (max - min);
    return 80 + normalized * 180; // 80px to 260px
  };

  const getColor = (change: number) => {
    if (change > 5) return 'from-success/90 to-success/70';
    if (change > 0) return 'from-success/60 to-success/40';
    if (change > -5) return 'from-destructive/60 to-destructive/40';
    return 'from-destructive/90 to-destructive/70';
  };

  const getIntensity = (change: number) => {
    const abs = Math.abs(change);
    if (abs > 7) return 'font-bold text-lg';
    if (abs > 3) return 'font-semibold';
    return 'font-medium';
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Market Heatmap</h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-4 bg-muted/20 rounded-xl">
        {cryptos.map((crypto) => {
          const size = getSize(crypto.marketCap);
          const isPositive = crypto.change24h >= 0;
          
          return (
            <div
              key={crypto.symbol}
              className={`relative overflow-hidden rounded-lg transition-all hover:scale-105 hover:z-10 cursor-pointer bg-gradient-to-br ${getColor(crypto.change24h)} border border-border/50 shadow-lg`}
              style={{ minHeight: `${size}px` }}
            >
              <div className="absolute inset-0 p-3 flex flex-col justify-between">
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-1">
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {crypto.symbol}
                  </div>
                  <div className="text-xs text-foreground/80 mt-1">
                    ${crypto.price.toLocaleString()}
                  </div>
                </div>
                
                <div>
                  <div className={`${getIntensity(crypto.change24h)} ${isPositive ? 'text-success-foreground' : 'text-destructive-foreground'}`}>
                    {isPositive ? '+' : ''}{crypto.change24h.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-foreground/60 mt-1">
                    Vol: ${(crypto.volume24h / 1e9).toFixed(2)}B
                  </div>
                </div>
              </div>
              
              {/* Glow effect */}
              <div className={`absolute inset-0 opacity-0 hover:opacity-20 transition-opacity ${isPositive ? 'bg-success' : 'bg-destructive'}`} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
