require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  stellar: {
    network: process.env.STELLAR_NETWORK || 'testnet',
    horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
    rpcUrl: process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
    source: process.env.STELLAR_SOURCE,
    sourceSecret: process.env.STELLAR_SOURCE_SECRET,
  },
  contracts: {
    paymentTokenId: process.env.PAYMENT_TOKEN_ID,
    royaltyPoolId: process.env.ROYALTY_POOL_ID,
    nftCollectionId: process.env.NFT_COLLECTION_ID,
    marketplaceId: process.env.MARKETPLACE_ID,
    creatorAddress: process.env.CREATOR_ADDRESS,
    stakersAddress: process.env.STAKERS_ADDRESS,
    treasuryAddress: process.env.TREASURY_ADDRESS,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  cache: {
    ttlListings: parseInt(process.env.CACHE_TTL_LISTINGS || '30', 10),
    ttlNfts: parseInt(process.env.CACHE_TTL_NFTS || '60', 10),
    ttlAnalytics: parseInt(process.env.CACHE_TTL_ANALYTICS || '300', 10),
  },
  cors: {
    origin: process.env.FRONTEND_ORIGIN || '*',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};
