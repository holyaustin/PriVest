#!/bin/bash

# Get addresses from command line or use defaults
ADDRESS1=${1:-"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"}
ADDRESS2=${2:-"0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}

# Create input.json with these addresses
mkdir -p test-cmd-input
cat > test-cmd-input/input.json << JSON
{
  "totalProfit": 1000000,
  "investors": [
    {
      "address": "$ADDRESS1",
      "stake": 600000,
      "name": "Investor 1"
    },
    {
      "address": "$ADDRESS2",
      "stake": 400000,
      "name": "Investor 2"
    }
  ],
  "config": {
    "currency": "USD"
  }
}
JSON

echo "Created test input with addresses:"
echo "  $ADDRESS1"
echo "  $ADDRESS2"
cat test-cmd-input/input.json

# Run the iApp
docker run --rm \
  -v $(pwd)/test-cmd-input:/iexec_in \
  -v $(pwd)/test-cmd-output:/iexec_out \
  -e IEXEC_IN=/iexec_in \
  -e IEXEC_OUT=/iexec_out \
  privest-iapp:latest
