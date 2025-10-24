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
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Quick Stats</h3>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => (
          <div key={i} className="p-3 rounded-lg bg-gradient-to-br from-muted/30 to-transparent border border-border hover:border-primary/30 transition-all hover:scale-105">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className="w-4 h-4 text-primary" />
              <span className={`text-[10px] font-medium ${stat.positive ? 'text-success' : 'text-destructive'}`}>{stat.change}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-sm font-bold text-foreground">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
