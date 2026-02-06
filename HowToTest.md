# **PriVest App Testing Guide & Demo Script**

## **📋 Overview**
PriVest is a confidential RWA (Real-World Asset) dividend management platform using iExec Trusted Execution Environments (TEEs) for privacy-preserving profit calculations.

## **🎯 Testing Objectives**
1. Verify wallet connection works
2. Test admin portal functionality (confidential calculations)
3. Test investor portal (dividend viewing/claiming)
4. Test transaction history
5. Verify iExec TEE integration (simulated)

## **🛠️ Pre-requisites**
### **Browser Requirements:**
- Latest Chrome/Firefox with MetaMask installed
- MetaMask configured with:
  - **Arbitrum Sepolia** testnet network
  - Test ETH for gas fees (get from [Sepolia Faucet](https://sepoliafaucet.com/))
  - Arbitrum Sepolia test ETH (get from [Arbitrum Sepolia Bridge](https://bridge.arbitrum.io/))

### **Environment Setup:**
```bash
# Clone and setup
git clone <your-repo>
cd frontend

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_REOWN_PROJECT_ID=demo-project-id" > .env.local
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=0x0000000000000000000000000000000000000000" >> .env.local

# Start development server
npm run dev
```

## **🔧 Test Wallet Setup**
1. **Install MetaMask** if not installed
2. **Switch to Arbitrum Sepolia Network:**
   - Network Name: Arbitrum Sepolia
   - RPC URL: `https://sepolia-rollup.arbitrum.io/rpc`
   - Chain ID: 421614
   - Currency Symbol: ETH
   - Block Explorer: `https://sepolia.arbiscan.io/`

3. **Get Test ETH:**
   - Visit [Sepolia Faucet](https://sepoliafaucet.com/)
   - Connect wallet and request test ETH
   - Bridge to Arbitrum Sepolia if needed

## **🎬 Demo Script for Video Recording**

### **Video Structure:**
**Title:** PriVest - Confidential RWA Management with iExec TEEs  
**Duration:** 3-5 minutes  
**Format:** Screen recording with voiceover

---

### **Scene 1: Introduction (0:00-0:30)**
**Visual:** Homepage with animated gradient background  
**Voiceover:** *"Welcome to PriVest, a revolutionary platform for managing Real-World Asset dividends with complete privacy. Built for the iExec Hack4Privacy hackathon, PriVest leverages Trusted Execution Environments to ensure sensitive profit data never leaves secure enclaves."*

**Action:**
- Show homepage animation
- Highlight key features:
  - Confidential Computing
  - Privacy-Preserving
  - Real-Time Analytics
  - Automated Payouts

### **Scene 2: Wallet Connection (0:30-1:00)**
**Visual:** Connect wallet flow  
**Voiceover:** *"Let's start by connecting our wallet. PriVest supports multiple networks, but for this demo we're using Arbitrum Sepolia testnet."*

**Action:**
1. Click "Connect Wallet" button
2. Show MetaMask popup
3. Select account and connect
4. Show successful connection badge
5. Display connected address (masked for privacy)

### **Scene 3: Admin Portal - Confidential Calculation (1:00-2:30)**
**Visual:** Admin dashboard with profit calculation form  
**Voiceover:** *"As an admin, I can initiate confidential profit calculations. The sensitive data - total profits and investor stakes - is encrypted and processed inside iExec TEEs, keeping everything private."*

**Action:**
1. Navigate to Admin Portal
2. Show admin badge and connected wallet
3. **Test Case 1: Input Configuration**
   - Set total profit: $1,000,000
   - Show 3 pre-filled investors
   - Add a 4th investor with custom stake
   - Explain encryption indicator

4. **Test Case 2: Launch Calculation**
   - Click "Launch Confidential Calculation"
   - Show status messages:
     - "Encrypting data for TEE transmission..."
     - "Creating secure task order with iExec..."
     - "Submitting to iExec decentralized network..."
   - Show generated Task ID
   - Show transaction hash with link to Arbiscan

5. **Test Case 3: Verify Privacy Metrics**
   - Highlight privacy dashboard:
     - Data Encrypted: 100%
     - TEE Protected: ✓ Guaranteed
     - On-chain Exposure: 0%

### **Scene 4: Investor Portal (2:30-3:30)**
**Visual:** Investor dashboard with dividends  
**Voiceover:** *"Now let's switch to the investor perspective. Investors can see their calculated dividends and claim them, all while maintaining complete privacy about the underlying calculations."*

**Action:**
1. Navigate to Investor Portal
2. Show investor stats:
   - Available to Claim: $45,250
   - Total Dividends: 3
   - Privacy Protected: 100%

3. **Test Case 4: Dividend Management**
   - Show dividends table with statuses:
     - Available dividends (green)
     - Claimed dividends (gray)
     - Pending dividends (yellow)
   - Click "Claim" on an available dividend
   - Show claiming animation
   - Verify status changes to "Claimed"

4. **Test Case 5: How It Works Explanation**
   - Show info box explaining the TEE process
   - Highlight 4-step flow:
     1. Admin runs calculation in TEE
     2. Share calculated privately
     3. Results sent to smart contract
     4. Investor claims dividend

### **Scene 5: Transaction History (3:30-4:00)**
**Visual:** Transactions page with filters  
**Voiceover:** *"All activities are transparently recorded on-chain, allowing for full auditability while keeping the sensitive data private."*

**Action:**
1. Navigate to Transactions page
2. Show different transaction types:
   - Calculations
   - Payouts
   - Claims
3. **Test Case 6: Filtering & Search**
   - Filter by "Calculation" type
   - Search by transaction hash
   - Click "View on Arbiscan" links
4. Show transaction stats:
   - Total Transactions
   - Total Volume
   - Completed vs Pending

### **Scene 6: Technical Deep Dive (4:00-4:30)**
**Visual:** Code snippets and architecture diagram  
**Voiceover:** *"Behind the scenes, PriVest integrates iExec's Trusted Execution Environment technology with smart contracts. Let's look at how it works technically."*

**Action:**
1. Show code snippet of iExec integration
   ```typescript
   // iExec TEE task creation
   const taskOrder = await iexec.task.createTaskOrder({
     app: IAPP_ADDRESS,
     params: {
       callback: CONTRACT_ADDRESS,
       args: `--input '${encryptedData}'`,
     },
   });
   ```

2. Show architecture diagram (can be simple):
   ```
   Admin Input → Encryption → iExec TEE → Smart Contract → Investor Claim
         ↑                                    ↑
     [Private]                            [Public Results Only]
   ```

### **Scene 7: Conclusion & Call to Action (4:30-5:00)**
**Visual:** App highlights and GitHub link  
**Voiceover:** *"PriVest demonstrates how confidential computing can revolutionize RWA management. By combining iExec TEEs with blockchain transparency, we enable private calculations with verifiable results."*

**Action:**
1. Show key achievements:
   - 100% data privacy in TEEs
   - Real-time dividend distribution
   - Full audit trail on-chain
2. Display GitHub repository link
3. Show iExec hackathon badge
4. Fade out with PriVest logo

---

## **✅ Success Criteria Checklist**

### **Must-Have Tests:**
- [ ] **Wallet Connection:** Successfully connects/disconnects
- [ ] **Network Switching:** Works on Arbitrum Sepolia
- [ ] **Admin Portal:**
  - [ ] Profit input accepts valid numbers
  - [ ] Investors can be added/removed
  - [ ] Calculation launches (simulated iExec)
  - [ ] Task ID generated
  - [ ] Transaction recorded
- [ ] **Investor Portal:**
  - [ ] Dividends display correctly
  - [ ] Claim button works
  - [ ] Status updates properly
- [ ] **Transactions Page:**
  - [ ] Filters work
  - [ ] Search functions
  - [ ] Links to Arbiscan work
- [ ] **Responsive Design:**
  - [ ] Works on desktop
  - [ ] Works on mobile viewport

### **Nice-to-Have Tests:**
- [ ] **Loading States:** Spinners during async operations
- [ ] **Error Handling:** Shows user-friendly errors
- [ ] **Form Validation:** Prevents invalid inputs
- [ ] **Data Persistence:** Form state persists during navigation

## **🎥 Video Production Tips**

### **Recording Setup:**
1. **Screen Recording Software:**
   - OBS Studio (free, open-source)
   - Loom (simple, cloud-based)
   - ScreenFlow (macOS)

2. **Audio:**
   - Use a decent microphone
   - Record in quiet environment
   - Test audio levels before recording

3. **Resolution:** 1920x1080 (1080p)

### **Editing Tips:**
1. **Intro (5-10 seconds):** PriVest logo with subtle animation
2. **Transitions:** Smooth cuts between scenes
3. **Zoom Effects:** Zoom in on important UI elements
4. **Callouts:** Use arrows/circles to highlight features
5. **Subtitles:** Add captions for accessibility

### **Narrative Flow:**
1. **Problem:** RWA management needs privacy
2. **Solution:** PriVest + iExec TEEs
3. **Demo:** Show it working
4. **Technical:** How it works
5. **Impact:** Why it matters

## **📊 Expected Results**

### **Successful Test Outcomes:**
1. **Complete user journey:** Connect → Admin → Investor → Transactions
2. **No console errors:** Check browser console
3. **All features functional:** Every button/input works
4. **Performance:** Pages load in < 3 seconds

### **Demo Success Metrics:**
- **Engagement:** Clear problem-solution narrative
- **Clarity:** Easy to understand technical concepts
- **Polish:** Professional presentation
- **Call to Action:** Clear next steps for viewers

## **🚀 Post-Testing Actions**

1. **Document any issues** found during testing
2. **Create bug reports** with steps to reproduce
3. **Update documentation** based on test findings
4. **Prepare deployment** if all tests pass

---

## **🎯 Quick Test Run (5-Minute Smoke Test)**

If you're short on time, run this quick test sequence:

1. **Connect wallet** → Verify connection
2. **Go to Admin Portal** → Add investor → Launch calculation
3. **Go to Investor Portal** → Claim one dividend
4. **Go to Transactions** → Verify all activities recorded
5. **Check console** → No errors

If all 5 steps work, the core functionality is operational!

**Happy Testing! 🚀**



check iExec task status on arbitrium sepolia: https://explorer.iex.ec/arbitrum-sepolia-testnet/task/0x564f7d9a6f7ca0846455085bc09aa1c5166ca73b8b5789a6a12abe6a133d3c0b

NEXT_PUBLIC_CONTRACT_ADDRESS=0xe4741b7FF9c69904A6616AD8a61937F97d947331

Check your contract events:
Go to: https://sepolia.arbiscan.io/address/0xe4741b7FF9c69904A6616AD8a61937F97d947331
