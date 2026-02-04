import { Constants } from '../config/constants.js';

export class OutputFormatter {
  static formatForBlockchain(results, summary, includePrivateData = false) {
    // Prepare minimal data for on-chain storage
    const blockchainOutput = {
      version: Constants.OUTPUT_FORMAT_VERSION,
      timestamp: new Date().toISOString(),
      investors: results.map(r => r.investor),
      amounts: results.map(r => r.finalPayout),
      totalPayout: summary.totalPayout,
      investorCount: summary.investorCount,
      resultHash: this.calculateResultHash(results)
    };

    // Include detailed data only if requested (for debugging/auditing)
    if (includePrivateData) {
      blockchainOutput.detailedResults = results;
      blockchainOutput.summary = summary;
    }

    return blockchainOutput;
  }

  static formatForHuman(results, summary, config) {
    // Human-readable output
    return {
      header: {
        app: Constants.APP_NAME,
        version: Constants.VERSION,
        timestamp: new Date().toISOString(),
        currency: config.currency
      },
      summary: {
        totalProfit: summary.totalProfit,
        totalPayout: summary.totalPayout,
        allocationPercentage: summary.allocationPercentage,
        investorCount: summary.investorCount,
        tierDistribution: summary.tierDistribution
      },
      payouts: results.map(result => ({
        investor: result.investor,
        name: result.metadata.name || 'Unknown',
        originalStake: result.originalStake,
        finalPayout: result.finalPayout,
        tier: result.tier,
        effectiveBonus: `${(result.effectiveBonus * 100 - 100).toFixed(2)}%`
      })),
      metadata: {
        calculationTime: new Date().toISOString(),
        configUsed: config
      }
    };
  }

  static calculateResultHash(results) {
    // Create a deterministic hash of results for verification
    const dataToHash = results
      .map(r => `${r.investor}:${r.finalPayout}`)
      .sort()
      .join('|');
    
    // Simple hash - in production, use crypto-js SHA256
    let hash = 0;
    for (let i = 0; i < dataToHash.length; i++) {
      const char = dataToHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }
}