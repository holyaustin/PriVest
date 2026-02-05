export class OutputFormatter {
  /**
   * Format results for blockchain consumption
   * @param {Array} results - Array of payout results from PayoutCalculator
   * @param {Object} summary - Summary object from PayoutCalculator
   * @returns {Object} Formatted for blockchain callback
   */
  static formatForBlockchain(results, summary) {
    return {
      investors: results.map(r => ({
        address: r.address,
        amount: r.finalAmount,
        name: r.name || 'Unknown',
        tier: r.tier || 'Unknown'
      })),
      summary: {
        totalPayout: summary.totalPayout,
        allocationPercentage: summary.allocationPercentage,
        investorCount: results.length
      }
    };
  }

  /**
   * Format results for human-readable audit logs
   * @param {Array} results - Array of payout results
   * @param {Object} summary - Summary object
   * @param {Object} config - Configuration object
   * @returns {Object} Detailed human-readable output
   */
  static formatForHuman(results, summary, config) {
    return {
      calculationDetails: {
        timestamp: new Date().toISOString(),
        currency: config.currency,
        configUsed: config
      },
      investors: results.map(r => ({
        name: r.name,
        address: r.address,
        rawStake: r.rawStake,
        stakePercentage: r.stakePercentage,
        basePayout: r.basePayout,
        tierBonus: r.tierBonus,
        performanceBonus: r.performanceBonus,
        finalAmount: r.finalAmount,
        tier: r.tier,
        formattedAmount: `${r.finalAmount.toFixed(config.roundingPrecision)} ${config.currency}`
      })),
      summary: {
        totalProfit: summary.totalProfit,
        totalPayout: summary.totalPayout,
        allocationPercentage: summary.allocationPercentage,
        averagePayout: summary.totalPayout / results.length,
        tierDistribution: summary.tierDistribution,
        formattedTotal: `${summary.totalPayout.toFixed(config.roundingPrecision)} ${config.currency}`
      }
    };
  }
}