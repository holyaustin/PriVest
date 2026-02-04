import { Constants } from '../config/constants.js';

export class InputValidator {
  static validateCompleteInput(parsedInput) {
    const errors = [];
    
    // Check total profit
    if (parsedInput.totalProfit <= 0) {
      errors.push('Total profit must be positive');
    }

    // Check investor count
    if (parsedInput.investors.length === 0) {
      errors.push('At least one investor required');
    }

    if (parsedInput.investors.length > Constants.MAX_INVESTORS) {
      errors.push(`Exceeds maximum investor limit of ${Constants.MAX_INVESTORS}`);
    }

    // Validate each investor
    parsedInput.investors.forEach((investor, index) => {
      const validation = investor.validate();
      if (!validation.isValid) {
        errors.push(`Investor ${index + 1}: ${validation.errors.join(', ')}`);
      }
    });

    // Check for duplicate addresses
    const addresses = parsedInput.investors.map(inv => inv.address.toLowerCase());
    const uniqueAddresses = new Set(addresses);
    if (uniqueAddresses.size !== addresses.length) {
      errors.push('Duplicate investor addresses detected');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeInput(inputData) {
    // Remove any extra whitespace from addresses
    if (inputData.investors && Array.isArray(inputData.investors)) {
      inputData.investors = inputData.investors.map(investor => {
        if (typeof investor === 'object' && investor.address) {
          investor.address = investor.address.trim();
        }
        return investor;
      });
    }

    return inputData;
  }
}