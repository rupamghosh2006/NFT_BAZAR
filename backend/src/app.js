require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const corsMiddleware = require('./middleware/cors');
const { requestIdMiddleware, logger } = require('./middleware/requestLogger');
const { globalLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const {
  authRoutes,
  nftRoutes,
  listingRoutes,
  saleRoutes,
  royaltyRoutes,
  analyticsRoutes,
  mintRoutes,
  uploadRoutes,
  sorobanMintRoutes,
  sorobanMarketplaceRoutes,
} = require('./routes');

const app = express();

app.use(requestIdMiddleware);
app.use(corsMiddleware);
app.use(globalLimiter);
app.use(logger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

app.use('/auth', authRoutes);
app.use('/nfts', nftRoutes);
app.use('/listings', listingRoutes);
app.use('/sales', saleRoutes);
app.use('/royalties', royaltyRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/mint', mintRoutes);
app.use('/upload', uploadRoutes);
app.use('/soroban/mint', sorobanMintRoutes);
app.use('/soroban/marketplace', sorobanMarketplaceRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Endpoint not found' },
  });
});

app.use(errorHandler);

module.exports = app;
