import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3, Zap } from 'lucide-react';
import { Candle } from '@/types/trading';

interface PerformanceMetricsProps {
  candles: Candle[];
  currentPrice: number | null;
  symbol: string;
}

export function PerformanceMetrics({ candles, currentPrice, symbol }: PerformanceMetricsProps) {
  if (candles.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glass-panel animate-pulse rounded-xl p-4"
          >
            <div className="h-4 w-20 rounded bg-muted/20" />
            <div className="mt-2 h-6 w-16 rounded bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  const last24h = candles.slice(-1440); // Assuming 1-min candles
  const high24h = Math.max(...last24h.map((c) => c.y[1]));
  const low24h = Math.min(...last24h.map((c) => c.y[2]));
  const open24h = last24h[0]?.y[0] || currentPrice || 0;
  const close24h = currentPrice || last24h[last24h.length - 1]?.y[3] || 0;
  
  const change24h = close24h - open24h;
  const changePercent = (change24h / open24h) * 100;
  
  const volumes = last24h.map((c) => (c.y[1] - c.y[2]) * 1000); // Mock volume
  const totalVolume = volumes.reduce((a, b) => a + b, 0);
  
  const volatility = ((high24h - low24h) / low24h) * 100;

  const metrics = [
    {
      label: '24h Change',
      value: `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`,
      subValue: `${change24h >= 0 ? '+' : ''}$${Math.abs(change24h).toFixed(2)}`,
      icon: changePercent >= 0 ? TrendingUp : TrendingDown,
      color: changePercent >= 0 ? 'text-success' : 'text-destructive',
      bgColor: changePercent >= 0 ? 'bg-success/10' : 'bg-destructive/10',
    },
    {
      label: '24h High',
      value: `$${high24h.toFixed(2)}`,
      subValue: `+${((high24h - close24h) / close24h * 100).toFixed(2)}%`,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: '24h Low',
      value: `$${low24h.toFixed(2)}`,
      subValue: `${((low24h - close24h) / close24h * 100).toFixed(2)}%`,
      icon: TrendingDown,
      color: 'text-chart-4',
      bgColor: 'bg-chart-4/10',
    },
    {
      label: '24h Volume',
      value: `${(totalVolume / 1e6).toFixed(2)}M`,
      subValue: `${symbol.toUpperCase()}`,
      icon: BarChart3,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10',
    },
    {
      label: 'Volatility',
      value: `${volatility.toFixed(2)}%`,
      subValue: 'Price range',
      icon: Zap,
      color: 'text-chart-5',
      bgColor: 'bg-chart-5/10',
    },
    {
      label: 'Market Cap',
      value: '—',
      subValue: 'N/A',
      icon: DollarSign,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted/10',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/35 shadow-lg shadow-primary/20">
          <Activity className="h-5 w-5 text-primary animate-pulse" />
        </div>
        <div>
          <h4 className="text-sm font-black text-foreground uppercase tracking-wide">Performance Matrix</h4>
          <p className="text-[9px] text-muted-foreground font-mono">Advanced market analytics</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-xl border-2 border-border/40 bg-gradient-to-br from-card to-card/70 p-4 backdrop-blur-xl transition-all duration-500 hover:scale-[1.03] hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 animate-fade-in-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">
                    {metric.label}
                  </div>
                  <div className={`font-mono text-xl font-black ${metric.color} drop-shadow-[0_0_8px_rgba(56,189,248,0.3)] mb-1`}>
                    {metric.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono font-bold">
                    {metric.subValue}
                  </div>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${metric.bgColor} ring-2 ring-${metric.color.replace('text-', '')}/30 shadow-lg`}>
                  <Icon className={`h-5 w-5 ${metric.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
