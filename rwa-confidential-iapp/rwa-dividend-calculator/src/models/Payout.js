import { TierConfig, getTierForStake } from '../config/tiers.js';

export class PayoutCalculator {
  constructor(totalProfit, investors, options = {}) {
    this.totalProfit = parseFloat(totalProfit);
    this.investors = investors;
    this.options = {
      enablePerformanceBonus: options.enablePerformanceBonus !== false,
      minPayout: options.minPayout || 1,
      roundingPrecision: options.roundingPrecision || 2,
      ...options
    };
    this.results = [];
  }

  calculate() {
    this.validateInputs();
    
    const totalStake = this.investors.reduce((sum, investor) => sum + investor.stake, 0);
    
    if (totalStake === 0) {
      throw new Error('Total stake cannot be zero');
    }

    this.results = this.investors.map(investor => {
      const baseShare = (investor.stake / totalStake) * this.totalProfit;
      const tier = getTierForStake(investor.stake);
      
      // Apply tier multiplier
      let finalPayout = baseShare * tier.multiplier;
      
      // Apply performance bonus if enabled (confidential logic)
      if (this.options.enablePerformanceBonus && investor.metadata.performanceScore) {
        const performanceBonus = this.calculatePerformanceBonus(
          investor.metadata.performanceScore,
          investor.stake
        );
        finalPayout *= performanceBonus;
      }

      // Apply bonus cap
      const maxBonus = TierConfig.settings.maxBonusCap;
      const effectiveBonus = Math.min(
        finalPayout / baseShare,
        maxBonus
      );
      finalPayout = baseShare * effectiveBonus;

      // Apply minimum payout
      finalPayout = Math.max(finalPayout, this.options.minPayout);

      // Round to specified precision
      finalPayout = this.round(finalPayout, this.options.roundingPrecision);

      return {
        investor: investor.address,
        originalStake: investor.stake,
        baseShare: this.round(baseShare, this.options.roundingPrecision),
        finalPayout: finalPayout,
        tier: tier.id,
        multiplier: tier.multiplier,
        effectiveBonus: this.round(effectiveBonus, 4),
        metadata: {
          name: investor.name,
          ...investor.metadata
        }
      };
    });

    return this.results;
  }

  calculatePerformanceBonus(score, stake) {
    // Confidential performance calculation formula
    // This is the proprietary logic that stays in the TEE
    const baseScore = Math.min(Math.max(score, 0), 100) / 100;
    const stakeFactor = Math.log10(stake + 1) / Math.log10(1000000);
    
    // Complex confidential formula
    return 1 + (baseScore * 0.15) + (stakeFactor * 0.05);
  }

  round(value, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }

  validateInputs() {
    if (this.totalProfit <= 0) {
      throw new Error('Total profit must be greater than zero');
    }

    if (!Array.isArray(this.investors) || this.investors.length === 0) {
      throw new Error('Investors array is required and cannot be empty');
    }

    // Validate each investor
    this.investors.forEach((investor, index) => {
      const validation = investor.validate();
      if (!validation.isValid) {
        throw new Error(`Investor ${index + 1} validation failed: ${validation.errors.join(', ')}`);
      }
    });
  }

  getSummary() {
    const totalPayout = this.results.reduce((sum, result) => sum + result.finalPayout, 0);
    const allocation = (totalPayout / this.totalProfit) * 100;
    
    const tierDistribution = {};
    this.results.forEach(result => {
      tierDistribution[result.tier] = (tierDistribution[result.tier] || 0) + 1;
    });

    return {
      totalProfit: this.totalProfit,
      totalPayout: this.round(totalPayout, 2),
      allocationPercentage: this.round(allocation, 2),
      investorCount: this.investors.length,
      tierDistribution,
      timestamp: new Date().toISOString()
    };
  }
}