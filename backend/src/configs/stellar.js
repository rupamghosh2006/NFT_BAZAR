const StellarSdk = require('@stellar/stellar-sdk');
const config = require('./index');

const isTestnet = config.stellar.network === 'testnet';

if (isTestnet) {
  StellarSdk.Networks.TESTNET;
  StellarSdk.Config.TESTNET;
} else {
  StellarSdk.Networks.PUBLIC;
  StellarSdk.Config.HORIZON_OKTA;
}

const server = new StellarSdk.Horizon.Server(config.stellar.horizonUrl);

function getSourceKeypair() {
  if (!config.stellar.sourceSecret) {
    return null;
  }
  return StellarSdk.Keypair.fromSecret(config.stellar.sourceSecret);
}

module.exports = {
  StellarSdk,
  server,
  isTestnet,
  getSourceKeypair,
  horizonUrl: config.stellar.horizonUrl,
};
