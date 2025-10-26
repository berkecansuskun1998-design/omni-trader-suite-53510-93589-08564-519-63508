import { Zap, Clock, BarChart3, Percent } from 'lucide-react';

interface QuickStatsProps {
  symbol: string;
  price: number | null;
}

export const QuickStats = ({ symbol, price }: QuickStatsProps) => {
  const stats = [
    { label: 'Avg Trade', value: '$1,234.56', icon: BarChart3, change: '+2.5%', positive: true },
    { label: 'Trades/min', value: '48', icon: Clock, change: '+12%', positive: true },
    { label: 'Buy Pressure', value: '65%', icon: Percent, change: '+5%', positive: true },
    { label: 'Activity', value: 'High', icon: Zap, change: 'Trending', positive: true }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-2 ring-primary/35 shadow-lg shadow-primary/20">
          <Zap className="w-5 h-5 text-primary animate-pulse" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-wide">Quick Analytics</h3>
          <p className="text-[9px] text-muted-foreground font-mono">Real-time market metrics</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="relative overflow-hidden rounded-xl border-2 border-border/40 bg-gradient-to-br from-card to-card/70 p-4 backdrop-blur-xl transition-all duration-300 hover:scale-[1.05] hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-2 ring-primary/30">
                <stat.icon className="w-4 h-4 text-primary" />
              </div>
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                stat.positive 
                  ? 'bg-success/20 text-success ring-1 ring-success/40' 
                  : 'bg-destructive/20 text-destructive ring-1 ring-destructive/40'
              }`}>
                {stat.change}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1.5">{stat.label}</div>
            <div className="text-lg font-black text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
