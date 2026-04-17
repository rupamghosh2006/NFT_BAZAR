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
| NFTCollection | `CC3MTHR3LEYFONM43WWK7VNACJ7JG6HZWU7HVFDTLXHKT4GNJMAFEPDI` |
| Marketplace | `CB7V3QCHJ3QLN4NPUFGOB6IWCF3IROEYGKOJX7A4V5VTPAHD563XDKZS` |

### Deployment Transactions

| Event | Transaction Hash |
|---|---|
| NFTCollection deploy (latest) | `2e6fc62f2b15eeb338281b6dbf4773781b9a9865700bd37ed6612320a161c0e0` |
| NFTCollection contract | `3d54a7f321db2ffa930ab8c5d9c349681253ee21d80bfe8777d85d920421a78d` |
| Marketplace deploy (latest) | `30f3afe3649a153cb77b24171fb21a51593d8430aaff50dc393ac10586731a76` |
| Marketplace contract | `4ec762e84b0ffaa75316e2ebebe5b436f1992b8b30b75591caccae5fbd164c13` |

### User-Pays-Gas Model

The platform implements a **user-pays-gas** model where:

- **Users pay gas fees** for all operations (minting, listing, buying)
- **No admin secrets** are stored in the backend
- **Two-step transaction flow**:
  1. Backend builds unsigned transaction
  2. User signs with Freighter wallet and pays gas
  3. Backend submits signed transaction

This ensures users have full control over their transactions and gas spending.

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

Then sends seller proceeds via the Stellar Asset Contract.

### Soroban Integration Features

- **Soroban Minting** (`/mint-soroban`): Users mint NFTs directly on Soroban blockchain with their own wallet signature
- **User-Controlled Gas**: Transaction fees are paid by users via Freighter wallet
- **Gas Fee Display**: Frontend shows transaction hash and gas fees in success toasts
- **Real-Time Updates**: NFT listings and sales indexed from Soroban events

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
NFT_COLLECTION_ID=CC3MTHR3LEYFONM43WWK7VNACJ7JG6HZWU7HVFDTLXHKT4GNJMAFEPDI
MARKETPLACE_ID=CB7V3QCHJ3QLN4NPUFGOB6IWCF3IROEYGKOJX7A4V5VTPAHD563XDKZS
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
| POST | `/soroban/mint/build` | Build mint transaction (user signs) |
| POST | `/soroban/mint/submit` | Submit signed mint transaction |
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
| `/mint-soroban` | Mint NFTs on Soroban (user pays gas) |
| `/list` | List an NFT for sale |
| `/list-soroban` | List NFTs on Soroban marketplace |
| `/buy-soroban` | Buy NFTs on Soroban marketplace |
| `/royalties` | Claimable royalties & history |
| `/analytics` | Volume charts & top sales |
| `/nft/:contract/:tokenId` | NFT detail + buy |

---

## License

MIT
