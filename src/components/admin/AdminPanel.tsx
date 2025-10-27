import { useState, useEffect } from 'react';
import { Shield, DollarSign, Users, Activity, CheckCircle, XCircle, Clock, TrendingUp, Zap, Eye, RefreshCw, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Payment {
  id: string;
  user_id: string;
  blockchain: string;
  tx_hash: string | null;
  amount_crypto: number;
  amount_usd: number;
  omni99_amount: number;
  status: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalPayments: number;
  pendingPayments: number;
  totalOmni99Issued: number;
  approvedPayments: number;
  rejectedPayments: number;
  totalVolumeUSD: number;
  avgPaymentSize: number;
}

export const AdminPanel = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalPayments: 0,
    pendingPayments: 0,
    totalOmni99Issued: 0,
    approvedPayments: 0,
    rejectedPayments: 0,
    totalVolumeUSD: 0,
    avgPaymentSize: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('crypto_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      setPayments(paymentsData || []);

      // Fetch stats
      const { data: balancesData } = await supabase
        .from('omni99_balances')
        .select('balance, total_purchased');

      const totalOmni99 = balancesData?.reduce((sum, b) => sum + parseFloat(String(b.total_purchased)), 0) || 0;
      const totalUsers = balancesData?.length || 0;
      const totalVolumeUSD = paymentsData?.reduce((sum, p) => sum + parseFloat(String(p.amount_usd)), 0) || 0;
      const avgPaymentSize = paymentsData?.length ? totalVolumeUSD / paymentsData.length : 0;

      setStats({
        totalUsers,
        totalPayments: paymentsData?.length || 0,
        pendingPayments: paymentsData?.filter(p => p.status === 'pending').length || 0,
        approvedPayments: paymentsData?.filter(p => p.status === 'approved').length || 0,
        rejectedPayments: paymentsData?.filter(p => p.status === 'rejected').length || 0,
        totalOmni99Issued: totalOmni99,
        totalVolumeUSD,
        avgPaymentSize,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const paymentsChannel = supabase
      .channel('admin_payments')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'crypto_payments' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  const verifyPayment = async (paymentId: string, approve: boolean) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      if (!payment) return;

      if (approve) {
        // Update payment status
        const { error: updateError } = await supabase
          .from('crypto_payments')
          .update({ 
            status: 'approved',
            verified_at: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (updateError) throw updateError;

        // Add tokens to user balance
        const { error: balanceError } = await supabase.rpc('update_omni99_balance', {
          p_user_id: payment.user_id,
          p_amount: payment.omni99_amount,
          p_transaction_type: 'purchase',
          p_description: `Purchase via ${payment.blockchain} - ${payment.tx_hash || 'N/A'}`,
          p_reference_id: paymentId,
        });

        if (balanceError) throw balanceError;

        toast.success('Payment approved and tokens distributed');
      } else {
        // Reject payment
        const { error } = await supabase
          .from('crypto_payments')
          .update({ 
            status: 'rejected',
            verified_at: new Date().toISOString(),
          })
          .eq('id', paymentId);

        if (error) throw error;
        toast.success('Payment rejected');
      }

      fetchData();
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-success" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-warning" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold text-foreground">Admin Panel</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-20 bg-muted/30 rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Elite Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 via-cyan-500/20 to-primary/20 border border-primary/30 p-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
              <Shield className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-1">Elite Admin Console</h2>
              <p className="text-sm text-muted-foreground">Real-time system monitoring & management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Elite Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/30 p-5 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs">Live</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Users</p>
            <p className="text-3xl font-bold text-foreground mb-2">{stats.totalUsers}</p>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last month</span>
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-cyan-500/10 via-cyan-500/5 to-transparent border-cyan-500/30 p-5 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-cyan-500/20 backdrop-blur-sm">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <Badge variant="outline" className="text-xs">Total</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Total Payments</p>
            <p className="text-3xl font-bold text-foreground mb-2">{stats.totalPayments}</p>
            <div className="text-xs text-muted-foreground">
              Approved: {stats.approvedPayments} | Rejected: {stats.rejectedPayments}
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-warning/10 via-warning/5 to-transparent border-warning/30 p-5 hover:shadow-lg hover:shadow-warning/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-warning/20 backdrop-blur-sm">
                <Clock className="w-5 h-5 text-warning animate-pulse" />
              </div>
              <Badge variant="outline" className="text-xs bg-warning/20">Action Required</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">Pending Verification</p>
            <p className="text-3xl font-bold text-foreground mb-2">{stats.pendingPayments}</p>
            <div className="flex items-center gap-1 text-xs text-warning">
              <Eye className="w-3 h-3" />
              <span>Requires immediate attention</span>
            </div>
          </div>
        </Card>

        <Card className="group relative overflow-hidden bg-gradient-to-br from-success/10 via-success/5 to-transparent border-success/30 p-5 hover:shadow-lg hover:shadow-success/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-success/20 backdrop-blur-sm">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <Badge variant="outline" className="text-xs">Issued</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">OMNI99 Tokens</p>
            <p className="text-3xl font-bold text-foreground mb-2">{stats.totalOmni99Issued.toFixed(2)}</p>
            <div className="text-xs text-muted-foreground">
              ${stats.totalVolumeUSD.toFixed(2)} USD Volume
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 bg-gradient-to-br from-card/50 to-card/30 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">Avg Payment Size</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">${stats.avgPaymentSize.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-1">Per transaction</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-card/50 to-card/30 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-semibold text-foreground">Success Rate</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.totalPayments > 0 ? ((stats.approvedPayments / stats.totalPayments) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Approval ratio</p>
        </Card>

        <Card className="p-5 bg-gradient-to-br from-card/50 to-card/30 border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-success/10">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <h3 className="font-semibold text-foreground">Total Volume</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">${(stats.totalVolumeUSD / 1000).toFixed(1)}K</p>
          <p className="text-xs text-muted-foreground mt-1">USD equivalent</p>
        </Card>
      </div>

      {/* Elite Payments Management */}
      <Card className="p-6 bg-gradient-to-br from-card/50 to-card/30 border-border/50">
        <Tabs defaultValue="pending" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground">Payment Verification Center</h3>
          </div>
          <TabsList className="grid w-full grid-cols-3 bg-muted/30">
            <TabsTrigger value="pending" className="data-[state=active]:bg-warning/20">
              <Clock className="w-4 h-4 mr-2" />
              Pending ({stats.pendingPayments})
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-success/20">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approved ({stats.approvedPayments})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-destructive/20">
              <XCircle className="w-4 h-4 mr-2" />
              Rejected ({stats.rejectedPayments})
            </TabsTrigger>
          </TabsList>

          {['pending', 'approved', 'rejected'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4 mt-4">
              {payments.filter(p => p.status === status).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No {status} payments
                </div>
              ) : (
                  payments
                    .filter(p => p.status === status)
                    .map(payment => (
                      <Card key={payment.id} className="group relative overflow-hidden bg-gradient-to-r from-card/50 to-card/30 border-border/50 p-5 hover:shadow-lg transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="p-2 rounded-lg bg-muted/30">
                              {getStatusIcon(payment.status)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3">
                                <Badge variant="outline" className="font-mono text-xs">
                                  {payment.blockchain}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(payment.created_at).toLocaleString('tr-TR', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Crypto Amount</p>
                                  <p className="font-semibold text-foreground">{payment.amount_crypto}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">USD Value</p>
                                  <p className="font-semibold text-foreground">${parseFloat(String(payment.amount_usd)).toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">OMNI99 Tokens</p>
                                  <p className="font-semibold text-success">{payment.omni99_amount}</p>
                                </div>
                              </div>
                              
                              {payment.tx_hash && (
                                <div className="p-2 rounded-lg bg-muted/20 border border-border/30">
                                  <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                                  <p className="text-xs font-mono text-foreground break-all">{payment.tx_hash}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {payment.status === 'pending' && (
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                className="bg-success hover:bg-success/90"
                                onClick={() => verifyPayment(payment.id, true)}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => verifyPayment(payment.id, false)}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};