import { supabase } from '@/integrations/supabase/client';

export interface ColdWalletConfig {
  id: string;
  address: string;
  chain: 'ethereum' | 'binance-smart-chain' | 'polygon' | 'arbitrum' | 'optimism' | 'bitcoin';
  currency: string;
  minAmount: number;
  enabled: boolean;
  label: string;
}

export interface MicroPayment {
  id: string;
  userId: string;
  orderId: string;
  walletAddress: string;
  amount: number;
  currency: string;
  chain: string;
  txHash?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  timestamp: Date;
  feeAmount: number;
  exchangeFee: number;
}

export class ColdWalletPaymentSystem {
  private userId: string | null = null;
  private coldWallets: Map<string, ColdWalletConfig> = new Map();

  private defaultWallets: ColdWalletConfig[] = [
    {
      id: 'cw_eth_1',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      chain: 'ethereum',
      currency: 'ETH',
      minAmount: 0.0001,
      enabled: true,
      label: 'Primary ETH Wallet'
    },
    {
      id: 'cw_bsc_1',
      address: '0x8894E0a0c962CB723c1976a4421c95949bE2D4E3',
      chain: 'binance-smart-chain',
      currency: 'BNB',
      minAmount: 0.001,
      enabled: true,
      label: 'Primary BSC Wallet'
    },
    {
      id: 'cw_polygon_1',
      address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
      chain: 'polygon',
      currency: 'MATIC',
      minAmount: 0.01,
      enabled: true,
      label: 'Primary Polygon Wallet'
    },
    {
      id: 'cw_arb_1',
      address: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      chain: 'arbitrum',
      currency: 'ETH',
      minAmount: 0.0001,
      enabled: true,
      label: 'Primary Arbitrum Wallet'
    },
    {
      id: 'cw_btc_1',
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      chain: 'bitcoin',
      currency: 'BTC',
      minAmount: 0.00001,
      enabled: true,
      label: 'Primary BTC Wallet'
    }
  ];

  constructor() {
    this.defaultWallets.forEach(wallet => {
      this.coldWallets.set(wallet.id, wallet);
    });
  }

  async initialize(userId: string) {
    this.userId = userId;
    await this.loadUserWallets();
  }

  private async loadUserWallets() {
    if (!this.userId) return;

    try {
      const { data, error } = await supabase
        .from('cold_wallets')
        .select('*')
        .eq('user_id', this.userId)
        .eq('enabled', true);

      if (error) throw error;

      if (data && data.length > 0) {
        data.forEach(wallet => {
          this.coldWallets.set(wallet.id, {
            id: wallet.id,
            address: wallet.address,
            chain: wallet.chain,
            currency: wallet.currency,
            minAmount: wallet.min_amount,
            enabled: wallet.enabled,
            label: wallet.label
          });
        });
      }
    } catch (error) {
      console.error('Failed to load user wallets:', error);
    }
  }

  getColdWallets(): ColdWalletConfig[] {
    return Array.from(this.coldWallets.values()).filter(w => w.enabled);
  }

  getWalletByChain(chain: string): ColdWalletConfig | undefined {
    return Array.from(this.coldWallets.values()).find(
      w => w.chain === chain && w.enabled
    );
  }

  async addCustomWallet(wallet: Omit<ColdWalletConfig, 'id'>): Promise<void> {
    if (!this.userId) throw new Error('User not initialized');

    const walletId = `cw_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { error } = await supabase
      .from('cold_wallets')
      .insert({
        id: walletId,
        user_id: this.userId,
        address: wallet.address,
        chain: wallet.chain,
        currency: wallet.currency,
        min_amount: wallet.minAmount,
        enabled: wallet.enabled,
        label: wallet.label,
        created_at: new Date().toISOString()
      });

    if (error) throw error;

    this.coldWallets.set(walletId, { id: walletId, ...wallet });
  }

  async processMicroPayment(
    orderId: string,
    amount: number,
    currency: string,
    chain: string
  ): Promise<MicroPayment> {
    if (!this.userId) throw new Error('User not initialized');

    const wallet = this.getWalletByChain(chain);
    if (!wallet) throw new Error(`No cold wallet configured for chain: ${chain}`);

    if (amount < wallet.minAmount) {
      throw new Error(`Amount below minimum threshold: ${wallet.minAmount} ${currency}`);
    }

    const feePercent = 0.001;
    const feeAmount = amount * feePercent;
    const exchangeFeePercent = 0.0005;
    const exchangeFee = amount * exchangeFeePercent;

    const payment: MicroPayment = {
      id: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      orderId,
      walletAddress: wallet.address,
      amount,
      currency,
      chain,
      status: 'pending',
      timestamp: new Date(),
      feeAmount,
      exchangeFee
    };

    try {
      const { error } = await supabase
        .from('micro_payments')
        .insert({
          id: payment.id,
          user_id: payment.userId,
          order_id: payment.orderId,
          wallet_address: payment.walletAddress,
          amount: payment.amount,
          currency: payment.currency,
          chain: payment.chain,
          status: payment.status,
          created_at: payment.timestamp.toISOString(),
          fee_amount: payment.feeAmount,
          exchange_fee: payment.exchangeFee
        });

      if (error) throw error;

      this.queuePaymentProcessing(payment.id);

      return payment;
    } catch (error) {
      console.error('Failed to process micro payment:', error);
      throw error;
    }
  }

  private async queuePaymentProcessing(paymentId: string) {
    setTimeout(async () => {
      try {
        await supabase
          .from('micro_payments')
          .update({ status: 'processing' })
          .eq('id', paymentId);

        setTimeout(async () => {
          const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
          
          await supabase
            .from('micro_payments')
            .update({
              status: 'completed',
              tx_hash: mockTxHash,
              completed_at: new Date().toISOString()
            })
            .eq('id', paymentId);
        }, 3000);
      } catch (error) {
        console.error('Payment processing failed:', error);
        await supabase
          .from('micro_payments')
          .update({ status: 'failed' })
          .eq('id', paymentId);
      }
    }, 1000);
  }

  async getPaymentHistory(limit: number = 50): Promise<MicroPayment[]> {
    if (!this.userId) throw new Error('User not initialized');

    const { data, error } = await supabase
      .from('micro_payments')
      .select('*')
      .eq('user_id', this.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(p => ({
      id: p.id,
      userId: p.user_id,
      orderId: p.order_id,
      walletAddress: p.wallet_address,
      amount: p.amount,
      currency: p.currency,
      chain: p.chain,
      txHash: p.tx_hash,
      status: p.status,
      timestamp: new Date(p.created_at),
      feeAmount: p.fee_amount,
      exchangeFee: p.exchange_fee
    }));
  }

  async getTotalPayments(): Promise<{ total: number; completed: number; pending: number }> {
    if (!this.userId) throw new Error('User not initialized');

    const { data, error } = await supabase
      .from('micro_payments')
      .select('status, amount')
      .eq('user_id', this.userId);

    if (error) throw error;

    const stats = (data || []).reduce(
      (acc, p) => {
        acc.total += p.amount;
        if (p.status === 'completed') acc.completed += p.amount;
        if (p.status === 'pending' || p.status === 'processing') acc.pending += p.amount;
        return acc;
      },
      { total: 0, completed: 0, pending: 0 }
    );

    return stats;
  }

  async automatePaymentOnTrade(
    orderId: string,
    tradeAmount: number,
    tradeCurrency: string,
    exchange: string
  ): Promise<void> {
    const paymentPercentage = 0.0002;
    const paymentAmount = tradeAmount * paymentPercentage;

    let chain: ColdWalletConfig['chain'] = 'ethereum';
    if (tradeCurrency.includes('BNB')) chain = 'binance-smart-chain';
    else if (tradeCurrency.includes('MATIC')) chain = 'polygon';
    else if (tradeCurrency.includes('BTC')) chain = 'bitcoin';

    try {
      await this.processMicroPayment(orderId, paymentAmount, tradeCurrency, chain);
    } catch (error) {
      console.error('Automated payment failed:', error);
    }
  }
}

export const coldWalletPaymentSystem = new ColdWalletPaymentSystem();
