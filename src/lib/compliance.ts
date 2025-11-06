import { supabase } from '@/integrations/supabase/client';

export interface KYCData {
  userId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  idType: 'passport' | 'drivers_license' | 'national_id';
  idNumber: string;
  idExpiryDate: string;
  selfieUrl?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  proofOfAddressUrl?: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  submittedAt: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
}

export interface AMLAlert {
  id: string;
  userId: string;
  type: 'suspicious_transaction' | 'high_volume' | 'rapid_trading' | 'unusual_pattern' | 'sanctioned_country';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  relatedTransactions: string[];
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  createdAt: Date;
  resolvedAt?: Date;
  notes?: string;
}

export interface TransactionMonitoring {
  id: string;
  userId: string;
  transactionId: string;
  type: 'deposit' | 'withdrawal' | 'trade' | 'transfer';
  amount: number;
  currency: string;
  fromAddress?: string;
  toAddress?: string;
  riskScore: number;
  flags: string[];
  timestamp: Date;
  approved: boolean;
}

export interface ComplianceReport {
  id: string;
  reportType: 'sar' | 'ctr' | 'kyc_summary' | 'transaction_summary';
  period: { start: Date; end: Date };
  generatedAt: Date;
  generatedBy: string;
  summary: {
    totalUsers: number;
    newUsers: number;
    kycPending: number;
    kycApproved: number;
    kycRejected: number;
    totalTransactions: number;
    totalVolume: number;
    amlAlerts: number;
    suspiciousActivities: number;
  };
  fileUrl?: string;
}

export class ComplianceSystem {
  private userId: string | null = null;
  private isAdmin: boolean = false;

  async initialize(userId: string, isAdmin: boolean = false) {
    this.userId = userId;
    this.isAdmin = isAdmin;
  }

  async submitKYC(kycData: Omit<KYCData, 'userId' | 'status' | 'submittedAt'>): Promise<KYCData> {
    if (!this.userId) throw new Error('User not initialized');

    const kyc: KYCData = {
      userId: this.userId,
      ...kycData,
      status: 'pending',
      submittedAt: new Date()
    };

    const { error } = await supabase
      .from('kyc_data')
      .insert({
        user_id: kyc.userId,
        first_name: kyc.firstName,
        last_name: kyc.lastName,
        date_of_birth: kyc.dateOfBirth,
        nationality: kyc.nationality,
        address: kyc.address,
        city: kyc.city,
        postal_code: kyc.postalCode,
        country: kyc.country,
        id_type: kyc.idType,
        id_number: kyc.idNumber,
        id_expiry_date: kyc.idExpiryDate,
        selfie_url: kyc.selfieUrl,
        id_front_url: kyc.idFrontUrl,
        id_back_url: kyc.idBackUrl,
        proof_of_address_url: kyc.proofOfAddressUrl,
        status: kyc.status,
        submitted_at: kyc.submittedAt.toISOString()
      });

    if (error) throw error;

    return kyc;
  }

  async getKYCStatus(): Promise<KYCData | null> {
    if (!this.userId) throw new Error('User not initialized');

    const { data, error } = await supabase
      .from('kyc_data')
      .select('*')
      .eq('user_id', this.userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      nationality: data.nationality,
      address: data.address,
      city: data.city,
      postalCode: data.postal_code,
      country: data.country,
      idType: data.id_type,
      idNumber: data.id_number,
      idExpiryDate: data.id_expiry_date,
      selfieUrl: data.selfie_url,
      idFrontUrl: data.id_front_url,
      idBackUrl: data.id_back_url,
      proofOfAddressUrl: data.proof_of_address_url,
      status: data.status,
      submittedAt: new Date(data.submitted_at),
      reviewedAt: data.reviewed_at ? new Date(data.reviewed_at) : undefined,
      rejectionReason: data.rejection_reason
    };
  }

  async monitorTransaction(
    transactionId: string,
    type: TransactionMonitoring['type'],
    amount: number,
    currency: string,
    fromAddress?: string,
    toAddress?: string
  ): Promise<TransactionMonitoring> {
    if (!this.userId) throw new Error('User not initialized');

    const riskScore = await this.calculateRiskScore(amount, currency, type);
    const flags = await this.checkTransactionFlags(amount, currency, fromAddress, toAddress);

    const monitoring: TransactionMonitoring = {
      id: `tm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      transactionId,
      type,
      amount,
      currency,
      fromAddress,
      toAddress,
      riskScore,
      flags,
      timestamp: new Date(),
      approved: riskScore < 70 && flags.length === 0
    };

    await supabase.from('transaction_monitoring').insert({
      id: monitoring.id,
      user_id: monitoring.userId,
      transaction_id: monitoring.transactionId,
      type: monitoring.type,
      amount: monitoring.amount,
      currency: monitoring.currency,
      from_address: monitoring.fromAddress,
      to_address: monitoring.toAddress,
      risk_score: monitoring.riskScore,
      flags: monitoring.flags,
      timestamp: monitoring.timestamp.toISOString(),
      approved: monitoring.approved
    });

    if (riskScore > 70 || flags.length > 0) {
      await this.createAMLAlert(
        'suspicious_transaction',
        riskScore > 80 ? 'high' : 'medium',
        `Transaction ${transactionId} flagged: Risk score ${riskScore}, Flags: ${flags.join(', ')}`,
        [transactionId]
      );
    }

    return monitoring;
  }

  private async calculateRiskScore(
    amount: number,
    currency: string,
    type: string
  ): Promise<number> {
    let score = 0;

    const { data: userHistory } = await supabase
      .from('transaction_monitoring')
      .select('amount, type')
      .eq('user_id', this.userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (userHistory && userHistory.length > 0) {
      const avgAmount = userHistory.reduce((sum, t) => sum + t.amount, 0) / userHistory.length;
      
      if (amount > avgAmount * 5) {
        score += 30;
      } else if (amount > avgAmount * 3) {
        score += 20;
      }

      const recentTransactions = userHistory.slice(0, 10);
      const rapidTrading = recentTransactions.filter(t => 
        new Date().getTime() - new Date(t.timestamp).getTime() < 3600000
      ).length;

      if (rapidTrading > 5) {
        score += 25;
      }
    }

    if (amount > 10000) {
      score += 15;
    } else if (amount > 50000) {
      score += 30;
    }

    if (type === 'withdrawal') {
      score += 10;
    }

    return Math.min(100, score);
  }

  private async checkTransactionFlags(
    amount: number,
    currency: string,
    fromAddress?: string,
    toAddress?: string
  ): Promise<string[]> {
    const flags: string[] = [];

    if (amount > 100000) {
      flags.push('large_transaction');
    }

    const sanctionedCountries = ['KP', 'IR', 'SY'];
    
    if (amount > 10000 && !this.userId) {
      flags.push('kyc_required');
    }

    const { data: recentWithdrawals } = await supabase
      .from('transaction_monitoring')
      .select('amount')
      .eq('user_id', this.userId)
      .eq('type', 'withdrawal')
      .gte('timestamp', new Date(Date.now() - 86400000).toISOString());

    if (recentWithdrawals) {
      const totalWithdrawn = recentWithdrawals.reduce((sum, t) => sum + t.amount, 0);
      if (totalWithdrawn > 50000) {
        flags.push('high_daily_withdrawal');
      }
    }

    return flags;
  }

  async createAMLAlert(
    type: AMLAlert['type'],
    severity: AMLAlert['severity'],
    description: string,
    relatedTransactions: string[]
  ): Promise<AMLAlert> {
    if (!this.userId) throw new Error('User not initialized');

    const alert: AMLAlert = {
      id: `aml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      type,
      severity,
      description,
      relatedTransactions,
      status: 'open',
      createdAt: new Date()
    };

    await supabase.from('aml_alerts').insert({
      id: alert.id,
      user_id: alert.userId,
      type: alert.type,
      severity: alert.severity,
      description: alert.description,
      related_transactions: alert.relatedTransactions,
      status: alert.status,
      created_at: alert.createdAt.toISOString()
    });

    return alert;
  }

  async getAMLAlerts(status?: AMLAlert['status']): Promise<AMLAlert[]> {
    if (!this.isAdmin) throw new Error('Admin access required');

    let query = supabase
      .from('aml_alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(a => ({
      id: a.id,
      userId: a.user_id,
      type: a.type,
      severity: a.severity,
      description: a.description,
      relatedTransactions: a.related_transactions,
      status: a.status,
      createdAt: new Date(a.created_at),
      resolvedAt: a.resolved_at ? new Date(a.resolved_at) : undefined,
      notes: a.notes
    }));
  }

  async generateComplianceReport(
    reportType: ComplianceReport['reportType'],
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport> {
    if (!this.isAdmin) throw new Error('Admin access required');

    const { data: kycData } = await supabase
      .from('kyc_data')
      .select('status, submitted_at')
      .gte('submitted_at', startDate.toISOString())
      .lte('submitted_at', endDate.toISOString());

    const { data: transactions } = await supabase
      .from('transaction_monitoring')
      .select('amount, currency')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString());

    const { data: alerts } = await supabase
      .from('aml_alerts')
      .select('severity')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const report: ComplianceReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      reportType,
      period: { start: startDate, end: endDate },
      generatedAt: new Date(),
      generatedBy: this.userId!,
      summary: {
        totalUsers: kycData?.length || 0,
        newUsers: kycData?.length || 0,
        kycPending: kycData?.filter(k => k.status === 'pending').length || 0,
        kycApproved: kycData?.filter(k => k.status === 'approved').length || 0,
        kycRejected: kycData?.filter(k => k.status === 'rejected').length || 0,
        totalTransactions: transactions?.length || 0,
        totalVolume: transactions?.reduce((sum, t) => sum + t.amount, 0) || 0,
        amlAlerts: alerts?.length || 0,
        suspiciousActivities: alerts?.filter(a => a.severity === 'high' || a.severity === 'critical').length || 0
      }
    };

    await supabase.from('compliance_reports').insert({
      id: report.id,
      report_type: report.reportType,
      period_start: report.period.start.toISOString(),
      period_end: report.period.end.toISOString(),
      generated_at: report.generatedAt.toISOString(),
      generated_by: report.generatedBy,
      summary: report.summary
    });

    return report;
  }

  async checkUserCompliance(userId: string): Promise<{
    isCompliant: boolean;
    kycStatus: string;
    amlRisk: 'low' | 'medium' | 'high';
    restrictions: string[];
  }> {
    const { data: kycData } = await supabase
      .from('kyc_data')
      .select('status')
      .eq('user_id', userId)
      .maybeSingle();

    const { data: openAlerts } = await supabase
      .from('aml_alerts')
      .select('severity')
      .eq('user_id', userId)
      .eq('status', 'open');

    const kycStatus = kycData?.status || 'not_submitted';
    const isCompliant = kycStatus === 'approved';

    let amlRisk: 'low' | 'medium' | 'high' = 'low';
    if (openAlerts && openAlerts.length > 0) {
      const hasHighRisk = openAlerts.some(a => a.severity === 'high' || a.severity === 'critical');
      amlRisk = hasHighRisk ? 'high' : 'medium';
    }

    const restrictions: string[] = [];
    if (kycStatus !== 'approved') {
      restrictions.push('kyc_required');
      restrictions.push('withdrawal_limited');
    }
    if (amlRisk === 'high') {
      restrictions.push('account_review');
      restrictions.push('trading_suspended');
    }

    return {
      isCompliant,
      kycStatus,
      amlRisk,
      restrictions
    };
  }
}

export const complianceSystem = new ComplianceSystem();
