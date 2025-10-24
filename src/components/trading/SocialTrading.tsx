import { useState } from 'react';
import { Users, TrendingUp, Trophy, Copy, Star, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

interface Trader {
  id: string;
  name: string;
  avatar: string;
  winRate: number;
  totalReturn: number;
  followers: number;
  isFollowing: boolean;
  riskScore: number;
  trades: number;
}

export const SocialTrading = () => {
  const [traders, setTraders] = useState<Trader[]>([
    {
      id: '1',
      name: 'CryptoKing',
      avatar: '',
      winRate: 78.5,
      totalReturn: 245.6,
      followers: 12453,
      isFollowing: false,
      riskScore: 6.5,
      trades: 342,
    },
    {
      id: '2',
      name: 'BTCMaster',
      avatar: '',
      winRate: 82.1,
      totalReturn: 189.3,
      followers: 8721,
      isFollowing: true,
      riskScore: 5.2,
      trades: 278,
    },
    {
      id: '3',
      name: 'WhaleTrader',
      avatar: '',
      winRate: 71.8,
      totalReturn: 312.4,
      followers: 15892,
      isFollowing: false,
      riskScore: 7.8,
      trades: 521,
    },
  ]);

  const handleFollow = (traderId: string) => {
    setTraders(traders.map(t => 
      t.id === traderId ? { ...t, isFollowing: !t.isFollowing } : t
    ));
    const trader = traders.find(t => t.id === traderId);
    if (trader) {
      toast.success(
        trader.isFollowing ? 'Unfollowed trader' : 'Now following trader',
        { description: trader.name }
      );
    }
  };

  const handleCopyTrade = (traderName: string) => {
    toast.success('Copy trading enabled', {
      description: `Following ${traderName}'s trades`,
    });
  };

  const getRiskColor = (score: number) => {
    if (score < 4) return 'text-success';
    if (score < 7) return 'text-chart-4';
    return 'text-destructive';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-chart-4" />
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Social Trading</h3>
        </div>
        <Trophy className="w-4 h-4 text-chart-4 animate-pulse" />
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {traders.map((trader, index) => (
          <div
            key={trader.id}
            className="p-3 rounded-lg bg-gradient-to-r from-muted/30 to-transparent border border-border hover:border-primary/30 transition-all hover:scale-[1.02] group"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {index < 3 && (
                    <div className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      'bg-orange-600 text-orange-900'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <AvatarImage src={trader.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {trader.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground flex items-center gap-1">
                    {trader.name}
                    {trader.winRate > 80 && (
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {trader.followers.toLocaleString()} followers
                  </div>
                </div>
              </div>

              <Button
                variant={trader.isFollowing ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFollow(trader.id)}
                className="h-7 gap-1"
              >
                <UserPlus className="w-3 h-3" />
                {trader.isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Win Rate</div>
                <div className="text-sm font-bold text-success">{trader.winRate}%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Return</div>
                <div className="text-sm font-bold text-primary">+{trader.totalReturn}%</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-muted-foreground">Risk</div>
                <div className={`text-sm font-bold ${getRiskColor(trader.riskScore)}`}>
                  {trader.riskScore}/10
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleCopyTrade(trader.name)}
              >
                <Copy className="w-3 h-3" />
                Copy Trade
              </Button>
            </div>

            {/* Additional Info */}
            <div className="mt-2 pt-2 border-t border-border/50 text-[10px] text-muted-foreground">
              {trader.trades} trades • Avg. profit: {(trader.totalReturn / trader.trades).toFixed(2)}%
            </div>
          </div>
        ))}
      </div>

      {/* Info Banner */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-chart-4/10 border border-primary/20">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">Copy Trading Benefits</span>
        </div>
        <div className="text-[10px] text-muted-foreground space-y-0.5">
          <div>• Automatically copy successful traders</div>
          <div>• Set custom risk limits</div>
          <div>• Stop copying anytime</div>
        </div>
      </div>
    </div>
  );
};
