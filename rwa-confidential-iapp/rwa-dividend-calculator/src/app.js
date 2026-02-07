import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { InputParser } from './utils/inputParser.js';
import { InputValidator } from './utils/validation.js';
import { PayoutCalculator } from './models/Payout.js';
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
      writeFileSync(logPath, logMessage + '\n', { flag: 'a' });
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
    
    // --- 1. READ INPUT DATA (NO FALLBACKS) ---
    log('Reading input data...');
    const inputPath = process.env.IEXEC_IN || '/iexec_in';
    const inputFile = join(inputPath, 'input.json');
    
    try {
      const inputFileContent = readFileSync(inputFile, 'utf-8');
      inputData = JSON.parse(inputFileContent);
      log(`Input file loaded successfully (${inputFileContent.length} bytes)`);
    } catch (error) {
      log(`❌ CRITICAL: Failed to read input file: ${error.message}`, 'ERROR');
      log(`Input file path: ${inputFile}`, 'ERROR');
      throw new Error(`Input file not found or invalid. Users must provide investor addresses.`);
    }
    
    // --- 2. PARSE AND VALIDATE INPUT (STRICT VALIDATION) ---
    log('Parsing input data...');
    try {
      parsedInput = InputParser.parse(inputData);
      log(`Parsed ${parsedInput.investors.length} investors`);
    } catch (parseError) {
      log(`❌ Input parsing failed: ${parseError.message}`, 'ERROR');
      throw new Error(`Invalid input: ${parseError.message}. Please provide valid investor addresses.`);
    }
    
    // Strict validation - NO fallbacks
    log('Validating input (strict mode)...');
    const validation = InputValidator.validateCompleteInput(parsedInput);
    if (!validation.isValid) {
      log(`❌ Validation failed: ${validation.errors.join('; ')}`, 'ERROR');
      throw new Error(`Input validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Additional validation: ensure all addresses are unique
    const addresses = parsedInput.investors.map(inv => inv.address.toLowerCase());
    const uniqueAddresses = new Set(addresses);
    if (uniqueAddresses.size !== addresses.length) {
      throw new Error('Duplicate investor addresses detected. Each investor must have a unique address.');
    }
    
    log('✅ Input validation passed (strict mode)');
    log(`Total profit: ${parsedInput.totalProfit} ${parsedInput.config.currency}`);
    log(`Investor count: ${parsedInput.investors.length}`);
    log(`Tier configuration: ${TierConfig.tiers.length} tiers defined`);
    
    // --- 3. EXECUTE CONFIDENTIAL CALCULATION ---
    log('Starting confidential calculation...');
    
    const calculator = new PayoutCalculator(
      parsedInput.totalProfit,
      parsedInput.investors,
      parsedInput.config
    );
    
    const results = calculator.calculate();
    const summary = calculator.getSummary();
    
    // DEBUG: Show results structure
    console.log('\n=== DEBUG: CALCULATION RESULTS ===');
    console.log('Results length:', results.length);
    if (results.length > 0) {
      console.log('Sample result keys:', Object.keys(results[0]));
      console.log('Has investorAddress?', 'investorAddress' in results[0]);
      console.log('Has investor?', 'investor' in results[0]);
    }
    
    log('✅ Confidential calculation completed');
    log(`Total payout: ${summary.totalPayout} ${parsedInput.config.currency}`);
    log(`Allocation: ${summary.allocationPercentage}% of profits`);
    
    // --- 4. PREPARE BLOCKCHAIN CALLBACK DATA ---
    log('Preparing blockchain callback data...');
    
    // Extract investor addresses - SIMPLIFIED
    // Based on PayoutCalculator.js, results have .investorAddress property
    const investorAddresses = results.map(r => {
      if (r.investorAddress) {
        return r.investorAddress;
      } else if (r.address) {
        return r.address;
      } else if (r.investor && typeof r.investor === 'string') {
        return r.investor;
      } else {
        throw new Error(`Cannot extract address from result: ${JSON.stringify(r)}`);
      }
    });
    
    log(`✅ Extracted ${investorAddresses.length} investor addresses`);
    console.log('First address:', investorAddresses[0]);
    
    // Convert USD amounts to wei for blockchain
    const USD_TO_ETH_RATE = process.env.USD_TO_ETH_RATE ? 
      parseFloat(process.env.USD_TO_ETH_RATE) : 0.0005;
    
    log(`Using USD to ETH conversion rate: 1 USD = ${USD_TO_ETH_RATE} ETH`);
    
    const payoutAmounts = results.map(r => {
      const amountETH = r.finalPayout * USD_TO_ETH_RATE;
      return ethers.parseUnits(amountETH.toFixed(18), 18);
    });
    
    // Calculate result hash for verification
    const resultHash = ethers.keccak256(
      ethers.solidityPacked(
        ["bytes32", "bytes32"],
        [
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["address[]"], [investorAddresses])),
          ethers.keccak256(ethers.AbiCoder.defaultAbiCoder().encode(["uint256[]"], [payoutAmounts]))
        ]
      )
    );
    
    // ABI-encode data for smart contract callback
    const callbackData = ethers.AbiCoder.defaultAbiCoder().encode(
      ["address[]", "uint256[]", "bytes32"],
      [investorAddresses, payoutAmounts, resultHash]
    );
    
    log(`✅ Callback data prepared (${callbackData.length} bytes)`);
    log(`Result hash: ${resultHash}`);
    log(`Contract address: ${inputData.metadata?.callbackAddress || 'Not specified in input'}`);
    
    // --- 5. WRITE OUTPUT FILES (iExec Protocol Requirements) ---
    const outputDir = process.env.IEXEC_OUT || '/iexec_out';
    
    if (!outputDir) {
      throw new Error('IEXEC_OUT environment variable not set');
    }
    
    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });
    
    // ========== CRITICAL: iExec Protocol Required Files ==========
    
    // 1. computed.json - REQUIRED for iExec callback system
    const computedJson = {
      'deterministic-output-path': `${outputDir}/result.json`,
      'callback-data': callbackData
    };
    const computedJsonPath = join(outputDir, 'computed.json');
    writeFileSync(computedJsonPath, JSON.stringify(computedJson, null, 2));
    log(`✅ computed.json written: ${computedJsonPath}`);
    
    // 2. result.json - Main result file referenced in computed.json
    const totalPayoutWei = payoutAmounts.reduce((sum, amount) => sum + amount, 0n);
    
    const mainResult = {
      // Blockchain data (will be sent to contract)
      blockchain: {
        investors: investorAddresses,
        amounts: payoutAmounts.map(a => a.toString()),
        resultHash: resultHash,
        callbackData: callbackData,
        totalPayoutWei: totalPayoutWei.toString(),
        conversionRate: USD_TO_ETH_RATE
      },
      
      // Human readable data (for verification)
      calculation: {
        timestamp: new Date().toISOString(),
        taskId: process.env.IEXEC_TASK_ID || 'local-test',
        contractAddress: inputData.metadata?.callbackAddress || process.env.IEXEC_CALLBACK || 'not-specified',
        
        // Input summary
        totalProfitUSD: parsedInput.totalProfit,
        investorCount: parsedInput.investors.length,
        currency: parsedInput.config.currency,
        
        // Output summary
        totalPayoutUSD: summary.totalPayout,
        allocationPercentage: summary.allocationPercentage,
        tierDistribution: summary.tierDistribution
      },
      
      // Individual payouts (for audit) - FIXED
      payouts: results.map((r, i) => ({
        investor: r.investorAddress,  // FIXED: was r.investor.address
        name: r.investorName || `Investor ${i + 1}`,  // FIXED: was r.investor.name
        stakeUSD: r.originalStake,
        baseShareUSD: r.baseShare,
        finalPayoutUSD: r.finalPayout,
        finalPayoutWei: payoutAmounts[i].toString(),
        finalPayoutETH: ethers.formatUnits(payoutAmounts[i], 18),
        tier: r.tier,
        multiplier: r.multiplier
      }))
    };
    
    const resultJsonPath = join(outputDir, 'result.json');
    writeFileSync(resultJsonPath, JSON.stringify(mainResult, null, 2));
    log(`✅ result.json written: ${resultJsonPath}`);
    
    // 3. success.flag (indicates successful completion)
    const successFlagPath = join(outputDir, 'success.flag');
    writeFileSync(successFlagPath, 'COMPLETED_SUCCESSFULLY');
    
    // --- 6. FINALIZATION ---
    log('🎉 Calculation completed successfully!');
    log(`📊 Results: ${results.length} payouts calculated`);
    log(`💰 Total payout: ${summary.totalPayout} USD (${ethers.formatUnits(totalPayoutWei, 18)} ETH)`);
    log(`🔗 Smart contract callback data ready for: ${inputData.metadata?.callbackAddress || 'contract address'}`);
    log(`📤 Output files written to: ${outputDir}`);
    
    // Return success data
    return {
      success: true,
      resultHash: resultHash,
      investorCount: results.length,
      totalPayoutUSD: summary.totalPayout,
      totalPayoutWei: totalPayoutWei.toString(),
      totalPayoutETH: ethers.formatUnits(totalPayoutWei, 18),
      callbackDataSize: callbackData.length,
      investors: investorAddresses,
      amounts: payoutAmounts.map(a => a.toString()),
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    // --- ERROR HANDLING ---
    log(`❌ CRITICAL ERROR: ${error.message}`, 'ERROR');
    log(`Stack trace: ${error.stack}`, 'ERROR');
    
    // Write error to output directory
    if (process.env.IEXEC_OUT) {
      const errorPath = join(process.env.IEXEC_OUT, 'error.json');
      const errorOutput = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        inputFileExists: !!inputData,
        investorsProvided: parsedInput?.investors?.length || 0
      };
      
      writeFileSync(errorPath, JSON.stringify(errorOutput, null, 2));
      log(`📁 Error details written to: ${errorPath}`);
    }
    
    // Re-throw for iExec to handle
    throw new Error(`iApp execution failed: ${error.message}`);
  }
}

// Handle ES module command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}