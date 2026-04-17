# NFT Collection Contract Deployment Guide

## Prerequisites
- WSL environment set up
- Rust 1.81 installed
- Stellar CLI installed
- Admin secret key from backend/.env

## Step-by-Step Deployment

### Step 1: Verify Rust 1.81
```bash
rustup default 1.81
rustc --version  # Should show 1.81.x
```

### Step 2: Navigate to Contract Directory
```bash
cd "/mnt/c/Users/Rupam Ghosh/OneDrive/Desktop/NFT_BAZAR/contracts/nft_collection"
```

### Step 3: Build Contract (Already Done - Skip if WASM exists)
```bash
# Clean previous build
cargo clean

# Build for Soroban
cargo build --target wasm32-unknown-unknown --release

# Verify WASM file exists
ls -lh target/wasm32-unknown-unknown/release/nft_collection.wasm
```

### Step 4: Deploy to Testnet
```bash
# Set admin address
ADMIN_ADDRESS="GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC"

# Deploy (you will be prompted for secret key)
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nft_collection.wasm \
  --source $ADMIN_ADDRESS \
  --network testnet
```

### Step 5: When Prompted for Secret Key
Enter: `SAO6QG6I7F62TSUX7KA2T7XLUDBN5KXHJNNREJ6CI4TVRJI5L2UL5JQW`

### Step 6: Get Contract ID
After deployment completes, you'll see output like:
```
✅ Successfully deployed contract
Contract ID: CBWA6JYF2XUQOPJYEVSVTN5IBUL2KXXN2ZOMV62UH5ESP2552S7IF4MX
```

**Copy the Contract ID** (the one starting with 'C')

### Step 7: Update Backend .env
Replace the NFT_COLLECTION_ID with the new one from Step 6:
```
NFT_COLLECTION_ID=<YOUR_NEW_CONTRACT_ID>
```

### Step 8: Restart Backend
```bash
cd /mnt/c/Users/Rupam\ Ghosh/OneDrive/Desktop/NFT_BAZAR/backend
npm run dev
```

### Step 9: Test Mint Flow
- Go to http://localhost:3000/mint-soroban
- Upload an image
- Click "Mint NFT"
- Sign with Freighter (user pays gas)
- Check transaction on Stellar Expert

## Verification
Transaction should show:
- Fee paid by user's wallet
- Contract invocation successful
- NFT minted to user's address

## Troubleshooting

**Error: stellar: command not found**
- Stellar CLI not installed in WSL
- Install from: https://github.com/stellar/stellar-cli

**Error: WASM file not found**
- Contract not built yet
- Run: `cargo build --target wasm32-unknown-unknown --release`

**Error: Network error during deploy**
- Check internet connection
- Try again in a few moments

**Transaction fails after signing**
- Check contract ID is correct
- Verify user account has XLM for fees
- Check backend logs for errors
