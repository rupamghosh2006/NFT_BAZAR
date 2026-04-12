'use client';

import { useWallet } from '@/hooks/useWallet';
import { truncateAddress } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

  if (isConnecting) {
    return (
      <button disabled className="btn-primary text-sm py-2 px-4">
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting
        </span>
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="relative group">
        <button className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-xl transition-all text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span>{truncateAddress(address)}</span>
        </button>
        <div className="absolute right-0 top-full mt-2 w-48 bg-dark-100 border border-white/10 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="p-3 border-b border-white/5">
            <p className="text-xs text-white/40">Connected Wallet</p>
            <p className="text-sm font-mono text-white mt-0.5">{truncateAddress(address, 6)}</p>
          </div>
          <div className="p-1">
            <button
              onClick={() => navigator.clipboard.writeText(address)}
              className="w-full text-left px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Copy Address
            </button>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              View on Explorer
            </a>
            <button
              onClick={disconnect}
              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button onClick={connect} className="btn-primary text-sm py-2 px-4">
      Connect Wallet
    </button>
  );
}