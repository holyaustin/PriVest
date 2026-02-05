#!/bin/bash
# scripts/simple-test.sh

echo "🚀 Simple iApp Test"

# Create minimal test input
echo '{"totalProfit":1000000,"investors":[["0x1234567890123456789012345678901234567890",500000],["0x0987654321098765432109876543210987654321",500000]]}' > test.json

echo "Test input created"
cat test.json
echo ""

# Run test with CORRECT argument
echo "Testing..."
iapp test --inputFile test.json

# Check results
if [ $? -eq 0 ]; then
  echo "✅ Success!"
  if [ -f "iexec_out/output.json" ]; then
    echo "Output:"
    cat iexec_out/output.json
  fi
else
  echo "❌ Failed"
fi