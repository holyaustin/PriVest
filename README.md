# 🛡️ PriVest: Confidential RWA Dividend & Vesting Calculator

![PriVest Banner](https://via.placeholder.com/1200x400/1e40af/ffffff?text=PriVest%3A+Confidential+RWA+Dividends) <!-- Consider adding a real banner image later -->

**PriVest** is a hackathon-winning decentralized application (dApp) built for the **iExec & 50Partners Hack4Privacy**. It leverages **Trusted Execution Environments (TEEs)** to calculate investor payouts for Real-World Asset (RWA) projects while keeping the underlying profit data and financial formulas completely confidential. Only the final dividend amounts are revealed on-chain.

**Live Demo:** [https://your-vercel-url.vercel.app](https://your-vercel-url.vercel.app) | **Demo Video:** [Link to your 4-min video](#)

---

## 🏆 Hackathon Submission Highlights

*   **Hackathon:** [Hack4Privacy by iExec x 50Partners](https://dorahacks.io/hackathon/iexec-50partners-hack4privacy/detail)
*   **Track:** Confidential Real-World Assets (RWA)
*   **Core Innovation:** Uses iExec's Confidential Computing to privatize the core business logic of RWA profit sharing.
*   **Key Features:**
    *   ✅ **TEE-Protected Calculations:** Profit data & sharing formulas run encrypted inside an iExec Confidential iApp.
    *   ✅ **On-Chain Transparency:** Verifiable payout results are posted to Arbitrum Sepolia.
    *   ✅ **Non-Custodial Claims:** Investors retain full control to claim dividends.
    *   ✅ **Bonus Integration:** Implements Account Abstraction for a seamless user experience.

---

## 🏗️ Architecture Overview

PriVest is a full-stack Web3 application consisting of three integrated components:

1.  **Next.js Frontend (This Repository):** User interface for admins and investors, built with the official `iexec-nextjs-starter`.
2.  **Confidential iApp (`/rwa-confidential-iapp`):** Contains the private profit-sharing logic, deployed on the iExec network.
3.  **Smart Contracts (`/contracts`):** `RWADividendDistributor.sol` deployed on Arbitrum Sepolia to manage the payout process.

```mermaid
sequenceDiagram
    participant A as Admin (Frontend)
    participant C as Distributor Contract
    participant I as iExec Network (TEE)
    participant U as Investor (Frontend)

    A->>C: 1. Submit Profit & Stakes
    C->>I: 2. Trigger Confidential iApp Task
    Note over I: 3. Profit & Formula <br>are HIDDEN inside TEE
    I->>C: 4. Post Calculated Payouts
    U->>C: 5. Claim Dividend
    C->>U: 6. Transfer Funds

⚙️ Prerequisites & Installation
1. System Requirements
Node.js (v20.x or later) & npm/pnpm

Git

Docker Desktop (Must be running for local iApp tests)

MetaMask browser extension with an Arbitrum Sepolia testnet network configured.

2. Clone & Setup
bash
# 1. Clone the repository
git clone https://github.com/your-username/privacy-rwa-calculator.git
cd privacy-rwa-calculator

# 2. Install dependencies for the frontend
npm install  # or pnpm install

# 3. Set up environment variables
cp .env.example .env.local
Edit .env.local and add your Reown Project ID:

plaintext
NEXT_PUBLIC_REOWN_PROJECT_ID=your_project_id_here
Get your Project ID for free at Reown Cloud.

3. Smart Contract & iApp Setup
Navigate to the respective subdirectories to set up the other components:

bash
# Setup and deploy the smart contract
cd contracts
npm install
npx hardhat compile
# Follow deployment instructions in contracts/README.md

# Build and test the confidential iApp
cd ../rwa-confidential-iapp
npm install -g @iexec/iapp-generator # If not already installed
iapp test # Run a local test
# Follow deployment instructions in rwa-confidential-iapp/README.md
🚀 Running the Application Locally
Start the development server from the project root:

bash
npm run dev
Open your browser to http://localhost:3000.

Connect your wallet using the "Connect Wallet" button. Ensure MetaMask is connected to the Arbitrum Sepolia test network.

🧪 How to Use PriVest
For RWA Project Admins:
Navigate to the Admin Dashboard.

Enter Confidential Profit Data: Input the total profit figure. This data will be sent to the confidential iApp and never stored in plaintext on-chain.

Upload Investor Stake List: Provide a list of investor addresses and their corresponding stake percentages or amounts.

Calculate & Distribute: Click "Calculate Dividends." This will deploy a confidential computation task to the iExec network. Once the TEE completes the calculation, the results are sent back to the smart contract, ready for investors to claim.

For Investors:
Connect your wallet containing the address that holds the RWA tokens.

View Vested Dividends: The dashboard will automatically display any pending, unclaimed dividends allocated to your connected address.

Claim: Click the "Claim Dividend" button to securely transfer your share to your wallet.

🔧 Project Structure
text
privacy-rwa-calculator/
├── /app                          # Next.js 15 App Router pages
│   ├── /admin                    # Admin dashboard page
│   ├── /investor                 # Investor dashboard page
│   └── layout.tsx                # Root layout with providers
├── /components                   # Reusable React components
├── /config                       # Wagmi & blockchain network configs
├── /contracts                    # Hardhat project & Solidity contracts
│   └── contracts/RWADividendDistributor.sol
├── /rwa-confidential-iapp        # iExec Confidential iApp
│   └── src/app.js                # Core private profit-sharing logic
├── public/                       # Static assets
├── .env.local                    # Environment variables (gitignored)
├── feedback.md                   # Hackathon feedback for iExec
└── README.md                     # This file
🧠 Technology Stack
Component	Technology
Frontend	Next.js 15 (App Router), TypeScript, Tailwind CSS, Reown AppKit (Wagmi/Viem)
Blockchain	Solidity, Hardhat, Ethers v6, Arbitrum Sepolia
Confidential Compute	iExec Blockchain, iExec iApp Generator (@iexec/iapp-generator), Trusted Execution Environment (TEE)
Deployment	Vercel (Frontend), iExec Network (iApp), Arbitrum Sepolia (Contract)
📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

🔗 Resources & Acknowledgements
iExec Documentation - Core technology documentation.

Hack4Privacy Official Page - Hackathon details.

Arbitrum Sepolia Faucet - For test ETH.

iExec Test RLC Faucet - For RLC tokens to run computations.

Special thanks to the iExec and 50Partners teams for organizing Hack4Privacy.

👥 Contributors
Your Name/Team Name

Built with ❤️ for the future of private, compliant, and transparent Real-World Assets on-chain.git


# 🚀 iExec Next.js Starter - Decentralized Data Protection

A minimal starter to quickly get started with iExec DataProtector and Next.js.

---

## 📋 About

This project is a simple starter that allows you to:

- Connect a Web3 wallet
- Protect data with iExec DataProtector
- Grant access to protected data
- Discover basic iExec features

**Included features:**
- ✅ Wallet connection with Reown AppKit (WalletConnect)
- ✅ Data protection with iExec DataProtector
- ✅ Multi-chain support (iExec Sidechain, Arbitrum)
- ✅ Simple and clean user interface
- ✅ Built with Next.js, TypeScript, and Tailwind CSS

---

## 🛠️ Quick Start

1. **Clone the project:**
```bash
git clone https://github.com/iExecBlockchainComputing/iexec-nextjs-starter.git
cd iexec-nextjs-starter
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create your Reown project:**
   - Go to [https://cloud.reown.com/app](https://cloud.reown.com/app)
   - Create a project and choose **AppKit** → **Next.js**

4. **Configure environment variables:**
```bash
# Create a .env.local file
NEXT_PUBLIC_REOWN_PROJECT_ID=your_reown_project_id
```

5. **Start the project:**
```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000)

---

## 🧩 Compatible Wallets

iExec Bellecour only works with these wallets:

- MetaMask
- Coinbase Wallet
- Brave Wallet  
- WalletConnect
- Zerion

❌ Other wallets may not work with iExec SDKs on Bellecour.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main page with iExec logic
│   ├── layout.tsx        # Global layout
│   └── globals.css       # Global styles
├── components/
│   └── WelcomeBlock.tsx  # Welcome component
├── config/
│   ├── wagmiConfig.ts    # Wagmi/Reown configuration
│   └── wagmiNetworks.ts  # Supported blockchain networks
└── context/
    └── index.tsx         # Global providers
```

---

## 🔍 How It Works

### Data Protection
1. **Connection:** Use Reown AppKit to connect your wallet
2. **Protection:** Enter data name and content to protect
3. **iExec:** Data is encrypted and stored via DataProtector
4. **Result:** You receive the address and metadata of protected data

---

## 🌐 Supported Networks

- **iExec Sidechain (Bellecour)** - Chain ID: 134
- **Arbitrum One** - Chain ID: 42161
- **Arbitrum Sepolia** - Chain ID: 421614

---

## 🚀 Next Steps

This starter is intentionally minimal. You can extend it with:

- More iExec features (compute, marketplace, Web3Mail)
- Advanced data management interface
- Protected dataset marketplace
- Integration with other iExec services
- Custom iExec applications
- Data monetization features

---

## 📚 Resources

- [iExec Documentation](https://docs.iex.ec/)
- [iExec DataProtector API](https://docs.iex.ec/references/dataProtector)
- [Reown AppKit Documentation](https://docs.reown.com/appkit/next/core/installation)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)

---

## 🔧 Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

**Happy coding with iExec! 🔒✨**



✔ Docker image built (sha256:f510c58918b5c8986e41649f56d63953297a9812d6954cf37d82919e16edcb5c) and tagged holyaustin/rwa-dividend-calculator:0.0.1
✔ Pushed image holyaustin/rwa-dividend-calculator:0.0.1 on dockerhub
✔ Pushed TEE image holyaustin/rwa-dividend-calculator:0.0.1-tee-scone-5.9.1-v16-prod-833fdb047064 on dockerhub
✔ TEE app deployed
✔ App secret attached to the app
✔ Deployment of your iApp completed successfully:
  - Docker image: holyaustin/rwa-dividend-calculator:0.0.1-tee-scone-5.9.1-v16-prod-833fdb047064
  - iApp address: 0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79

╭──────────────────────────────────────────────────────────────────────────────────────────────────────╮
│                                                                                                      │
│   Run iapp run 0xB27cfF3fc965FaD42B5a97c350c9D9449Fd92D79 to execute your iApp on an iExec TEE       │
│   worker                                                                                             │
│                                                                                                      │
╰──────────────────────────────────────────────────────────────────────────────────────────────────────╯
