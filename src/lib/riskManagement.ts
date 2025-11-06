export interface RiskParameters {
  accountBalance: number;
  riskPercentPerTrade: number;
  maxLeverage: number;
  maxPositionSize: number;
  maxDrawdown: number;
  stopLossPercent: number;
}

export interface PositionSizeResult {
  recommendedSize: number;
  riskAmount: number;
  stopLossPrice: number;
  takeProfitPrice?: number;
  leverageUsed: number;
  marginRequired: number;
  potentialLoss: number;
  potentialGain: number;
  riskRewardRatio: number;
}

export interface MarginCalculation {
  initialMargin: number;
  maintenanceMargin: number;
  availableMargin: number;
  marginLevel: number;
  liquidationPrice: number;
  maxPositionSize: number;
}

export interface LeverageSettings {
  currentLeverage: number;
  maxLeverage: number;
  isolatedMargin: boolean;
  crossMargin: boolean;
  marginAsset: string;
}

export class RiskManagementSystem {
  private defaultRiskParams: RiskParameters = {
    accountBalance: 10000,
    riskPercentPerTrade: 2,
    maxLeverage: 10,
    maxPositionSize: 5000,
    maxDrawdown: 20,
    stopLossPercent: 2
  };

  calculatePositionSize(
    entryPrice: number,
    stopLossPrice: number,
    accountBalance: number,
    riskPercent: number = 2,
    leverage: number = 1
  ): PositionSizeResult {
    const riskAmount = (accountBalance * riskPercent) / 100;
    
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const priceRiskPercent = (priceRisk / entryPrice) * 100;
    
    const positionSize = riskAmount / priceRisk;
    
    const adjustedPositionSize = Math.min(
      positionSize,
      (accountBalance * leverage) / entryPrice
    );
    
    const marginRequired = (adjustedPositionSize * entryPrice) / leverage;
    
    const potentialLoss = adjustedPositionSize * priceRisk;
    
    const takeProfitPrice = entryPrice > stopLossPrice 
      ? entryPrice + (priceRisk * 2)
      : entryPrice - (priceRisk * 2);
    
    const potentialGain = adjustedPositionSize * Math.abs(takeProfitPrice - entryPrice);
    
    const riskRewardRatio = potentialGain / potentialLoss;

    return {
      recommendedSize: adjustedPositionSize,
      riskAmount,
      stopLossPrice,
      takeProfitPrice,
      leverageUsed: leverage,
      marginRequired,
      potentialLoss,
      potentialGain,
      riskRewardRatio
    };
  }

  calculateKellyPosition(
    winRate: number,
    avgWin: number,
    avgLoss: number,
    accountBalance: number,
    maxKellyPercent: number = 25
  ): number {
    const kellyPercent = ((winRate * avgWin) - ((1 - winRate) * avgLoss)) / avgWin;
    
    const safeKellyPercent = Math.max(0, Math.min(kellyPercent * 100, maxKellyPercent));
    
    return (accountBalance * safeKellyPercent) / 100;
  }

  calculateMargin(
    symbol: string,
    positionSize: number,
    entryPrice: number,
    leverage: number,
    maintenanceMarginRate: number = 0.5
  ): MarginCalculation {
    const positionValue = positionSize * entryPrice;
    
    const initialMargin = positionValue / leverage;
    
    const maintenanceMargin = positionValue * (maintenanceMarginRate / 100);
    
    const liquidationPrice = entryPrice * (1 - (initialMargin - maintenanceMargin) / positionValue);
    
    return {
      initialMargin,
      maintenanceMargin,
      availableMargin: initialMargin - maintenanceMargin,
      marginLevel: (initialMargin / maintenanceMargin) * 100,
      liquidationPrice,
      maxPositionSize: (initialMargin * leverage) / entryPrice
    };
  }

  calculateLiquidationPrice(
    entryPrice: number,
    leverage: number,
    side: 'long' | 'short',
    maintenanceMarginRate: number = 0.5
  ): number {
    if (side === 'long') {
      return entryPrice * (1 - (1 / leverage) + (maintenanceMarginRate / 100));
    } else {
      return entryPrice * (1 + (1 / leverage) - (maintenanceMarginRate / 100));
    }
  }

  validateLeverage(
    requestedLeverage: number,
    accountBalance: number,
    currentPositions: number,
    maxLeverage: number = 125
  ): { isValid: boolean; recommendedLeverage: number; reason?: string } {
    if (requestedLeverage > maxLeverage) {
      return {
        isValid: false,
        recommendedLeverage: maxLeverage,
        reason: `Leverage exceeds maximum allowed (${maxLeverage}x)`
      };
    }

    if (requestedLeverage < 1) {
      return {
        isValid: false,
        recommendedLeverage: 1,
        reason: 'Leverage must be at least 1x'
      };
    }

    const utilizationPercent = (currentPositions / accountBalance) * 100;
    if (utilizationPercent > 80 && requestedLeverage > 10) {
      return {
        isValid: false,
        recommendedLeverage: 10,
        reason: 'Account utilization too high for requested leverage'
      };
    }

    return {
      isValid: true,
      recommendedLeverage: requestedLeverage
    };
  }

  calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number
  ): { ratio: number; isAcceptable: boolean } {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    const ratio = reward / risk;

    return {
      ratio,
      isAcceptable: ratio >= 2
    };
  }

  calculateMaxDrawdown(
    equityCurve: number[]
  ): { maxDrawdown: number; maxDrawdownPercent: number; peakIndex: number; troughIndex: number } {
    let peak = equityCurve[0];
    let maxDrawdown = 0;
    let maxDrawdownPercent = 0;
    let peakIndex = 0;
    let troughIndex = 0;

    for (let i = 1; i < equityCurve.length; i++) {
      if (equityCurve[i] > peak) {
        peak = equityCurve[i];
        peakIndex = i;
      }

      const drawdown = peak - equityCurve[i];
      const drawdownPercent = (drawdown / peak) * 100;

      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
        maxDrawdownPercent = drawdownPercent;
        troughIndex = i;
      }
    }

    return {
      maxDrawdown,
      maxDrawdownPercent,
      peakIndex,
      troughIndex
    };
  }

  calculateVolatilityAdjustedPosition(
    basePositionSize: number,
    currentVolatility: number,
    normalVolatility: number,
    maxAdjustment: number = 0.5
  ): number {
    const volatilityRatio = normalVolatility / currentVolatility;
    
    const adjustmentFactor = Math.max(
      1 - maxAdjustment,
      Math.min(1 + maxAdjustment, volatilityRatio)
    );
    
    return basePositionSize * adjustmentFactor;
  }

  calculatePortfolioHeatmap(
    positions: Array<{ symbol: string; value: number; risk: number }>
  ): Array<{ symbol: string; exposurePercent: number; riskScore: number }> {
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    
    return positions.map(position => ({
      symbol: position.symbol,
      exposurePercent: (position.value / totalValue) * 100,
      riskScore: (position.risk / position.value) * 100
    }));
  }

  checkMarginCall(
    equity: number,
    usedMargin: number,
    maintenanceMargin: number
  ): { isMarginCall: boolean; marginLevel: number; deficitAmount: number } {
    const marginLevel = (equity / usedMargin) * 100;
    const requiredMarginLevel = (maintenanceMargin / usedMargin) * 100;
    const isMarginCall = marginLevel < requiredMarginLevel;
    
    const deficitAmount = isMarginCall 
      ? maintenanceMargin - equity 
      : 0;

    return {
      isMarginCall,
      marginLevel,
      deficitAmount
    };
  }

  calculateDiversificationScore(
    positions: Array<{ symbol: string; value: number; sector: string }>
  ): number {
    const totalValue = positions.reduce((sum, p) => sum + p.value, 0);
    
    const concentrationIndex = positions.reduce((sum, p) => {
      const weight = p.value / totalValue;
      return sum + (weight * weight);
    }, 0);
    
    const diversificationScore = (1 - concentrationIndex) * 100;
    
    return Math.max(0, Math.min(100, diversificationScore));
  }

  generateRiskReport(
    accountBalance: number,
    positions: Array<{ symbol: string; value: number; entryPrice: number; currentPrice: number; stopLoss: number }>,
    leverage: number
  ): {
    totalExposure: number;
    totalRisk: number;
    riskPercent: number;
    marginUsed: number;
    availableMargin: number;
    portfolioRiskScore: number;
    recommendations: string[];
  } {
    const totalExposure = positions.reduce((sum, p) => sum + p.value, 0);
    
    const totalRisk = positions.reduce((sum, p) => {
      const riskAmount = Math.abs(p.currentPrice - p.stopLoss) * (p.value / p.currentPrice);
      return sum + riskAmount;
    }, 0);
    
    const riskPercent = (totalRisk / accountBalance) * 100;
    
    const marginUsed = totalExposure / leverage;
    const availableMargin = accountBalance - marginUsed;
    
    let portfolioRiskScore = 0;
    if (riskPercent > 10) portfolioRiskScore += 40;
    else if (riskPercent > 5) portfolioRiskScore += 20;
    else portfolioRiskScore += 10;
    
    if (leverage > 10) portfolioRiskScore += 30;
    else if (leverage > 5) portfolioRiskScore += 15;
    
    if (availableMargin < accountBalance * 0.2) portfolioRiskScore += 30;
    
    const recommendations: string[] = [];
    if (riskPercent > 5) {
      recommendations.push('Portfolio risk exceeds 5% - Consider reducing position sizes');
    }
    if (leverage > 10) {
      recommendations.push('High leverage detected - Consider reducing to 5x or lower');
    }
    if (availableMargin < accountBalance * 0.2) {
      recommendations.push('Low available margin - Keep at least 20% margin available');
    }
    if (positions.length > 10) {
      recommendations.push('Many open positions - Consider focusing on fewer high-conviction trades');
    }

    return {
      totalExposure,
      totalRisk,
      riskPercent,
      marginUsed,
      availableMargin,
      portfolioRiskScore,
      recommendations
    };
  }
}

export const riskManagementSystem = new RiskManagementSystem();
