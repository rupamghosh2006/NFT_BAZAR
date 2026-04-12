const { server, StellarSdk, getSourceKeypair } = require('../configs/stellar');
const config = require('../configs');

class StellarService {
  validateAddress(address) {
    try {
      return StellarSdk.StrKey.isValidEd25519PublicKey(address);
    } catch {
      return false;
    }
  }

  async getAccount(address) {
    return server.loadAccount(address);
  }

  async getBalances(address) {
    const account = await this.getAccount(address);
    return account.balances.map((b) => ({
      balance: b.balance,
      asset: b.asset_type === 'native' ? 'XLM' : b.asset_code || b.asset_type,
      assetType: b.asset_type,
      limit: b.limit || null,
    }));
  }

  async getAccountSequence(address) {
    const account = await this.getAccount(address);
    return account.sequenceNumber();
  }

  buildPaymentTransaction(from, to, amount, assetCode = 'XLM') {
    const sourceKeypair = getSourceKeypair();
    if (!sourceKeypair) throw new Error('Stellar source keypair not configured');

    const asset = assetCode === 'XLM'
      ? StellarSdk.Asset.native()
      : new StellarSdk.Asset(assetCode, config.contracts.paymentTokenId);

    return StellarSdk.TransactionBuilder, {
      source: sourceKeypair.publicKey(),
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    }).addOperation(StellarSdk.Operation.payment({
      destination: to,
      asset,
      amount,
    })).setTimeout(30).build();
  }

  async submitTransaction(transaction) {
    return server.submitTransaction(transaction);
  }

  async getTransaction(txHash) {
    return server.transactions().transaction(txHash).call();
  }

  async getContractEvents(contractId, cursor = null, limit = 10) {
    const options = { limit, cursor };
    return server.transactions().forAccount(contractId).call(options);
  }

  async pingHorizon() {
    try {
      await server.server.getInfo();
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = new StellarService();
