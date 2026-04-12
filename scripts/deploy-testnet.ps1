$ErrorActionPreference = "Stop"

if (-not $env:STELLAR_SOURCE) { throw "Set STELLAR_SOURCE to a funded Stellar CLI identity name." }
if (-not $env:CREATOR_ADDRESS) { throw "Set CREATOR_ADDRESS to the creator recipient address." }
if (-not $env:STAKERS_ADDRESS) { throw "Set STAKERS_ADDRESS to the stakers recipient address." }
if (-not $env:TREASURY_ADDRESS) { throw "Set TREASURY_ADDRESS to the treasury recipient address." }

$network = if ($env:STELLAR_NETWORK) { $env:STELLAR_NETWORK } else { "testnet" }

Write-Host "Building Soroban contracts..."
stellar contract build

$nftWasm = "target/wasm32v1-none/release/nft_collection.wasm"
$poolWasm = "target/wasm32v1-none/release/royalty_pool.wasm"
$marketplaceWasm = "target/wasm32v1-none/release/marketplace.wasm"

Write-Host "Resolving the native XLM Stellar Asset Contract..."
try {
  $paymentTokenId = stellar contract id asset --asset native --network $network 2>$null
} catch {
  $paymentTokenId = stellar contract asset deploy --asset native --source $env:STELLAR_SOURCE --network $network
}

Write-Host "Deploying RoyaltyPool..."
$royaltyPoolId = stellar contract deploy --wasm $poolWasm --source $env:STELLAR_SOURCE --network $network

Write-Host "Initializing RoyaltyPool..."
stellar contract invoke `
  --id $royaltyPoolId `
  --source $env:STELLAR_SOURCE `
  --network $network `
  -- initialize `
  --admin $env:CREATOR_ADDRESS `
  --token $paymentTokenId `
  --wallets "[`"$($env:CREATOR_ADDRESS)`",`"$($env:STAKERS_ADDRESS)`",`"$($env:TREASURY_ADDRESS)`"]" `
  --shares "[`"5000`",`"3000`",`"2000`"]"

Write-Host "Deploying NFTCollection..."
$nftCollectionId = stellar contract deploy --wasm $nftWasm --source $env:STELLAR_SOURCE --network $network

Write-Host "Initializing NFTCollection..."
stellar contract invoke `
  --id $nftCollectionId `
  --source $env:STELLAR_SOURCE `
  --network $network `
  -- initialize `
  --admin $env:CREATOR_ADDRESS `
  --royalty_pool $royaltyPoolId `
  --royalty_bps 1000 `
  --name CryptoCanvas `
  --symbol CC

Write-Host "Deploying Marketplace..."
$marketplaceId = stellar contract deploy --wasm $marketplaceWasm --source $env:STELLAR_SOURCE --network $network

Write-Host "Initializing Marketplace..."
stellar contract invoke `
  --id $marketplaceId `
  --source $env:STELLAR_SOURCE `
  --network $network `
  -- initialize `
  --admin $env:CREATOR_ADDRESS `
  --payment_token $paymentTokenId `
  --royalty_pool $royaltyPoolId

Write-Host ""
Write-Host "Deployment complete"
Write-Host "Payment token:  $paymentTokenId"
Write-Host "RoyaltyPool:    $royaltyPoolId"
Write-Host "NFTCollection:  $nftCollectionId"
Write-Host "Marketplace:    $marketplaceId"
