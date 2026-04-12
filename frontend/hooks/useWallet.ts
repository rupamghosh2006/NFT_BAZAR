'use client';

import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useWalletStore } from '@/lib/store';

export const STELLAR_NETWORK_PASSHRASE =
  process.env.NEXT_PUBLIC_NETWORK === 'testnet'
    ? 'Test SDF Network ; September 2015'
    : 'Public Global Stellar Network ; December 2020';

async function loadFreighter() {
  const freighter = await import('@stellar/freighter-api');
  return freighter;
}

export function useWallet() {
  const { address, isConnected, isConnecting, network, setWallet, disconnect, setConnecting } =
    useWalletStore();
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const freighter = await loadFreighter();
      const result = await freighter.requestAccess();
      if (result.error || !result.address) {
        if (mountedRef.current) {
          toast.error(result.error?.message || 'Freighter connection rejected');
        }
        return;
      }
      if (mountedRef.current) {
        setWallet(result.address, result.address, STELLAR_NETWORK_PASSHRASE);
        toast.success(`Connected: ${result.address.slice(0, 6)}...`);
      }
    } catch (err: any) {
      if (mountedRef.current) {
        const msg = err?.message || 'Failed to connect wallet';
        if (msg.includes('freighter') || msg.includes('Freighter') || msg.includes('extension')) {
          toast.error('Freighter extension not found. Please install it from freighter.app');
        } else {
          toast.error(msg);
        }
      }
    } finally {
      if (mountedRef.current) setConnecting(false);
    }
  }, [setWallet, setConnecting]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    toast.success('Wallet disconnected');
  }, [disconnect]);

  useEffect(() => {
    let cancelled = false;
    async function checkExisting() {
      try {
        const freighter = await loadFreighter();
        const connected = await freighter.isConnected();
        if (cancelled || !connected.isConnected) return;
        const result = await freighter.getAddress();
        if (cancelled || result.error || !result.address) return;
        setWallet(result.address, result.address, STELLAR_NETWORK_PASSHRASE);
      } catch {
        // ignore auto-connect failures
      }
    }
    checkExisting();
    return () => { cancelled = true; };
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
