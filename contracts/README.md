# Contracts

Soroban contracts:

- `nft_collection`: NFT ownership, metadata URI storage, transfer, and royalty lookup.
- `royalty_pool`: royalty token custody, split accounting, and recipient claims.
- `marketplace`: NFT escrow, sale execution, royalty lookup, royalty distribution, seller payout, and sale events.

Build all contracts from the repository root:

```bash
stellar contract build
```
