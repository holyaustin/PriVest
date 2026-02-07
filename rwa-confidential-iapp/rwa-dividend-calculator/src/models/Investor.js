import { ethers } from 'ethers';

export class Investor {
  constructor(address, stake, name = '', metadata = {}) {
    this.address = this.normalizeAddress(address);
    this.stake = parseFloat(stake);
    this.name = name || this.generateDefaultName(address);
    this.metadata = {
      created: new Date().toISOString(),
      ...metadata
    };
    this.verified = false;
    this.blockchainData = {
      nonce: 0,
      lastInteraction: null,
      totalReceived: '0'
    };
  }

  // Normalize address to checksum format
  normalizeAddress(address) {
    try {
      return ethers.getAddress(address.trim());
    } catch (error) {
      throw new Error(`Invalid Ethereum address: ${address}`);
    }
  }

  // Generate default name from address
  generateDefaultName(address) {
    const shortAddress = address.slice(0, 6) + '...' + address.slice(-4);
    return `Investor_${shortAddress}`;
  }

  validate() {
    const errors = [];
    
    // Ethereum address validation
    if (!this.address || typeof this.address !== 'string') {
      errors.push('Investor address is required');
    } else {
      try {
        // Validate checksum address
        const checksum = ethers.getAddress(this.address);
        if (checksum !== this.address) {
          errors.push(`Address should be in checksum format: ${checksum}`);
        }
      } catch (error) {
        errors.push(`Invalid Ethereum address: ${this.address}`);
      }
    }

    // Stake validation
    if (typeof this.stake !== 'number' || isNaN(this.stake)) {
      errors.push('Stake must be a valid number');
    } else if (this.stake <= 0) {
      errors.push('Stake must be greater than zero');
    } else if (this.stake > 1000000000) { // 1 billion max
      errors.push('Stake exceeds maximum allowed value (1,000,000,000)');
    }

    // Metadata validation
    if (this.metadata.performanceScore !== undefined) {
      const score = this.metadata.performanceScore;
      if (score < 0 || score > 100) {
        errors.push('Performance score must be between 0 and 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Blockchain utilities
  getShortAddress() {
    return this.address.slice(0, 6) + '...' + this.address.slice(-4);
  }

  getChecksumAddress() {
    return this.address; // Already checksummed
  }

  updateBlockchainData(receivedAmount) {
    this.blockchainData.lastInteraction = new Date().toISOString();
    this.blockchainData.nonce += 1;
    
    // Add to total received
    const currentTotal = BigInt(this.blockchainData.totalReceived || '0');
    const received = BigInt(receivedAmount.toString());
    this.blockchainData.totalReceived = (currentTotal + received).toString();
  }

  toJSON() {
    return {
      address: this.address,
      stake: this.stake,
      name: this.name,
      metadata: this.metadata,
      verified: this.verified,
      blockchainData: this.blockchainData,
      createdAt: this.metadata.created
    };
  }
  
  // Static helper methods
  static fromJSON(json) {
    const investor = new Investor(json.address, json.stake, json.name, json.metadata);
    investor.verified = json.verified || false;
    investor.blockchainData = json.blockchainData || {
      nonce: 0,
      lastInteraction: null,
      totalReceived: '0'
    };
    return investor;
  }
  
  static validateAddress(address) {
    try {
      ethers.getAddress(address);
      return true;
    } catch {
      return false;
    }
  }
  
  static compareAddresses(addr1, addr2) {
    return addr1.toLowerCase() === addr2.toLowerCase();
  }
}