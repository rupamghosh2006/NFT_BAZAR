import { isConnected, getAddress, signTransaction } from '@stellar/freighter-api';

export const STELLAR_NETWORK_PASSHRASE =
  process.env.NEXT_PUBLIC_NETWORK === 'testnet'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; December 2020';

export async function isFreighterConnected(): Promise<boolean> {
  try {
    const result = await isConnected();
    if (result.error) return false;
    return result.isConnected;
  } catch {
    return false;
  }
}

export async function getFreighterPublicKey(): Promise<string | null> {
  try {
    const result = await getAddress();
    if (result.error) {
      console.error('Freighter error:', result.error);
      return null;
    }
    return result.address;
  } catch {
    return null;
  }
}

export async function signFreighterTransaction(transactionXDR: string): Promise<string | null> {
  try {
    const result = await signTransaction(transactionXDR, {
      networkPassphrase: STELLAR_NETWORK_PASSHRASE,
    });
    if (result.error) return null;
    return result.signedTxXdr;
  } catch {
    return null;
  }
}
