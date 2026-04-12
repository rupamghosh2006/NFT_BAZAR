require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const app = require('./app');
const config = require('./configs');
const { connectMongo } = require('./db/mongo');
const prisma = require('./db/prisma');
const redis = require('./configs/redis');

async function start() {
  try {
    await connectMongo().catch((err) => console.warn('MongoDB connect failed:', err.message));
    await prisma.$connect().catch((err) => console.warn('PostgreSQL connect failed:', err.message));
    await redis.ping().catch((err) => console.warn('Redis connect failed:', err.message));

    const server = app.listen(config.port, () => {
      console.log(`[Server] NFT Bazar Backend running on port ${config.port}`);
      console.log(`[Server] Environment: ${config.nodeEnv}`);
    });

    const gracefulShutdown = async (signal) => {
      console.log(`[Server] ${signal} received, shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect().catch(() => {});
        console.log('[Server] Shutdown complete');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
