# NFT Bazar

> Decentralized NFT marketplace on the Stellar network with automatic royalty splitting for creators.

**Live Demo:** https://nft-bazar-tan.vercel.app

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/nft-bazar)

---

## Screenshots

### Mobile Responsive View
<!-- Insert mobile screenshot here -->
![Mobile View](https://res.cloudinary.com/ddp0nf4uv/image/upload/v1776074599/Screenshot_2026-04-13_151711_afcwvn.png)


<p align="center">
  <img src="https://res.cloudinary.com/ddp0nf4uv/image/upload/v1776074599/Screenshot_2026-04-13_151736_pls2qm.png" alt="Mobile View 1" width="30%"/>
  <img src="https://res.cloudinary.com/ddp0nf4uv/image/upload/v1776074599/Screenshot_2026-04-13_151800_hvsxyp.png" alt="Mobile View 2" width="30%"/>
  <img src="https://res.cloudinary.com/ddp0nf4uv/image/upload/v1776074600/Screenshot_2026-04-13_151830_vzv4no.png" alt="Mobile View 3" width="30%"/>
</p>

## Deployment

- **Frontend**: Auto-deployed to Vercel on every push to `master`
- **Backend**: Auto-deployed to Render via Docker on every push to `master`

[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://nft-bazar-tan.vercel.app)
[![Render](https://img.shields.io/badge/Backend-Render-blue?logo=render)](https://nft-bazar.onrender.com)

---

## Features

- **Browse NFTs** — Discover and filter NFTs listed on the marketplace
- **Mint NFTs** — Create new NFTs with custom names and images (Unsplash templates)
- **List for Sale** — Set a price and list your NFT on the marketplace
- **Buy NFTs** — Purchase NFTs directly from other users
- **Automatic Royalties** — 10% royalty on every resale, split between creator (50%), stakers (30%), and treasury (20%)
- **Wallet Integration** — Connect via Freighter wallet (Stellar ecosystem)
- **Analytics Dashboard** — View volume charts, top sales, and market statistics
- **Mobile-First Design** — Fully responsive UI with bottom navigation

---

## Tech Stack

### Frontend
- **Next.js 14** — React framework with App Router
- **TypeScript** — Type-safe codebase
- **Tailwind CSS** — Utility-first styling
- **React Query** — Server state management & caching
- **Zustand** — Client-side wallet state
- **Recharts** — Analytics charts
- **Framer Motion** — Smooth animations

### Backend
- **Express.js** — REST API server
- **Prisma** + **Neon PostgreSQL** — Relational data (users, NFTs, listings, sales)
- **Mongoose** + **MongoDB Atlas** — Blockchain event indexing
- **Upstash Redis** — HTTP caching layer
- **BullMQ** + **ioredis** — Background job queues
- **JWT** — Authentication (SIWE-ready)

### Blockchain
- **Stellar Testnet** — Soroban smart contracts
- **Freighter** — Wallet connection
- **@stellar/stellar-sdk** — Backend Horizon/RPC integration

---

## Smart Contracts (Soroban)

| Contract | Address (Testnet) |
|---|---|
| Payment Token | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| RoyaltyPool | `CCFACXY34DFXJZJIHFNV6WRDQLEHGKX7YXLLW6PVOKZTLJG2APU4LG4C` |
| NFTCollection | `CBWA6JYF2XUQOPJYEVSVTN5IBUL2KXXN2ZOMV62UH5ESP2552S7IF4MX` |
| Marketplace | `CBQQ6JAWRKCICVG3VT5IOSZOLFXPSG2F74DDFYFL7GWLOHDPOVK54BFT` |

### Deployment Transactions

| Event | Transaction Hash |
|---|---|
| RoyaltyPool deploy | `2fa51e5b8bf0c1dadf6ba9937f91b3841b2f1cb06b9f519c68522979d7eceb94` |
| RoyaltyPool initialize | `9cb954867efddfa9a819ff0564bafb3d20499ee216303f9b59688eb526227f48` |
| NFTCollection deploy | `eaa132e59081efd6387786903f9c4e990cf612fd45e0dce95603dd5adf78346a` |
| NFTCollection initialize | `dcbe5f7ab5365e8e5a741c7bf903c54b6f02c6d40c378f4f50fc634ed83a4767` |
| Marketplace deploy | `7da9ff9d210a4b73219624c20221ea033b236638c0db89643be8383da43ce7af` |
| Marketplace initialize | `33ed3afb673264787bf79277df086d57c36443a404b6cb8f06670ad911391a99` |

### Royalty Split (10% of each sale)

| Recipient | Share |
|---|---|
| Creator | 50% |
| Stakers | 30% |
| Treasury | 20% |

### Inter-Contract Calls

`Marketplace.buy_nft()` performs:
1. `NFTCollection.royalty_info()` — queries royalty data
2. `RoyaltyPool.distribute()` — splits and distributes royalty payments

Then sends seller proceeds via the Stellar Asset Contract and transfers the NFT to the buyer.

---

## Architecture

```
frontend/          Next.js 14 (Vercel)
backend/           Express API (Railway / Render)
neondb/            PostgreSQL — users, NFTs, listings, sales
mongodb/           MongoDB Atlas — blockchain event indexing
upstash/           Redis — API response caching
bullmq/            ioredis — background job processing
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (Neon) or local Postgres
- MongoDB Atlas cluster
- Upstash Redis account
- Freighter wallet (browser extension)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your DATABASE_URL, MONGODB_URI, UPSTASH_* vars
npm install
npx prisma db push
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev
```

### Environment Variables

**Backend (`backend/.env`):**
```
DATABASE_URL=           # Neon PostgreSQL
MONGODB_URI=            # MongoDB Atlas
UPSTASH_REDIS_REST_URL= # Upstash Redis
UPSTASH_REDIS_REST_TOKEN=
JWT_SECRET=
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NFT_COLLECTION_ID=CBWA6JYF2XUQOPJYEVSVTN5IBUL2KXXN2ZOMV62UH5ESP2552S7IF4MX
MARKETPLACE_ID=CBQQ6JAWRKCICVG3VT5IOSZOLFXPSG2F74DDFYFL7GWLOHDPOVK54BFT
ROYALTY_POOL_ID=CCFACXY34DFXJZJIHFNV6WRDQLEHGKX7YXLLW6PVOKZTLJG2APU4LG4C
PAYMENT_TOKEN_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
```

**Frontend (`frontend/.env.local`):**
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_NETWORK=testnet
```

---

## API Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/nfts` | List all NFTs (filterable) |
| GET | `/nfts/owner/:address` | Get NFTs by owner |
| GET | `/nfts/:contract/:tokenId` | Get NFT details |
| POST | `/mint` | Mint a new NFT |
| GET | `/listings` | List active listings |
| POST | `/listings` | Create a listing |
| DELETE | `/listings/:id` | Cancel a listing |
| GET | `/sales` | Recent sales |
| GET | `/royalties/:address` | Claimable royalties |
| GET | `/royalties/history/:address` | Royalty history |
| POST | `/royalties/claim` | Claim royalties |
| GET | `/analytics/volume` | Volume analytics |
| GET | `/analytics/top-nfts` | Top selling NFTs |
| GET | `/analytics/stats` | Market statistics |

---

## Pages

| Route | Description |
|---|---|
| `/` | Marketplace — browse & filter NFTs |
| `/my-nfts` | My NFTs — owned, listed, sold tabs |
| `/mint` | Mint new NFTs with templates |
| `/list` | List an NFT for sale |
| `/royalties` | Claimable royalties & history |
| `/analytics` | Volume charts & top sales |
| `/nft/:contract/:tokenId` | NFT detail + buy |

---

## License

MIT
