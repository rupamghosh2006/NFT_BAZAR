'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';

export const STELLAR_NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK === 'testnet'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; December 2020';

async function loadFreighter() {
  const freighter = await import('@stellar/freighter-api');
  return freighter;
}

export function useSorobanTransaction() {
  /**
   * Sign a transaction with Freighter
   * @param {string} transactionXDR - Unsigned transaction XDR
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<string>} Signed transaction XDR
   */
  const signTransaction = useCallback(async (transactionXDR: string, walletAddress: string): Promise<string> => {
    try {
      const freighter = await loadFreighter();

      // Sign the transaction
      const result = await freighter.signTransaction(transactionXDR, {
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        address: walletAddress,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Transaction signing failed');
      }

      if (!result.signedTxXdr) {
        throw new Error('Failed to get signed transaction from Freighter');
      }

      // Handle both string and Buffer return types
      return (typeof result.signedTxXdr === 'string' 
        ? result.signedTxXdr 
        : (result.signedTxXdr as any).toString('base64')) as string;
    } catch (err: any) {
      console.error('Error signing transaction:', err);
      throw err;
    }
  }, []);

  /**
   * Sign auth entry for contract invocation
   * @param {string} entry - Auth entry to sign
   * @param {string} walletAddress - Wallet address
   * @returns {Promise<string>} Signed auth entry
   */
  const signAuthEntry = useCallback(async (entry: string, walletAddress: string): Promise<string> => {
    try {
      const freighter = await loadFreighter();

      const result = await freighter.signAuthEntry(entry, {
        networkPassphrase: STELLAR_NETWORK_PASSPHRASE,
        address: walletAddress,
      });

      if (result.error) {
        throw new Error(result.error.message || 'Auth entry signing failed');
      }

      if (!result.signedAuthEntry) {
        throw new Error('Failed to get signed auth entry from Freighter');
      }

      // Handle both string and Buffer return types
      return (typeof result.signedAuthEntry === 'string' 
        ? result.signedAuthEntry 
        : (result.signedAuthEntry as any).toString('base64')) as string;
    } catch (err: any) {
      console.error('Error signing auth entry:', err);
      throw err;
    }
  }, []);

  return {
    signTransaction,
    signAuthEntry,
  };
}
