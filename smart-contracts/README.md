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

🎯 DEPLOYMENT COMPLETE - NEXT STEPS:
==================================================
1. Update your frontend .env.local file:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0xe4741b7FF9c69904A6616AD8a61937F97d947331

2. Run interaction test:
   npx hardhat run scripts/interact.ts --network arbitrum-sepolia

3. When running iApp from frontend, set callback to:
   0xe4741b7FF9c69904A6616AD8a61937F97d947331