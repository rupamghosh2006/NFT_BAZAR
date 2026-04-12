require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('./db/mongo');
const prisma = require('./db/prisma');
require('./configs/redis');

require('./worker/indexerWorker');
require('./worker/royaltyWorker');

console.log('[Worker] All workers started');

process.on('SIGTERM', async () => {
  console.log('[Worker] SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
