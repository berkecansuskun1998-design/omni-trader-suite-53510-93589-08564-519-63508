import { useAccount, useDisconnect, useBalance } from 'wagmi';
import { Wallet, LogOut, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

export const WalletButton = () => {
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  const handleConnect = () => {
    const modal = document.querySelector('w3m-button');
    if (modal) {
      (modal as any).click();
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.success('Wallet disconnected');
  };

  if (isConnected && address) {
    return (
      <Card className="p-4 space-y-3 bg-gradient-to-br from-primary/10 via-background to-chart-4/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Connected Wallet
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            className="h-6 px-2"
          >
            <LogOut className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Network</span>
            <span className="text-foreground font-medium">{chain?.name}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Address</span>
            <span className="text-foreground font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>

          {balance && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Balance</span>
              <span className="text-primary font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
              </span>
            </div>
          )}
        </div>

        <w3m-button size="sm" />
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3 border-dashed border-muted-foreground/30">
      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Web3 Wallet
        </span>
      </div>

      <p className="text-xs text-muted-foreground">
        Connect your wallet to access DeFi features, token swaps, and on-chain trading.
      </p>

      <Button
        onClick={handleConnect}
        className="w-full"
        variant="outline"
        size="sm"
      >
        <Wallet className="w-4 h-4 mr-2" />
        Connect Wallet
      </Button>
    </Card>
  );
};
