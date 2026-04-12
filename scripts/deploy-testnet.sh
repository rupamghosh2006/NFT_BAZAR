#!/usr/bin/env bash
set -euo pipefail

: "${STELLAR_NETWORK:=testnet}"
: "${STELLAR_SOURCE:?Set STELLAR_SOURCE to a funded Stellar CLI identity name, for example: export STELLAR_SOURCE=nft-bazar-admin}"
: "${CREATOR_ADDRESS:?Set CREATOR_ADDRESS to the creator recipient address}"
: "${STAKERS_ADDRESS:?Set STAKERS_ADDRESS to the stakers recipient address}"
: "${TREASURY_ADDRESS:?Set TREASURY_ADDRESS to the treasury recipient address}"

echo "Building Soroban contracts..."
stellar contract build

NFT_WASM="target/wasm32v1-none/release/nft_collection.wasm"
ROYALTY_POOL_WASM="target/wasm32v1-none/release/royalty_pool.wasm"
MARKETPLACE_WASM="target/wasm32v1-none/release/marketplace.wasm"

echo "Resolving the native XLM Stellar Asset Contract..."
if PAYMENT_TOKEN_ID="$(stellar contract id asset --asset native --network "$STELLAR_NETWORK" 2>/dev/null)"; then
  true
else
  PAYMENT_TOKEN_ID="$(
    stellar contract asset deploy \
      --asset native \
      --source "$STELLAR_SOURCE" \
      --network "$STELLAR_NETWORK"
  )"
fi

echo "Deploying RoyaltyPool..."
ROYALTY_POOL_ID="$(
  stellar contract deploy \
    --wasm "$ROYALTY_POOL_WASM" \
    --source "$STELLAR_SOURCE" \
    --network "$STELLAR_NETWORK"
)"

echo "Initializing RoyaltyPool..."
stellar contract invoke \
  --id "$ROYALTY_POOL_ID" \
  --source "$STELLAR_SOURCE" \
  --network "$STELLAR_NETWORK" \
  -- initialize \
  --admin "$CREATOR_ADDRESS" \
  --token "$PAYMENT_TOKEN_ID" \
  --wallets "[\"$CREATOR_ADDRESS\",\"$STAKERS_ADDRESS\",\"$TREASURY_ADDRESS\"]" \
  --shares "[\"5000\",\"3000\",\"2000\"]"

echo "Deploying NFTCollection..."
NFT_COLLECTION_ID="$(
  stellar contract deploy \
    --wasm "$NFT_WASM" \
    --source "$STELLAR_SOURCE" \
    --network "$STELLAR_NETWORK"
)"

echo "Initializing NFTCollection..."
stellar contract invoke \
  --id "$NFT_COLLECTION_ID" \
  --source "$STELLAR_SOURCE" \
  --network "$STELLAR_NETWORK" \
  -- initialize \
  --admin "$CREATOR_ADDRESS" \
  --royalty_pool "$ROYALTY_POOL_ID" \
  --royalty_bps 1000 \
  --name CryptoCanvas \
  --symbol CC

echo "Deploying Marketplace..."
MARKETPLACE_ID="$(
  stellar contract deploy \
    --wasm "$MARKETPLACE_WASM" \
    --source "$STELLAR_SOURCE" \
    --network "$STELLAR_NETWORK"
)"

echo "Initializing Marketplace..."
stellar contract invoke \
  --id "$MARKETPLACE_ID" \
  --source "$STELLAR_SOURCE" \
  --network "$STELLAR_NETWORK" \
  -- initialize \
  --admin "$CREATOR_ADDRESS" \
  --payment_token "$PAYMENT_TOKEN_ID" \
  --royalty_pool "$ROYALTY_POOL_ID"

cat <<DEPLOYMENT

Deployment complete
Payment token:  $PAYMENT_TOKEN_ID
RoyaltyPool:    $ROYALTY_POOL_ID
NFTCollection:  $NFT_COLLECTION_ID
Marketplace:    $MARKETPLACE_ID

Save these values in README.md and frontend/.env once you are ready to wire the UI.
DEPLOYMENT
