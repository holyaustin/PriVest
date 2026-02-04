export class Investor {
  constructor(address, stake, name = '', metadata = {}) {
    this.address = address;
    this.stake = parseFloat(stake);
    this.name = name;
    this.metadata = metadata;
    this.createdAt = new Date().toISOString();
  }

  validate() {
    const errors = [];
    
    // Basic Ethereum address validation
    if (!this.address || typeof this.address !== 'string') {
      errors.push('Investor address is required');
    } else if (!this.address.match(/^0x[a-fA-F0-9]{40}$/)) {
      errors.push('Invalid Ethereum address format');
    }

    // Stake validation
    if (typeof this.stake !== 'number' || isNaN(this.stake)) {
      errors.push('Stake must be a valid number');
    } else if (this.stake <= 0) {
      errors.push('Stake must be greater than zero');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      address: this.address,
      stake: this.stake,
      name: this.name,
      metadata: this.metadata,
      createdAt: this.createdAt
    };
  }
}