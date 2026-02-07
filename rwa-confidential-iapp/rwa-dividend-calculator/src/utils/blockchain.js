import { ethers } from 'ethers';

export class BlockchainUtils {
  /**
   * Convert USD amount to wei using conversion rate
   * @param {number} usdAmount - Amount in USD
   * @param {number} usdToEthRate - Conversion rate (1 USD = X ETH)
   * @returns {bigint} Amount in wei
   */
  static usdToWei(usdAmount, usdToEthRate = 0.0005) {
    const ethAmount = usdAmount * usdToEthRate;
    return ethers.parseUnits(ethAmount.toFixed(18), 18);
  }

  /**
   * Convert wei to USD using conversion rate
   * @param {bigint} weiAmount - Amount in wei
   * @param {number} usdToEthRate - Conversion rate (1 USD = X ETH)
   * @returns {number} Amount in USD
   */
  static weiToUsd(weiAmount, usdToEthRate = 0.0005) {
    const ethAmount = parseFloat(ethers.formatUnits(weiAmount, 18));
    return ethAmount / usdToEthRate;
  }

  /**
   * Calculate result hash for verification
   * @param {string[]} investorAddresses - Array of investor addresses
   * @param {bigint[]} payoutAmounts - Array of payout amounts in wei
   * @returns {string} Result hash
   */
  static calculateResultHash(investorAddresses, payoutAmounts) {
    return ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [investorAddresses])),
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [payoutAmounts]))
        ]
      )
    );
  }

  /**
   * Encode data for smart contract callback
   * @param {string[]} investorAddresses - Array of investor addresses
   * @param {bigint[]} payoutAmounts - Array of payout amounts in wei
   * @param {string} resultHash - Result hash for verification
   * @returns {string} ABI-encoded callback data
   */
  static encodeCallbackData(investorAddresses, payoutAmounts, resultHash) {
    return ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256[]", "bytes32"],
      [investorAddresses, payoutAmounts, resultHash]
    );
  }

  /**
   * Decode callback data from smart contract
   * @param {string} callbackData - ABI-encoded callback data
   * @returns {Object} Decoded data
   */
  static decodeCallbackData(callbackData) {
    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["address[]", "uint256[]", "bytes32"],
      callbackData
    );
    
    return {
      investors: decoded[0],
      amounts: decoded[1],
      resultHash: decoded[2]
    };
  }

  /**
   * Validate callback data
   * @param {string} callbackData - ABI-encoded callback data
   * @returns {Object} Validation result
   */
  static validateCallbackData(callbackData) {
    try {
      const decoded = this.decodeCallbackData(callbackData);
      
      // Validate arrays
      if (!Array.isArray(decoded.investors) || decoded.investors.length === 0) {
        return { isValid: false, error: 'No investors in callback data' };
      }
      
      if (!Array.isArray(decoded.amounts) || decoded.amounts.length === 0) {
        return { isValid: false, error: 'No amounts in callback data' };
      }
      
      if (decoded.investors.length !== decoded.amounts.length) {
        return { isValid: false, error: 'Investor and amount count mismatch' };
      }
      
      // Validate addresses
      for (const address of decoded.investors) {
        try {
          ethers.getAddress(address);
        } catch (error) {
          return { isValid: false, error: `Invalid address: ${address}` };
        }
      }
      
      // Validate amounts
      for (const amount of decoded.amounts) {
        if (amount <= 0n) {
          return { isValid: false, error: 'Non-positive amount found' };
        }
      }
      
      // Recalculate hash to verify
      const calculatedHash = this.calculateResultHash(decoded.investors, decoded.amounts);
      if (calculatedHash !== decoded.resultHash) {
        return { isValid: false, error: 'Result hash mismatch' };
      }
      
      return {
        isValid: true,
        data: decoded
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid callback data: ${error.message}`
      };
    }
  }

  /**
   * Generate Ethereum transaction data for manual submission
   */
  static generateTransactionData(investorAddresses, payoutAmounts, resultHash) {
    const callbackData = this.encodeCallbackData(investorAddresses, payoutAmounts, resultHash);
    
    return {
      to: '0xYOUR_CONTRACT_ADDRESS', // Should be set by frontend
      data: callbackData,
      value: '0', // No ETH sent with this call
      gasLimit: 1000000 + (investorAddresses.length * 50000), // Estimate gas
    };
  }

  /**
   * Format blockchain response for logging
   */
  static formatBlockchainResponse(txHash, investorCount, totalWei) {
    const totalEth = ethers.formatUnits(totalWei, 18);
    
    return {
      transactionHash: txHash,
      investorCount,
      totalAmount: {
        wei: totalWei.toString(),
        eth: totalEth,
        formatted: `${totalEth} ETH`
      },
      timestamp: new Date().toISOString(),
      explorerUrl: `https://sepolia.arbiscan.io/tx/${txHash}`
    };
  }
}