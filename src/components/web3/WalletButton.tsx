import { useState, useEffect } from 'react';
import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, LogOut, ArrowDownUp, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTED_CHAINS } from '@/lib/web3-config';

export function WalletButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: balance } = useBalance({ address });
  const [showMenu, setShowMenu] = useState(false);

  const currentChain = Object.values(SUPPORTED_CHAINS).find(c => c.id === chainId);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = (bal: string) => {
    const num = parseFloat(bal);
    return num < 0.0001 ? '< 0.0001' : num.toFixed(4);
  };

  if (!isConnected) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={() => open()}
          className="relative overflow-hidden bg-gradient-to-r from-primary via-chart-2 to-primary bg-[length:200%_100%] animate-shimmer hover:shadow-lg hover:shadow-primary/50 transition-all duration-300"
        >
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          />
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card
          className="glass-panel cursor-pointer p-3 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
          onClick={() => setShowMenu(!showMenu)}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full border-2 border-primary/30 p-2"
              style={{ backgroundColor: `${currentChain?.color}20` }}
            >
              <Wallet className="h-full w-full" style={{ color: currentChain?.color }} />
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/30 bg-primary/10 text-primary"
                >
                  {currentChain?.symbol}
                </Badge>
                <span className="font-mono text-sm font-medium text-foreground">
                  {formatAddress(address!)}
                </span>
              </div>
              
              {balance && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1 text-xs text-muted-foreground"
                >
                  <TrendingUp className="h-3 w-3 text-success" />
                  {formatBalance(balance.formatted)} {balance.symbol}
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full z-50 mt-2 w-80"
          >
            <Card className="glass-panel border-primary/20 p-4 shadow-2xl shadow-primary/20">
              <div className="space-y-4">
                <div>
                  <h3 className="mb-3 text-sm font-bold text-foreground">Switch Network</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(SUPPORTED_CHAINS).map((chain) => (
                      <motion.button
                        key={chain.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => switchChain({ chainId: chain.id })}
                        className={`glass-panel flex items-center gap-2 rounded-lg p-2 transition-all ${
                          chainId === chain.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div
                          className="h-6 w-6 rounded-full"
                          style={{ backgroundColor: chain.color }}
                        />
                        <span className="text-xs font-medium">{chain.name}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => open({ view: 'Account' })}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <ArrowDownUp className="mr-2 h-4 w-4" />
                    Account
                  </Button>
                  <Button
                    onClick={() => disconnect()}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
