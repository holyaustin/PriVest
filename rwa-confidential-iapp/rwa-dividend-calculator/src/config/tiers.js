// Configurable tier system with blockchain metadata
export const TierConfig = {
  // Tier thresholds and multipliers
  tiers: [
    {
      id: 'platinum',
      name: 'Platinum Investor',
      threshold: 1000000, // $1M+
      multiplier: 1.20,
      description: 'Top-tier investors with highest bonus',
      blockchainMetadata: {
        color: '#E5E4E2', // Platinum color
        icon: '👑',
        priority: 1
      }
    },
    {
      id: 'gold',
      name: 'Gold Investor',
      threshold: 500000, // $500K+
      multiplier: 1.15,
      description: 'Large investors with significant bonus',
      blockchainMetadata: {
        color: '#FFD700', // Gold color
        icon: '⭐',
        priority: 2
      }
    },
    {
      id: 'silver',
      name: 'Silver Investor',
      threshold: 100000, // $100K+
      multiplier: 1.10,
      description: 'Medium investors with standard bonus',
      blockchainMetadata: {
        color: '#C0C0C0', // Silver color
        icon: '🥈',
        priority: 3
      }
    },
    {
      id: 'bronze',
      name: 'Bronze Investor',
      threshold: 10000, // $10K+
      multiplier: 1.05,
      description: 'Small investors with minimal bonus',
      blockchainMetadata: {
        color: '#CD7F32', // Bronze color
        icon: '🥉',
        priority: 4
      }
    },
    {
      id: 'base',
      name: 'Base Tier',
      threshold: 0,
      multiplier: 1.00,
      description: 'Default tier for all investors',
      blockchainMetadata: {
        color: '#808080', // Gray color
        icon: '🔹',
        priority: 5
      }
    }
  ],
  
  // Additional configuration
  settings: {
    enablePerformanceBonus: true,
    maxBonusCap: 1.50, // Maximum 50% bonus
    minPayout: 1, // Minimum $1 payout
    roundingPrecision: 2, // 2 decimal places
    enableAuditLog: true,
    blockchain: {
      gasLimitPerInvestor: 50000,
      maxInvestorsPerTx: 50,
      defaultCurrency: 'ETH'
    }
  },
  
  // Blockchain utilities
  utils: {
    // Get tier for a stake amount
    getTierForStake(stake) {
      const sortedTiers = [...TierConfig.tiers].sort((a, b) => b.threshold - a.threshold);
      return sortedTiers.find(tier => stake >= tier.threshold) || TierConfig.tiers[TierConfig.tiers.length - 1];
    },
    
    // Get tier by ID
    getTierById(tierId) {
      return TierConfig.tiers.find(tier => tier.id === tierId);
    },
    
    // Calculate effective multiplier with caps
    calculateEffectiveMultiplier(baseMultiplier, performanceScore = 100) {
      const maxMultiplier = TierConfig.settings.maxBonusCap;
      const performanceBonus = 1 + ((performanceScore / 100) * 0.15);
      const effective = baseMultiplier * performanceBonus;
      return Math.min(effective, maxMultiplier);
    },
    
    // Format tier for blockchain
    formatTierForBlockchain(tier) {
      return {
        id: tier.id,
        name: tier.name,
        multiplier: tier.multiplier,
        metadata: tier.blockchainMetadata
      };
    },
    
    // Get all tiers for frontend
    getAllTiers() {
      return TierConfig.tiers.map(tier => this.formatTierForBlockchain(tier));
    }
  }
};

// Export helper functions
export const { getTierForStake, getTierById, calculateEffectiveMultiplier, formatTierForBlockchain, getAllTiers } = TierConfig.utils;