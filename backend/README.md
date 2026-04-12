# NFT Bazar Backend

Production backend for NFT Marketplace on Stellar (Soroban).

## Setup

```bash
cd backend
npm install
cp .env.example .env   # fill in your values
npx prisma generate
npx prisma db push
docker-compose up -d   # postgres, mongodb, redis
npm start
```

## Stack

- **Runtime**: Node.js 20, Express.js
- **PostgreSQL**: Prisma ORM (Users, NFTs, Listings, Sales, Royalties)
- **MongoDB**: Mongoose (on-chain data: ChainNFT, ChainListing, ChainSale, RoyaltyReceipt)
- **Redis**: ioredis (caching, BullMQ queue backend)
- **BullMQ**: background workers (indexer, royalty claims)
- **Auth**: JWT + SIWE wallet signature verification
- **Blockchain**: stellar-sdk v10

## Structure

```
src/
├── app.js              # Express app
├── server.js           # Server entry
├── worker.js          # BullMQ workers entry
├── configs/            # env, redis, stellar, queue
├── db/                 # prisma, mongoose connections
├── models/mongo/       # ChainNFT, ChainListing, ChainSale, RoyaltyReceipt
├── services/           # auth, nft, listing, sale, royalty, analytics, cache, stellar
├── controllers/        # HTTP handlers
├── routes/             # API routes
├── middleware/          # auth, rate limiter, error handler, logger, cors
├── indexer/            # Horizon event streamer
└── worker/             # BullMQ workers
```

## API Endpoints

- `POST /auth/nonce` — generate nonce for wallet
- `POST /auth/verify` — verify SIWE signature, return JWT
- `GET /nfts` — paginated NFTs (cached 60s)
- `GET /nfts/:contractAddress/:tokenId`
- `POST /nfts/mint` — JWT required
- `GET /nfts/owner/:walletAddress`
- `GET /listings` — active listings (cached 30s)
- `GET /listings/:id`
- `POST /listings` — JWT required
- `DELETE /listings/:id` — JWT + ownership required
- `GET /sales` — recent sales (max 20)
- `GET /sales/nft/:contractAddress/:tokenId`
- `GET /sales/user/:walletAddress`
- `GET /royalties/:walletAddress` — claimable balance
- `GET /royalties/history/:walletAddress`
- `POST /royalties/claim` — JWT required
- `GET /analytics/volume` — daily/weekly/all-time (cached 5min)
- `GET /analytics/top-nfts`
- `GET /analytics/stats`
- `GET /health`

## Docker

```bash
docker-compose up -d
```
