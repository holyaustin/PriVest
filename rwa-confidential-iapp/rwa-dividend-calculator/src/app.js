import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { InputParser } from './utils/inputParser.js';
import { InputValidator } from './utils/validation.js';
import { PayoutCalculator } from './models/Payout.js';
import { OutputFormatter } from './utils/outputFormatter.js';
import { TierConfig } from './config/tiers.js';
import { Constants } from './config/constants.js';
import { ethers } from 'ethers';

// Enhanced logging for TEE environment
const log = (message, level = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file in output directory
  if (process.env.IEXEC_OUT) {
    try {
      const logPath = join(process.env.IEXEC_OUT, 'execution.log');
      const existingLog = readFileSync(logPath, 'utf8').catch(() => '');
      writeFileSync(logPath, `${existingLog}${logMessage}\n`);
    } catch (error) {
      // Silently fail if log file can't be written
    }
  }
};

export default async function main() {
  let inputData;
  let parsedInput;
  
  try {
    log(`🚀 Starting ${Constants.APP_NAME} v${Constants.VERSION}`);
    log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    
    // --- 1. READ INPUT DATA ---
    log('Reading input data...');
    const inputPath = process.env.IEXEC_IN || '/iexec_in';
    const inputFile = join(inputPath, 'input.json');
    
    try {
      const inputFileContent = readFileSync(inputFile, 'utf-8');
      inputData = JSON.parse(inputFileContent);
      log(`Input file loaded successfully (${inputFileContent.length} bytes)`);
    } catch (error) {
      log(`Failed to read input file: ${error.message}`, 'ERROR');
      
      // Provide comprehensive fallback for demonstration
      log('Using demonstration data...', 'WARN');
      inputData = {
        totalProfit: 1000000,
        investors: [
          {
            address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            stake: 300000,
            name: "Early Investor A",
            metadata: { investmentDate: "2024-01-15", performanceScore: 85 }
          },
          {
            address: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
            stake: 500000,
            name: "Strategic Partner B",
            metadata: { investmentDate: "2024-02-20", performanceScore: 92 }
          },
          {
            address: "0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db",
            stake: 200000,
            name: "Venture Fund C",
            metadata: { investmentDate: "2024-03-10", performanceScore: 78 }
          }
        ],
        config: {
          enablePerformanceBonus: true,
          minPayout: 10,
          roundingPrecision: 2,
          currency: "USD"
        },
        metadata: {
          calculationId: "demo-001",
          purpose: "Hackathon demonstration"
        }
      };
    }
    
    // --- 2. PARSE AND VALIDATE INPUT ---
    log('Parsing input data...');
    try {
      parsedInput = InputParser.parse(inputData);
      log(`Parsed ${parsedInput.investors.length} investors`);
    } catch (parseError) {
      log(`Input parsing failed: ${parseError.message}`, 'ERROR');
      throw parseError;
    }
    
    // Validate input
    log('Validating input...');
    const validation = InputValidator.validateCompleteInput(parsedInput);
    if (!validation.isValid) {
      log(`Validation failed: ${validation.errors.join('; ')}`, 'ERROR');
      throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
    }
    log('Input validation passed ✓');
    
    // --- 3. EXECUTE CONFIDENTIAL CALCULATION ---
    log('Starting confidential calculation...');
    log(`Total profit: ${parsedInput.totalProfit} ${parsedInput.config.currency}`);
    log(`Investor count: ${parsedInput.investors.length}`);
    log(`Tier configuration: ${TierConfig.tiers.length} tiers defined`);
    
    const calculator = new PayoutCalculator(
      parsedInput.totalProfit,
      parsedInput.investors,
      parsedInput.config
    );
    
    const results = calculator.calculate();
    const summary = calculator.getSummary();
    
    log('Confidential calculation completed ✓');
    log(`Total payout: ${summary.totalPayout} ${parsedInput.config.currency}`);
    log(`Allocation: ${summary.allocationPercentage}% of profits`);
    
    // --- 4. FORMAT OUTPUTS FOR SMART CONTRACT CALLBACK ---
    log('Formatting outputs for smart contract callback...');
    
    // Get blockchain-formatted output
    const blockchainOutput = OutputFormatter.formatForBlockchain(results, summary);
    
    // Extract arrays for ABI encoding
    const investorAddresses = blockchainOutput.investors.map(inv => inv.address);
    const payoutAmounts = blockchainOutput.investors.map(inv => inv.amount);
    
    // Calculate result hash for verification
    const resultHash = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['address[]', 'uint256[]'],
        [investorAddresses, payoutAmounts]
      )
    );
    
    // ABI-encode data for smart contract callback
    // Format: (address[] investors, uint256[] amounts, bytes32 resultHash)
    const callbackData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address[]', 'uint256[]', 'bytes32'],
      [investorAddresses, payoutAmounts, resultHash]
    );
    
    // Human-readable output (for logs/audit)
    const humanOutput = OutputFormatter.formatForHuman(results, summary, parsedInput.config);
    
    // --- 5. WRITE ALL OUTPUT FILES ---
    const outputDir = process.env.IEXEC_OUT || '/iexec_out';
    
    if (!outputDir) {
      throw new Error('IEXEC_OUT environment variable not set');
    }
    
    // CRITICAL: Write computed.json with callback data for iExec protocol
    const computedJson = {
      'deterministic-output-path': `${outputDir}/result.json`,
      'callback-data': callbackData  // This triggers smart contract callback
    };
    const computedJsonPath = join(outputDir, 'computed.json');
    writeFileSync(computedJsonPath, JSON.stringify(computedJson, null, 2));
    log(`✅ Computed JSON written to: ${computedJsonPath}`);
    
    // Write main result file
    const mainOutputPath = join(outputDir, 'result.json');
    const finalResult = {
      investors: blockchainOutput.investors,
      resultHash: resultHash,
      totalPayout: summary.totalPayout,
      timestamp: new Date().toISOString()
    };
    writeFileSync(mainOutputPath, JSON.stringify(finalResult, null, 2));
    log(`Main result written to: ${mainOutputPath}`);
    
    // Detailed report (for debugging)
    const detailedReportPath = join(outputDir, 'detailed-report.json');
    writeFileSync(detailedReportPath, JSON.stringify(humanOutput, null, 2));
    log(`Detailed report written to: ${detailedReportPath}`);
    
    // Summary log
    const summaryPath = join(outputDir, 'summary.txt');
    const summaryText = `
PriVest Confidential Calculation Summary
========================================
Calculation ID: ${inputData.metadata?.calculationId || 'N/A'}
Timestamp: ${new Date().toISOString()}

SMART CONTRACT CALLBACK READY
-----------------------------
- Callback data prepared: YES
- Investor count: ${investorAddresses.length}
- Total payout: ${summary.totalPayout} ${parsedInput.config.currency}
- Result hash: ${resultHash}

Input Summary:
- Total Profit: ${parsedInput.totalProfit} ${parsedInput.config.currency}
- Investor Count: ${parsedInput.investors.length}

Output Summary:
- Total Payout: ${summary.totalPayout} ${parsedInput.config.currency}
- Allocation: ${summary.allocationPercentage}% of profits
- Average Payout: ${(summary.totalPayout / parsedInput.investors.length).toFixed(2)}

Tier Distribution:
${Object.entries(summary.tierDistribution).map(([tier, count]) => `  ${tier}: ${count} investors`).join('\n')}

Callback Data Length: ${callbackData.length} bytes
    `.trim();
    
    writeFileSync(summaryPath, summaryText);
    log(`Summary written to: ${summaryPath}`);
    
    // --- 6. FINALIZATION ---
    log('✅ Calculation completed successfully!');
    log(`📊 Results: ${results.length} payouts calculated`);
    log(`💰 Total payout: ${summary.totalPayout} ${parsedInput.config.currency}`);
    log(`🔗 Smart contract callback data ready (${callbackData.length} bytes)`);
    
    return {
      success: true,
      resultHash: resultHash,
      investorCount: results.length,
      totalPayout: summary.totalPayout,
      callbackDataSize: callbackData.length,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    // --- ERROR HANDLING ---
    log(`❌ Critical error: ${error.message}`, 'ERROR');
    log(`Stack trace: ${error.stack}`, 'ERROR');
    
    // Write error to output directory
    if (process.env.IEXEC_OUT) {
      const errorPath = join(process.env.IEXEC_OUT, 'error.json');
      const errorOutput = {
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        inputSummary: parsedInput ? {
          investorCount: parsedInput.investors.length,
          totalProfit: parsedInput.totalProfit
        } : 'No input parsed'
      };
      
      writeFileSync(errorPath, JSON.stringify(errorOutput, null, 2));
      log(`Error details written to: ${errorPath}`);
    }
    
    // Re-throw for iExec to handle
    throw error;
  }
}

// Handle command line execution
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}