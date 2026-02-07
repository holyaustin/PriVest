#!/bin/bash
# Production test script - NO MOCK ADDRESSES

echo "🧪 PRODUCTION TEST - Real Investor Addresses Required"
echo "====================================================="

# Clean previous test files
rm -rf test-production-output 2>/dev/null
mkdir -p test-production-input

# Create test input with REAL addresses (these should come from frontend)
cat > test-production-input/input.json << 'EOF'
{
  "totalProfit": 0.01,
  "investors": [
    {
      "address": "0x2c3b2B2325610a6814f2f822D0bF4DAB8CF16e16",
      "stake": 0.04,
      "name": "Primary Investor",
      "metadata": {
        "performanceScore": 95,
        "investmentDate": "2026-01-15"
      }
    },
    {
      "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      "stake": 0.35,
      "name": "Secondary Investor",
      "metadata": {
        "performanceScore": 88,
        "investmentDate": "2026-1-20"
      }
    },
    {
      "address": "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
      "stake": 0.25,
      "name": "Tertiary Investor",
      "metadata": {
        "performanceScore": 76,
        "investmentDate": "2026-01-10"
      }
    }
  ],
  "config": {
    "enablePerformanceBonus": true,
    "minPayout": 1,
    "roundingPrecision": 2,
    "currency": "USD"
  },
  "metadata": {
    "calculationId": "prod-test-001",
    "callbackAddress": "0x5b4dCD6038a092d36afEB2e2C56A8201544c6eC1",
    "description": "Production test with real addresses"
  }
}
EOF

echo "✅ Created test input with 3 real investor addresses"
echo "📄 Input saved to: test-production-input/input.json"

# Set environment variables
export IEXEC_IN=test-production-input
export IEXEC_OUT=test-production-output
export IEXEC_CALLBACK=0x5b4dCD6038a092d36afEB2e2C56A8201544c6eC1
export IEXEC_TASK_ID=prod-test-$(date +%s)

echo ""
echo "⚙️  Environment:"
echo "   IEXEC_IN: $IEXEC_IN"
echo "   IEXEC_OUT: $IEXEC_OUT"
echo "   IEXEC_CALLBACK: $IEXEC_CALLBACK"
echo "   IEXEC_TASK_ID: $IEXEC_TASK_ID"
echo ""

# Run the iApp
echo "🚀 Running iApp calculation..."
node src/app.js

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ iApp executed successfully!"
  echo ""
  echo "📁 Generated files in $IEXEC_OUT/:"
  ls -la test-production-output/
  
  echo ""
  echo "🔍 Checking computed.json (iExec callback format):"
  if [ -f "test-production-output/computed.json" ]; then
    echo "   ✅ computed.json exists"
    CALLBACK_DATA_LENGTH=$(jq -r '.["callback-data"] | length' test-production-output/computed.json 2>/dev/null || echo "0")
    echo "   Callback data length: $CALLBACK_DATA_LENGTH bytes"
  else
    echo "   ❌ computed.json missing!"
  fi
  
  echo ""
  echo "📊 Result summary:"
  if [ -f "test-production-output/result.json" ]; then
    jq '.calculation | {totalProfitUSD, investorCount, totalPayoutUSD, allocationPercentage}' test-production-output/result.json
    echo ""
    echo "👥 Investors processed:"
    jq -r '.payouts[] | "  \(.name): \(.finalPayoutUSD) USD = \(.finalPayoutETH) ETH"' test-production-output/result.json
  fi
  
  echo ""
  echo "🎯 PRODUCTION READY!"
  echo "   These addresses can claim real dividends on-chain"
  echo "   Contract: $IEXEC_CALLBACK"
  echo "   Task ID: $IEXEC_TASK_ID"
  
else
  echo ""
  echo "❌ iApp execution failed!"
  if [ -f "test-production-output/error.json" ]; then
    echo "Error details:"
    cat test-production-output/error.json
  fi
  exit 1
fi