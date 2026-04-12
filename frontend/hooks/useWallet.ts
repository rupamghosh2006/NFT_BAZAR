'use client';

import { useCallback, useEffect } from 'react';
import { isFreighterConnected, getFreighterPublicKey } from '@/lib/freighter';
import { useWalletStore } from '@/lib/store';
import { STELLAR_NETWORK_PASSHRASE } from '@/lib/freighter';

export function useWallet() {
  const { address, isConnected, isConnecting, network, setWallet, disconnect, setConnecting } =
    useWalletStore();

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const connected = await isFreighterConnected();
      if (!connected) {
        throw new Error('Freighter wallet not installed. Please install it from freighter.app');
      }
      const publicKey = await getFreighterPublicKey();
      if (!publicKey) throw new Error('Failed to get public key from Freighter');
      setWallet(publicKey, publicKey, STELLAR_NETWORK_PASSHRASE);
    } catch (err: any) {
      console.error('Wallet connect error:', err);
      setWallet(null, null, null);
    }
  }, [setWallet, setConnecting]);

  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  useEffect(() => {
    async function checkExisting() {
      try {
        const connected = await isFreighterConnected();
        if (connected) {
          const pk = await getFreighterPublicKey();
          if (pk) {
            setWallet(pk, pk, STELLAR_NETWORK_PASSHRASE);
          }
        }
      } catch {
        // ignore
      }
    }
    checkExisting();
  }, [setWallet]);

  return {
    address,
    isConnected,
    isConnecting,
    network,
    connect,
    disconnect: disconnectWallet,
  };
}