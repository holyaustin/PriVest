import { ethers } from 'ethers';

export class OutputFormatter {
  /**
   * Format results for iExec blockchain callback
   * @param {Array} results - Array of payout results from PayoutCalculator
   * @param {number} usdToEthRate - Conversion rate from USD to ETH
   * @returns {Object} Formatted for iExec computed.json
   */
  static formatForBlockchainCallback(results, usdToEthRate = 0.0005) {
    // Extract investor addresses
    const investorAddresses = results.map(r => r.investorAddress);
    
    // Convert USD amounts to wei
    const payoutAmountsWei = results.map(r => {
      const amountETH = r.finalPayout * usdToEthRate;
      return ethers.parseUnits(amountETH.toFixed(18), 18);
    });
    
    // Calculate result hash (must match smart contract)
    const resultHash = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [investorAddresses])),
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [payoutAmountsWei]))
        ]
      )
    );
    
    // ABI-encode for smart contract callback
    const callbackData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256[]", "bytes32"],
      [investorAddresses, payoutAmountsWei, resultHash]
    );
    
    // Format for iExec computed.json
    return {
      computedJson: {
        'deterministic-output-path': '/iexec_out/result.json',
        'callback-data': callbackData
      },
      blockchainData: {
        investorAddresses,
        payoutAmountsWei,
        resultHash,
        totalPayoutWei: payoutAmountsWei.reduce((sum, amount) => sum + amount, 0n),
        usdToEthRate
      },
      callbackData: callbackData
    };
  }

  /**
   * Format results for human-readable output
   * @param {Array} results - Array of payout results
   * @param {Object} summary - Summary object from PayoutCalculator
   * @param {Object} config - Configuration object
   * @param {number} usdToEthRate - USD to ETH conversion rate
   * @returns {Object} Detailed human-readable output
   */
  static formatForHuman(results, summary, config, usdToEthRate = 0.0005) {
    const totalPayoutWei = results.reduce((sum, result) => {
      const amountETH = result.finalPayout * usdToEthRate;
      return sum + ethers.parseUnits(amountETH.toFixed(18), 18);
    }, 0n);
    
    return {
      calculationDetails: {
        timestamp: new Date().toISOString(),
        currency: config.currency,
        configUsed: config,
        usdToEthRate: usdToEthRate
      },
      investors: results.map((r, index) => {
        const amountETH = r.finalPayout * usdToEthRate;
        const amountWei = ethers.parseUnits(amountETH.toFixed(18), 18);
        
        return {
          index: index + 1,
          name: r.investorName,
          address: r.investorAddress,
          rawStake: r.originalStake,
          stakePercentage: (r.originalStake / summary.totalProfit) * 100,
          basePayout: r.baseShare,
          tierBonus: r.multiplier,
          performanceBonus: r.effectiveBonus,
          finalAmountUSD: r.finalPayout,
          finalAmountETH: amountETH,
          finalAmountWei: amountWei.toString(),
          tier: r.tier,
          formattedAmountUSD: `${r.finalPayout.toFixed(config.roundingPrecision)} ${config.currency}`,
          formattedAmountETH: `${amountETH.toFixed(6)} ETH`,
          metadata: r.metadata
        };
      }),
      summary: {
        totalProfit: summary.totalProfit,
        totalPayoutUSD: summary.totalPayout,
        totalPayoutETH: ethers.formatUnits(totalPayoutWei, 18),
        totalPayoutWei: totalPayoutWei.toString(),
        allocationPercentage: summary.allocationPercentage,
        averagePayoutUSD: summary.totalPayout / results.length,
        tierDistribution: summary.tierDistribution,
        formattedTotalUSD: `${summary.totalPayout.toFixed(config.roundingPrecision)} ${config.currency}`,
        formattedTotalETH: `${ethers.formatUnits(totalPayoutWei, 18)} ETH`,
        investorCount: results.length
      }
    };
  }

  /**
   * Create comprehensive result.json file
   */
  static createResultJson(results, summary, config, usdToEthRate, taskId, callbackAddress) {
    const blockchainFormat = this.formatForBlockchainCallback(results, usdToEthRate);
    const humanFormat = this.formatForHuman(results, summary, config, usdToEthRate);
    
    return {
      // Blockchain section (for verification)
      blockchain: {
        ...blockchainFormat.blockchainData,
        callbackDataLength: blockchainFormat.callbackData.length,
        contractAddress: callbackAddress || 'not-specified',
        taskId: taskId || 'local-test'
      },
      
      // Human readable section
      calculation: humanFormat.calculationDetails,
      summary: humanFormat.summary,
      investors: humanFormat.investors,
      
      // Metadata
      metadata: {
        version: '1.0.0',
        appName: 'PriVest Dividend Calculator',
        timestamp: new Date().toISOString(),
        privacyLevel: 'tee-scone'
      }
    };
  }

  /**
   * Create summary.txt file
   */
  static createSummaryText(results, summary, config, usdToEthRate, taskId, callbackAddress) {
    const humanFormat = this.formatForHuman(results, summary, config, usdToEthRate);
    
    return `
PRI̲VEST CONFIDENTIAL DIVIDEND CALCULATION
===========================================

CALCULATION SUMMARY
───────────────────
• Task ID: ${taskId || 'local-test'}
• Timestamp: ${new Date().toISOString()}
• Contract: ${callbackAddress || 'Not specified'}
• Total Profit: ${summary.totalProfit.toLocaleString()} ${config.currency}
• Total Payout: ${humanFormat.summary.formattedTotalUSD}
• Allocation: ${summary.allocationPercentage.toFixed(2)}%
• Investor Count: ${results.length}

INVESTOR PAYOUTS
────────────────
${humanFormat.investors.map(inv => 
  `• ${inv.name || 'Investor'}: ${inv.formattedAmountUSD} = ${inv.formattedAmountETH}`
).join('\n')}

TIER DISTRIBUTION
─────────────────
${Object.entries(summary.tierDistribution).map(([tier, count]) => 
  `• ${tier}: ${count} investor${count > 1 ? 's' : ''}`
).join('\n')}

BLOCKCHAIN DATA
───────────────
• Result Hash: ${this.formatForBlockchainCallback(results, usdToEthRate).blockchainData.resultHash.slice(0, 32)}...
• Callback Data Size: ${this.formatForBlockchainCallback(results, usdToEthRate).callbackData.length} bytes
• USD to ETH Rate: ${usdToEthRate}

✅ COMPUTATION COMPLETE
The iExec protocol will automatically send payout data to the smart contract.

🔒 PRIVACY GUARANTEE
• All calculations performed in TEE ✓
• Input data never exposed ✓
• Only final payouts revealed ✓
`.trim();
  }
}