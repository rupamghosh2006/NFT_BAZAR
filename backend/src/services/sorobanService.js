const {
  StrKey,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  BASE_FEE,
  Address,
  xdr,
  nativeToScVal,
  rpc,
} = require('@stellar/stellar-sdk');
const config = require('../configs');

const RPC_URL = process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const sorobanServer = new rpc.Server(RPC_URL);

class SorobanContractService {
  /**
   * Invoke a Soroban contract function
   * @param {string} contractId - Contract address
   * @param {string} method - Method name
   * @param {Array} args - Method arguments (SC values)
   * @param {string} invokerAddress - Address invoking the contract (public key)
   * @returns {Promise<Object>} Transaction ready for signing
   */
  async buildContractInvokeTx(contractId, method, args, invokerAddress) {
    try {
      // Validate contract ID is a valid Stellar contract address
      if (!StrKey.isValidContract(contractId)) {
        throw new Error(`Invalid contract ID: ${contractId}`);
      }

      // Get invoker account details from Soroban RPC
      const account = await sorobanServer.getAccount(invokerAddress);

      // Convert contract ID (string) to Hash for XDR
      const contractIdBuffer = StrKey.decodeContract(contractId);

      // Build the contract invocation operation
      const invokeContractOp = Operation.invokeHostFunction({
        func: xdr.HostFunction.hostFunctionTypeInvokeContract(
          new xdr.InvokeContractArgs({
            contractAddress: xdr.ScAddress.scAddressTypeContract(
              contractIdBuffer
            ),
            functionName: Buffer.from(method, 'utf-8'),
            args: args || [],
          })
        ),
        auth: [],
      });

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET,
      })
        .addOperation(invokeContractOp)
        .setTimeout(300)
        .build();

      // Serialize for transmission
      const txXDR = tx.toEnvelope().toXDR('base64');

      return {
        success: true,
        transactionXDR: txXDR,
      };
    } catch (error) {
      console.error('Error building contract invoke transaction:', error);
      throw error;
    }
  }

  /**
   * Submit a signed transaction to the network
   * @param {string} signedTxXDR - Signed transaction XDR
   * @returns {Promise<Object>} Transaction result
   */
  async submitTransaction(signedTxXDR) {
    try {
      const result = await sorobanServer.sendTransaction(signedTxXDR);
      console.log('Transaction submitted:', result);
      return result;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction to be confirmed
   * @param {string} txHash - Transaction hash
   * @param {number} timeoutSeconds - Timeout in seconds
   * @returns {Promise<Object>} Transaction result
   */
  async waitForTransaction(txHash, timeoutSeconds = 60) {
    const startTime = Date.now();
    const maxWaitTime = timeoutSeconds * 1000;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const tx = await sorobanServer.getTransaction(txHash);
        if (tx.status !== 'PENDING') {
          return tx;
        }
      } catch (error) {
        console.log(`Waiting for transaction ${txHash}...`);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    throw new Error(`Transaction ${txHash} not confirmed within ${timeoutSeconds} seconds`);
  }

  /**
   * Convert value to Soroban SC value
   * Handles u64, i128, string, and address types
   * @param {*} value - Value to convert
   * @param {string} type - Type hint: 'u64', 'i128', 'string', 'address', 'bytes'
   * @returns {Object} SC value (xdr format)
   */
  valueToScVal(value, type = 'string') {
    try {
      switch (type) {
        case 'u64':
          return xdr.ScVal.scValTypeU64(new xdr.Uint64(BigInt(value)));

        case 'i128': {
          const bigValue = BigInt(value);
          const lo = new xdr.Uint64(bigValue & BigInt('0xFFFFFFFFFFFFFFFF'));
          const hi = new xdr.Int64(bigValue >> BigInt(64));
          return xdr.ScVal.scValTypeI128(new xdr.Int128Parts({ lo, hi }));
        }

        case 'string': {
          const stringBytes = Buffer.from(value, 'utf-8');
          return xdr.ScVal.scValTypeSymbol(stringBytes);
        }

        case 'address': {
          return xdr.ScVal.scValTypeAddress(
            xdr.ScAddress.scAddressTypeAccountId(
              xdr.PublicKey.publicKeyTypeEd25519(xdr.Uint256.fromXDR(Address.fromString(value).buffer, 'hex'))
            )
          );
        }

        case 'bytes': {
          const bytes = typeof value === 'string' ? Buffer.from(value, 'utf-8') : Buffer.from(value);
          return xdr.ScVal.scValTypeBytes(new xdr.SCBytes(bytes));
        }

        default:
          return nativeToScVal(value);
      }
    } catch (error) {
      console.error(`Error converting value to SC val for type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get account info from Soroban
   * @param {string} address - Account address
   * @returns {Promise<Object>} Account info
   */
  async getAccount(address) {
    try {
      const account = await sorobanServer.getAccount(address);
      return account;
    } catch (error) {
      console.error('Error getting account:', error);
      throw error;
    }
  }

  /**
    * Simpler address conversion to SC value
    * @param {string} address - Stellar address
    * @returns {Object} SC Address value
    */
  addressToScVal(address) {
    try {
      const addr = Address.fromString(address);
      return addr.toScVal();
    } catch (error) {
      console.error('Error converting address to SC val:', error);
      throw error;
    }
  }

  /**
    * String to SC symbol
    * @param {string} str - String to convert
    * @returns {Object} SC symbol value
    */
  stringToScVal(str) {
    return nativeToScVal(str);
  }

  /**
    * Number to u64 SC value
    * @param {number|string|BigInt} num - Number to convert
    * @returns {Object} SC u64 value
    */
  u64ToScVal(num) {
    return nativeToScVal(BigInt(num));
  }

  /**
    * Number to i128 SC value
    * @param {number|string|BigInt} num - Number to convert
    * @returns {Object} SC i128 value
    */
  i128ToScVal(num) {
    return nativeToScVal(BigInt(num));
  }
}

module.exports = new SorobanContractService();
