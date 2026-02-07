import { Constants } from '../config/constants.js';
import { ethers } from 'ethers';

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

    // Validate callback address if provided
    if (parsedInput.metadata?.callbackAddress) {
      try {
        ethers.getAddress(parsedInput.metadata.callbackAddress);
      } catch (error) {
        errors.push(`Invalid callback address: ${parsedInput.metadata.callbackAddress}`);
      }
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

  // Validate blockchain callback data
  static validateCallbackData(callbackData) {
    try {
      // Try to decode the callback data
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address[]", "uint256[]", "bytes32"],
        callbackData
      );
      
      const [investors, amounts, resultHash] = decoded;
      
      if (!Array.isArray(investors) || investors.length === 0) {
        return { isValid: false, error: 'No investors in callback data' };
      }
      
      if (!Array.isArray(amounts) || amounts.length === 0) {
        return { isValid: false, error: 'No amounts in callback data' };
      }
      
      if (investors.length !== amounts.length) {
        return { isValid: false, error: 'Investor and amount count mismatch' };
      }
      
      // Verify all addresses are valid
      for (const address of investors) {
        try {
          ethers.getAddress(address);
        } catch (error) {
          return { isValid: false, error: `Invalid address in callback: ${address}` };
        }
      }
      
      // Verify all amounts are positive
      for (const amount of amounts) {
        if (amount <= 0n) {
          return { isValid: false, error: 'Non-positive amount in callback' };
        }
      }
      
      return {
        isValid: true,
        data: { investors, amounts, resultHash }
      };
      
    } catch (error) {
      return {
        isValid: false,
        error: `Invalid callback data format: ${error.message}`
      };
    }
  }
}