import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Exchange, DataSource } from '@/types/trading';
import { EXCHANGES } from '@/lib/exchanges';
import { WalletButton } from '@/components/web3/WalletButton';
import { useAccount } from 'wagmi';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

interface HeaderProps {
  exchange: Exchange;
  symbol: string;
  source: DataSource;
  symbols: string[];
  onExchangeChange: (exchange: Exchange) => void;
  onSymbolChange: (symbol: string) => void;
  onSourceChange: (source: DataSource) => void;
  onRefresh: () => void;
}

export function Header({
  exchange,
  symbol,
  source,
  symbols,
  onExchangeChange,
  onSymbolChange,
  onSourceChange,
  onRefresh,
}: HeaderProps) {
  const { isConnected } = useAccount();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="group relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/60 to-card/30 p-5 shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shadow-lg shadow-primary/20 ring-2 ring-primary/20">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-primary to-primary/60" />
          </div>
          <div>
            <h1 className="bg-gradient-to-r from-primary via-primary to-cyan-400 bg-clip-text text-2xl font-black tracking-tight text-transparent">
              OmniTerminal
            </h1>
            <p className="text-xs font-medium text-muted-foreground">
              Professional Multi-Exchange Terminal
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Exchange:</label>
          <Select value={exchange} onValueChange={(v) => onExchangeChange(v as Exchange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(EXCHANGES).map((ex) => (
                <SelectItem key={ex} value={ex}>
                  {EXCHANGES[ex as Exchange].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Symbol:</label>
          <Select value={symbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {symbols.map((sym) => (
                <SelectItem key={sym} value={sym}>
                  {sym.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Source:</label>
          <Select value={source} onValueChange={(v) => onSourceChange(v as DataSource)}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ws">WebSocket</SelectItem>
              <SelectItem value="rest">REST</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={onRefresh} size="sm" variant="outline">
          <RefreshCw className="h-4 w-4" />
        </Button>

        {isConnected && <WalletButton />}
        
        {!user && (
          <Link to="/auth">
            <Button size="sm" className="bg-gradient-to-r from-primary to-chart-2">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
