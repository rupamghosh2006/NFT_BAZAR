const { server } = require('../configs/stellar');
const redis = require('../configs/redis');
const { indexerQueue } = require('../configs/queue');
const listingService = require('../services/listingService');
const saleService = require('../services/saleService');
const config = require('../configs');

const INDEXER_KEY = 'indexer:lastProcessedLedger';

class Indexer {
  constructor() {
    this.running = false;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 60000;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    console.log('[Indexer] Starting...');
    await this.replayMissedEvents();
    this.streamEvents();
  }

  async stop() {
    this.running = false;
    if (this.eventStream) {
      this.eventStream.close();
    }
    console.log('[Indexer] Stopped');
  }

  async replayMissedEvents() {
    try {
      const lastLedger = await redis.get(INDEXER_KEY);
      const cursor = lastLedger ? `cursor=${lastLedger}` : '';
      console.log(`[Indexer] Replaying events from ledger: ${lastLedger || 'genesis'}`);
    } catch (err) {
      console.error('[Indexer] Replay error:', err.message);
    }
  }

  async updateLastLedger(ledger) {
    await redis.set(INDEXER_KEY, ledger.toString());
  }

  streamEvents() {
    try {
      this.eventStream = server.transactions()
        .forAccount(config.contracts.marketplaceId)
        .cursor('now')
        .stream({
          onmessage: (tx) => this.handleTransaction(tx),
          onerror: (err) => this.handleError(err),
        });

      console.log(`[Indexer] Streaming events from marketplace: ${config.contracts.marketplaceId}`);
      this.reconnectDelay = 1000;
    } catch (err) {
      console.error('[Indexer] Stream error:', err.message);
      this.scheduleReconnect();
    }
  }

  async handleTransaction(tx) {
    if (!tx.successful) return;

    const lastLedger = parseInt(tx.ledger_attr || '0', 10);
    await this.updateLastLedger(lastLedger);

    console.log(`[Indexer] Processing tx: ${tx.hash}, ledger: ${lastLedger}`);

    await indexerQueue.add('process-tx', {
      txHash: tx.hash,
      ledger: lastLedger,
      operations: tx.operations || [],
      sourceAccount: tx.source_account,
      createdAt: tx.created_at,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 1000,
    });
  }

  handleError(err) {
    console.error('[Indexer] Stream error:', err.message);
    this.scheduleReconnect();
  }

  scheduleReconnect() {
    if (!this.running) return;
    console.log(`[Indexer] Reconnecting in ${this.reconnectDelay}ms...`);
    setTimeout(() => {
      if (this.running) {
        this.streamEvents();
      }
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  async processTransaction(txHash, ledger, operations, sourceAccount, createdAt) {
    console.log(`[Indexer] Processing tx ${txHash} with ${operations.length} operations`);
  }
}

const indexer = new Indexer();

module.exports = indexer;
