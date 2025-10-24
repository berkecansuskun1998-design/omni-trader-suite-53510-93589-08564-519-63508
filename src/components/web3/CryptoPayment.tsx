import { useState } from 'react';
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Send, Loader2, CheckCircle2, AlertCircle, Coins, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { PAYMENT_ADDRESS, SUPPORTED_CHAINS } from '@/lib/web3-config';

interface CryptoPaymentProps {
  onSuccess?: (txHash: string) => void;
}

export function CryptoPayment({ onSuccess }: CryptoPaymentProps) {
  const { address, isConnected } = useAccount();
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const { data: hash, isPending, sendTransaction } = useSendTransaction();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSend = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      sendTransaction({
        to: PAYMENT_ADDRESS as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (error) {
      console.error('Transaction error:', error);
      toast.error('Transaction failed');
    }
  };

  if (isSuccess && hash) {
    onSuccess?.(hash);
    toast.success('Payment successful!', {
      description: `Transaction: ${hash.slice(0, 10)}...${hash.slice(-8)}`,
    });
  }

  const estimatedFee = amount ? (parseFloat(amount) * 0.002).toFixed(6) : '0';
  const totalAmount = amount ? (parseFloat(amount) + parseFloat(estimatedFee)).toFixed(6) : '0';

  return (
    <Card className="glass-panel space-y-6 border-primary/20 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-2 shadow-lg shadow-primary/30">
            <Coins className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Crypto Payment</h3>
            <p className="text-xs text-muted-foreground">Send crypto directly to terminal</p>
          </div>
        </div>
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Secure
        </Badge>
      </div>

      {!isConnected ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center"
        >
          <Wallet className="mx-auto mb-4 h-12 w-12 text-primary opacity-50" />
          <p className="text-sm text-muted-foreground">
            Connect your wallet to make payments
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <Select value={selectedToken} onValueChange={setSelectedToken}>
              <SelectTrigger id="token" className="glass-panel">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(SUPPORTED_CHAINS).map((chain) => (
                  <SelectItem key={chain.symbol} value={chain.symbol}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: chain.color }}
                      />
                      {chain.symbol}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <Input
                id="amount"
                type="number"
                step="0.001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="glass-panel pr-16 font-mono text-lg"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                {selectedToken}
              </span>
            </div>
          </div>

          <div className="glass-panel space-y-2 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-mono font-medium">
                {amount || '0.00'} {selectedToken}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Est. Gas Fee</span>
              <span className="font-mono font-medium text-chart-4">
                ~{estimatedFee} {selectedToken}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-mono text-lg font-bold text-primary">
                  {totalAmount} {selectedToken}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-lg border border-primary/20 bg-primary/5 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Recipient:</strong> {PAYMENT_ADDRESS.slice(0, 20)}...
              {PAYMENT_ADDRESS.slice(-10)}
            </p>
          </div>

          <Button
            onClick={handleSend}
            disabled={isPending || isConfirming || !amount}
            className="w-full bg-gradient-to-r from-primary to-chart-2 hover:shadow-lg hover:shadow-primary/50"
            size="lg"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isConfirming ? 'Confirming...' : 'Sending...'}
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Payment Sent!
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Payment
              </>
            )}
          </Button>

          {hash && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-3"
            >
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div className="flex-1 text-xs">
                <p className="font-medium text-success">Transaction Sent</p>
                <p className="font-mono text-muted-foreground">
                  {hash.slice(0, 20)}...{hash.slice(-10)}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </Card>
  );
}
