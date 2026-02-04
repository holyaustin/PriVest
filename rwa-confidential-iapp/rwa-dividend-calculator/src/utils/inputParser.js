import { Investor } from '../models/Investor.js';
import { Constants } from '../config/constants.js';

export class InputParser {
  static parse(inputData) {
    try {
      let parsed;
      
      // Try to parse as JSON first
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
      if (isNaN(totalProfit) || totalProfit < Constants.MIN_PROFIT || totalProfit > Constants.MAX_PROFIT) {
        throw new Error(`Total profit must be between ${Constants.MIN_PROFIT} and ${Constants.MAX_PROFIT}`);
      }

      // Parse investors
      const investors = this.parseInvestors(parsed.investors);

      // Parse optional configuration
      const config = this.parseConfig(parsed.config);

      return {
        totalProfit,
        investors,
        config,
        metadata: parsed.metadata || {}
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
      // Support both object and array formats
      let address, stake, name, metadata;
      
      if (Array.isArray(investor)) {
        // Format: [address, stake, name, metadata]
        [address, stake, name, metadata] = investor;
      } else if (typeof investor === 'object') {
        // Format: { address, stake, name, metadata }
        ({ address, stake, name = '', metadata = {} } = investor);
      } else {
        throw new Error(`Invalid investor format at index ${index}`);
      }

      return new Investor(address, stake, name, metadata);
    });
  }

  static parseConfig(config = {}) {
    const defaults = {
      enablePerformanceBonus: true,
      minPayout: 1,
      roundingPrecision: 2,
      currency: Constants.CURRENCY,
      includeDetailedReport: false
    };

    return { ...defaults, ...config };
  }
}