import { Investor } from '../models/Investor.js';
import { Constants } from '../config/constants.js';
import { ethers } from 'ethers';

export class InputParser {
  static parse(inputData) {
    try {
      let parsed;
      
      // Parse JSON
      if (typeof inputData === 'string') {
        parsed = JSON.parse(inputData);
      } else if (typeof inputData === 'object') {
        parsed = inputData;
      } else {
        throw new Error('Input must be JSON string or object');
      }

      // Validate required fields
      this.validateInputStructure(parsed);

      // Parse total profit
      const totalProfit = parseFloat(parsed.totalProfit);
      if (isNaN(totalProfit) || totalProfit <= 0) {
        throw new Error(`Total profit must be a positive number`);
      }
      if (totalProfit > Constants.MAX_PROFIT) {
        throw new Error(`Total profit exceeds maximum allowed: ${Constants.MAX_PROFIT}`);
      }

      // Parse investors (STRICT - no defaults)
      const investors = this.parseInvestors(parsed.investors);

      // Parse configuration
      const config = this.parseConfig(parsed.config);

      // Validate callback address if provided
      let callbackAddress = null;
      if (parsed.metadata?.callbackAddress) {
        try {
          callbackAddress = ethers.getAddress(parsed.metadata.callbackAddress);
        } catch (error) {
          throw new Error(`Invalid callback address: ${parsed.metadata.callbackAddress}`);
        }
      }

      return {
        totalProfit,
        investors,
        config,
        metadata: {
          ...parsed.metadata,
          callbackAddress
        }
      };
    } catch (error) {
      throw new Error(`Input parsing failed: ${error.message}`);
    }
  }

  static validateInputStructure(data) {
    const requiredFields = ['totalProfit', 'investors'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    if (!Array.isArray(data.investors) || data.investors.length === 0) {
      throw new Error('Investors must be a non-empty array');
    }

    if (data.investors.length > Constants.MAX_INVESTORS) {
      throw new Error(`Maximum ${Constants.MAX_INVESTORS} investors allowed`);
    }
  }

  static parseInvestors(investorData) {
    return investorData.map((investor, index) => {
      let address, stake, name, metadata;
      
      if (Array.isArray(investor)) {
        // Format: [address, stake, name, metadata]
        [address, stake, name, metadata] = investor;
        if (!address) throw new Error(`Missing address for investor ${index + 1}`);
        metadata = metadata || {};
      } else if (typeof investor === 'object') {
        // Format: { address, stake, name, metadata }
        ({ address, stake, name = '', metadata = {} } = investor);
        if (!address) throw new Error(`Missing address for investor ${index + 1}`);
      } else {
        throw new Error(`Invalid investor format at index ${index}`);
      }

      // Validate and convert address to checksum
      try {
        address = ethers.getAddress(address);
      } catch (error) {
        throw new Error(`Invalid Ethereum address for investor ${index + 1}: ${address}`);
      }

      // Validate stake
      const stakeNum = parseFloat(stake);
      if (isNaN(stakeNum) || stakeNum <= 0) {
        throw new Error(`Invalid stake for investor ${index + 1}: ${stake}. Must be positive number`);
      }

      return new Investor(address, stakeNum, name, metadata);
    });
  }

  static parseConfig(config = {}) {
    // No defaults - user must provide valid config
    if (!config.currency) {
      throw new Error('Currency must be specified in config');
    }

    return {
      enablePerformanceBonus: config.enablePerformanceBonus !== false,
      minPayout: config.minPayout || 1,
      roundingPrecision: config.roundingPrecision || 2,
      currency: config.currency,
      includeDetailedReport: config.includeDetailedReport || false
    };
  }
}