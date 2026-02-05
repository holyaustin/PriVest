#!/bin/bash
# scripts/test-iexec.sh - CORRECTED VERSION

echo "🧪 Testing with iExec CLI..."

# Clean previous test files
rm -rf test-input iexec_out 2>/dev/null

# Create test input directory
mkdir -p test-input

# Create the input JSON file
cat > test-input/input.json << 'EOF'
{
  "totalProfit": 1000000,
  "investors": [
    ["0x71C7656EC7ab88b098defB751B7401B5f6d8976F", 400000, "Investor A"],
    ["0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B", 350000, "Investor B"],
    ["0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db", 250000, "Investor C"]
  ],
  "config": {
    "currency": "USD"
  }
}
EOF

echo "✅ Created test input at test-input/input.json"
echo "File content:"
cat test-input/input.json
echo ""

# Run local test with iApp CLI - CORRECTED COMMAND
echo "Running local test..."
echo "Command: iapp test --inputFile test-input/input.json"
echo ""

# Run the test with correct argument
iapp test --inputFile test-input/input.json

# Check if the command succeeded
if [ $? -eq 0 ]; then
  echo "✅ Local test passed!"
  
  # Check outputs
  echo ""
  echo "📊 Generated outputs in iexec_out/:"
  ls -la iexec_out/ 2>/dev/null || echo "No iexec_out directory found"
  
  echo ""
  echo "📄 Checking for output files..."
  
  if [ -f "iexec_out/output.json" ]; then
    echo "Main output (first 10 lines):"
    head -20 iexec_out/output.json
  else
    echo "No output.json found"
  fi
  
  echo ""
  if [ -f "iexec_out/summary.txt" ]; then
    echo "📄 Summary content:"
    cat iexec_out/summary.txt
  else
    echo "No summary.txt found"
  fi
  
  echo ""
  if [ -f "iexec_out/detailed-report.json" ]; then
    echo "Detailed report exists"
  fi
  
else
  echo "❌ Local test failed!"
  echo ""
  echo "Debug info:"
  echo "- Current directory: $(pwd)"
  echo "- Test file exists: $(ls -la test-input/input.json 2>/dev/null || echo 'NO')"
  echo "- iApp CLI version: $(iapp --version 2>/dev/null || echo 'Not found')"
  exit 1
fi