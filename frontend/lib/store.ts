import { create } from 'zustand';
import type { WalletState } from '@/types';

interface WalletStore extends WalletState {
  setWallet: (address: string | null, publicKey: string | null, network: string | null) => void;
  disconnect: () => void;
  setConnecting: (val: boolean) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  address: null,
  publicKey: null,
  isConnected: false,
  isConnecting: false,
  network: null,
  setWallet: (address, publicKey, network) =>
    set({ address, publicKey, isConnected: !!address, isConnecting: false, network }),
  disconnect: () =>
    set({ address: null, publicKey: null, isConnected: false, isConnecting: false, network: null }),
  setConnecting: (val) => set({ isConnecting: val }),
}));