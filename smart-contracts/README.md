# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

🚀 Deploying PriVest RWA Dividend Distributor
=============================================
🌐 Network: arbitrum-sepolia
📱 Deployer: 0x2c3b2B2325610a6814f2f822D0bF4DAB8CF16e16
💰 Balance: 0.099946141572444 ETH

📦 Deploying contract...
✅ Contract deployed!
📍 Address: 0x5b4dCD6038a092d36afEB2e2C56A8201544c6eC1
📝 TX Hash: 0x231604c5d0ce9ede3c998f82e84df92e9aa894c62a168da9fff98b43e2e03367
🔗 Explorer: https://sepolia.arbiscan.io/address/0x5b4dCD6038a092d36afEB2e2C56A8201544c6eC1

📁 Deployment info saved to: /home/augustineonuora/Dapps-Empty/2026/Feb2026/PriVest/smart-contracts/deployments/arbitrum-sepolia-deployment.json
📄 Frontend .env.example saved to: /home/augustineonuora/Dapps-Empty/2026/Feb2026/PriVest/smart-contracts/deployments/arbitrum-sepolia-.env.example

🎯 Deployment Complete!
========================================
Contract ready for iExec callbacks!

To receive iExec callbacks:
1. Launch iExec task with callback: 0x5b4dCD6038a092d36afEB2e2C56A8201544c6eC1
2. iExec will call receiveResult() automatically
3. Investors can claim dividends

   # Test
npx hardhat run scripts/interact.ts --network arbitrum-sepolia

# Run tests
npx hardhat test