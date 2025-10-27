import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Activity, Star, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useRealTimePrice } from '@/hooks/useRealTimePrice';
import { toast } from 'sonner';

interface WatchlistProps {
  symbols: string[];
  activeSymbol: string;
  onSymbolClick: (symbol: string) => void;
}

interface SymbolData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  isFavorite: boolean;
}

export function Watchlist({ symbols, activeSymbol, onSymbolClick }: WatchlistProps) {
  const [symbolsData, setSymbolsData] = useState<SymbolData[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [userWatchlist, setUserWatchlist] = useState<Set<string>>(new Set());
  
  const { prices, getPrice } = useRealTimePrice(symbols);

  useEffect(() => {
    fetchUserWatchlist();
  }, []);

  const fetchUserWatchlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_watchlist')
        .select('symbol, is_favorite')
        .eq('user_id', user.id);

      if (error) throw error;

      const watchlistSymbols = new Set(data?.filter(w => w.is_favorite).map(w => w.symbol) || []);
      setUserWatchlist(watchlistSymbols);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
    }
  };

  useEffect(() => {
    // Update symbols data with real-time prices
    const data: SymbolData[] = symbols.map(symbol => {
      const priceData = getPrice(symbol);
      return {
        symbol,
        price: priceData?.price || 0,
        change24h: priceData?.change24h || 0,
        volume: priceData?.volume || 0,
        isFavorite: userWatchlist.has(symbol),
      };
    });
    setSymbolsData(data);
  }, [symbols, prices, userWatchlist, getPrice]);

  const toggleFavorite = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to add favorites');
        return;
      }

      const isFavorite = userWatchlist.has(symbol);

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('user_watchlist')
          .delete()
          .eq('user_id', user.id)
          .eq('symbol', symbol);

        if (error) throw error;

        setUserWatchlist(prev => {
          const newSet = new Set(prev);
          newSet.delete(symbol);
          return newSet;
        });
        toast.success(`${symbol} removed from favorites`);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('user_watchlist')
          .insert({
            user_id: user.id,
            symbol,
            is_favorite: true,
          });

        if (error) throw error;

        setUserWatchlist(prev => new Set(prev).add(symbol));
        toast.success(`${symbol} added to favorites`);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    }
  };

  const displayedSymbols = showAll ? symbolsData : symbolsData.slice(0, 6);

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary/10 via-cyan-500/10 to-primary/10 border border-primary/20 p-3">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 backdrop-blur-sm">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <h3 className="text-sm font-bold tracking-wide text-foreground">Elite Watchlist</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-1 text-xs hover:bg-primary/20"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Show Less' : `+${symbolsData.length - 6}`}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-2">
        {displayedSymbols.map((data) => {
          const isActive = data.symbol === activeSymbol;
          const isPositive = data.change24h >= 0;
          
          return (
            <div
              key={data.symbol}
              onClick={() => onSymbolClick(data.symbol)}
              className={cn(
                'relative overflow-hidden rounded-xl border p-4 transition-all duration-300 cursor-pointer group',
                isActive 
                  ? 'bg-gradient-to-r from-primary/20 via-cyan-500/20 to-primary/20 border-primary/50 shadow-xl shadow-primary/30 scale-[1.02]' 
                  : 'border-border/40 bg-card/20 hover:border-primary/40 hover:bg-card/40 hover:scale-[1.01]'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5 animate-shimmer" />
              )}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl" />
              
              <div className="relative z-10 space-y-2">
                {/* Elite Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-primary/10">
                      <span className="font-mono text-xs font-bold text-foreground">
                        {data.symbol.toUpperCase()}
                      </span>
                    </div>
                    <Star 
                      className={cn(
                        "w-3.5 h-3.5 cursor-pointer transition-all duration-300",
                        data.isFavorite ? "fill-yellow-500 text-yellow-500 scale-110" : "text-muted-foreground hover:text-yellow-500 hover:scale-110"
                      )}
                      onClick={(e) => toggleFavorite(data.symbol, e)}
                    />
                  </div>
                  
                  <Badge 
                    variant={isPositive ? "default" : "destructive"}
                    className={cn(
                      "text-[10px] font-bold flex items-center gap-1",
                      isPositive ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
                    )}
                  >
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{data.change24h.toFixed(2)}%
                  </Badge>
                </div>

                {/* Elite Price Display */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground tracking-tight">
                      ${data.price.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      Vol: ${(data.volume / 1000000).toFixed(1)}M
                    </span>
                    {data.isFavorite && (
                      <Badge variant="outline" className="text-[9px] bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                        Favorite
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Elite Mini Chart */}
                <div className="h-10 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-2">
                  <div className={cn(
                    "h-full rounded-lg bg-gradient-to-r relative overflow-hidden",
                    isPositive 
                      ? "from-success/10 via-success/20 to-success/10" 
                      : "from-destructive/10 via-destructive/20 to-destructive/10"
                  )}>
                    <div className="absolute inset-0 flex items-end justify-around p-1">
                      {[...Array(12)].map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "w-1 rounded-full",
                            isPositive ? "bg-success/40" : "bg-destructive/40"
                          )}
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}