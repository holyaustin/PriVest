// Configurable tier system - can be modified without code changes
export const TierConfig = {
  // Tier thresholds and multipliers
  tiers: [
    {
      id: 'platinum',
      name: 'Platinum Investor',
      threshold: 1000000, // $1M+
      multiplier: 1.20,
      description: 'Top-tier investors with highest bonus'
    },
    {
      id: 'gold',
      name: 'Gold Investor',
      threshold: 500000, // $500K+
      multiplier: 1.15,
      description: 'Large investors with significant bonus'
    },
    {
      id: 'silver',
      name: 'Silver Investor',
      threshold: 100000, // $100K+
      multiplier: 1.10,
      description: 'Medium investors with standard bonus'
    },
    {
      id: 'bronze',
      name: 'Bronze Investor',
      threshold: 10000, // $10K+
      multiplier: 1.05,
      description: 'Small investors with minimal bonus'
    },
    {
      id: 'base',
      name: 'Base Tier',
      threshold: 0,
      multiplier: 1.00,
      description: 'Default tier for all investors'
    }
  ],
  
  // Additional configuration
  settings: {
    enablePerformanceBonus: true,
    maxBonusCap: 1.50, // Maximum 50% bonus
    minPayout: 1, // Minimum $1 payout
    roundingPrecision: 2, // 2 decimal places
    enableAuditLog: true
  }
};

// Helper function to get tier for a stake amount
export function getTierForStake(stake) {
  const sortedTiers = [...TierConfig.tiers].sort((a, b) => b.threshold - a.threshold);
  return sortedTiers.find(tier => stake >= tier.threshold) || TierConfig.tiers[TierConfig.tiers.length - 1];
}