# NFT Bazar

Soroban testnet NFT marketplace with a royalty split pool.

## Architecture

- `NFTCollection`: minimal non-fungible collection contract with token ownership, metadata URI storage, transfer, and `royalty_info`.
- `RoyaltyPool`: receives royalty payments in a Stellar Asset Contract token, splits them between creator, stakers, and treasury, then lets recipients claim.
- `Marketplace`: escrows NFTs, reads royalty data from `NFTCollection`, calls `RoyaltyPool.distribute`, pays the seller, and transfers the NFT to the buyer.

## Top-Level Layout

```text
backend/
contracts/
frontend/
scripts/
```

## Testnet Deployment

Do not put recovery phrases or seed phrases in `.env`. Use a Stellar CLI identity name in `STELLAR_SOURCE`, and keep the secret in the CLI key store.

Install Rust and Stellar CLI in WSL, then run from the repository root:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
curl -fsSL https://github.com/stellar/stellar-cli/raw/main/install.sh | sh
rustup target add wasm32v1-none
stellar keys generate nft-bazar-admin --network testnet --fund
export STELLAR_SOURCE=nft-bazar-admin
export CREATOR_ADDRESS="$(stellar keys public-key nft-bazar-admin)"
export STAKERS_ADDRESS="G..."
export TREASURY_ADDRESS="G..."
bash scripts/deploy-testnet.sh
```

On Windows PowerShell, install Stellar CLI with `winget install --id Stellar.StellarCLI`, then use:

```powershell
$env:STELLAR_SOURCE = "nft-bazar-admin"
$env:CREATOR_ADDRESS = "G..."
$env:STAKERS_ADDRESS = "G..."
$env:TREASURY_ADDRESS = "G..."
.\scripts\deploy-testnet.ps1
```

The deployment order is:

1. Deploy native XLM Stellar Asset Contract for sale payments.
2. Deploy and initialize `RoyaltyPool` with `[5000, 3000, 2000]` shares.
3. Deploy and initialize `NFTCollection` with 10% royalties.
4. Deploy and initialize `Marketplace`.

## Inter-Contract Calls

`Marketplace.buy_nft()` performs the two advanced calls:

```text
buy_nft() -> NFTCollection.royalty_info()
buy_nft() -> RoyaltyPool.distribute()
```

The Marketplace then sends the seller proceeds through the configured Stellar Asset Contract and transfers the NFT from marketplace escrow to the buyer.

## Contract Addresses

- Payment token: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- RoyaltyPool: `CCFACXY34DFXJZJIHFNV6WRDQLEHGKX7YXLLW6PVOKZTLJG2APU4LG4C`
- NFTCollection: `CBWA6JYF2XUQOPJYEVSVTN5IBUL2KXXN2ZOMV62UH5ESP2552S7IF4MX`
- Marketplace: `CBQQ6JAWRKCICVG3VT5IOSZOLFXPSG2F74DDFYFL7GWLOHDPOVK54BFT`

## Testnet Transactions

- RoyaltyPool deploy: `2fa51e5b8bf0c1dadf6ba9937f91b3841b2f1cb06b9f519c68522979d7eceb94`
- RoyaltyPool initialize: `9cb954867efddfa9a819ff0564bafb3d20499ee216303f9b59688eb526227f48`
- NFTCollection deploy: `eaa132e59081efd6387786903f9c4e990cf612fd45e0dce95603dd5adf78346a`
- NFTCollection initialize: `dcbe5f7ab5365e8e5a741c7bf903c54b6f02c6d40c378f4f50fc634ed83a4767`
- Marketplace deploy: `7da9ff9d210a4b73219624c20221ea033b236638c0db89643be8383da43ce7af`
- Marketplace initialize: `33ed3afb673264787bf79277df086d57c36443a404b6cb8f06670ad911391a99`

## Event Streaming

The contracts emit Soroban diagnostic events for minting, listing, sale, cancellation, royalty distribution, and claims. The frontend can stream these later through Stellar RPC event queries.
