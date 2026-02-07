// Application constants
export const Constants = {
  // Application info
  APP_NAME: 'PriVest Confidential Dividend Calculator',
  VERSION: '1.0.0',
  AUTHOR: 'PriVest Team',
  LICENSE: 'MIT',
  
  // Limits
  MAX_INVESTORS: 100,
  MIN_PROFIT: 0.01,
  MAX_PROFIT: 1000000000, // 1 billion USD
  
  // Blockchain settings
  DEFAULT_USD_TO_ETH_RATE: 0.0005, // 1 USD = 0.0005 ETH (demo rate)
  MIN_ETH_PAYOUT: 0.000001, // Minimum 0.000001 ETH payout
  DEFAULT_GAS_LIMIT: 1000000,
  
  // Currency
  CURRENCY: 'USD',
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP'],
  
  // Output
  OUTPUT_FORMAT_VERSION: '1.0',
  REQUIRED_OUTPUT_FILES: ['computed.json', 'result.json'],
  
  // Security
  MIN_PASSWORD_LENGTH: 12,
  MAX_INPUT_SIZE: 1024 * 1024, // 1MB max input
  ENCRYPTION_ALGORITHM: 'AES-256-GCM',
  
  // iExec settings
  IEXEC_CATEGORY: 0,
  IEXEC_TAG: 'tee,scone',
  IEXEC_TIMEOUT: 300, // 5 minutes
  
  // Validation
  ETH_ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  AMOUNT_REGEX: /^\d+(\.\d{1,18})?$/,
  
  // Logging
  LOG_LEVELS: ['DEBUG', 'INFO', 'WARN', 'ERROR'],
  DEFAULT_LOG_LEVEL: 'INFO'
};

// Helper functions
export const Helpers = {
  isProduction: () => process.env.NODE_ENV === 'production',
  
  validateEthAddress: (address) => {
    try {
      const { ethers } = require('ethers');
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  },
  
  formatWeiToEth: (wei) => {
    const { ethers } = require('ethers');
    return ethers.formatUnits(wei, 18);
  },
  
  formatEthToWei: (eth) => {
    const { ethers } = require('ethers');
    return ethers.parseUnits(eth.toString(), 18);
  },
  
  generateTaskId: () => {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },
  
  sanitizeInput: (input) => {
    if (typeof input === 'string') {
      return input.trim().replace(/\s+/g, ' ');
    }
    return input;
  }
};