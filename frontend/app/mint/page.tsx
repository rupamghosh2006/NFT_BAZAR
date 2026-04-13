'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { WalletButton } from '@/components/layout/WalletButton';
import { toastTxPending, toastTxSuccess, toastTxError } from '@/components/ui';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';

const NFT_TEMPLATES = [
  {
    name: 'Cosmic Warrior',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&h=400&fit=crop',
    description: 'A brave warrior from the cosmos',
  },
  {
    name: 'Digital Phoenix',
    image: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop',
    description: 'Rising from the digital flames',
  },
  {
    name: 'Neon City',
    image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=400&h=400&fit=crop',
    description: 'A glimpse of the future city',
  },
  {
    name: 'Alien Artifact',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop',
    description: 'Mysterious object from another world',
  },
  {
    name: 'Robot Soul',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
    description: 'The heart of a machine',
  },
  {
    name: 'Space Dragon',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=400&fit=crop',
    description: 'Guardian of the galaxy',
  },
];

export default function MintPage() {
  const { address, isConnected } = useWallet();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<number | null>(null);
  const [customName, setCustomName] = useState('');
  const [minting, setMinting] = useState(false);

  const handleMint = async () => {
    if (!address) return;
    const template = selected !== null ? NFT_TEMPLATES[selected] : null;
    const name = customName.trim() || template?.name || 'Stellar NFT';

    toastTxPending();
    setMinting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address, name, image: template?.image || '' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Mint failed');
      }

      toastTxSuccess('NFT minted successfully!');
      queryClient.invalidateQueries({ queryKey: ['nfts', 'owner', address] });
      setSelected(null);
      setCustomName('');
    } catch (err: any) {
      toastTxError(err.message || 'Mint failed');
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 text-primary-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white/80 mb-2">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6">Connect your Freighter wallet to mint NFTs</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mint NFT</h1>
        <p className="text-white/50">Choose a template or create your own NFT on Stellar testnet</p>
      </div>

      {/* Custom name */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-white/70 mb-2">NFT Name (optional)</label>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Enter NFT name..."
          className="input-field max-w-md"
        />
        {customName && (
          <p className="text-xs text-white/30 mt-1">Using custom name: {`"${customName}"`}</p>
        )}
      </div>

      {/* Templates */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {NFT_TEMPLATES.map((template, i) => (
          <button
            key={i}
            onClick={() => setSelected(selected === i ? null : i)}
            className={`card text-left p-0 overflow-hidden transition-all ${
              selected === i
                ? 'ring-2 ring-primary-500 border-primary-500/50'
                : 'hover:border-white/20'
            }`}
          >
            <div className="relative aspect-square bg-dark-200">
              <img src={template.image} alt={template.name} className="w-full h-full object-cover" />
              {selected === i && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                  <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-white">{template.name}</p>
              <p className="text-xs text-white/40 mt-0.5">{template.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Mint */}
      <div className="bg-dark-100 rounded-2xl p-6 border border-white/5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="text-white font-medium">
              {selected !== null
                ? `Ready to mint: ${NFT_TEMPLATES[selected].name}`
                : customName
                ? `Ready to mint: ${customName}`
                : 'Select a template or enter a name'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {address && `Minting to: ${address.slice(0, 8)}...${address.slice(-6)}`}
            </p>
          </div>
          <button
            onClick={handleMint}
            disabled={minting || !address}
            className="btn-accent min-w-[160px] text-base py-3"
          >
            {minting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Minting...
              </span>
            ) : (
              'Mint NFT'
            )}
          </button>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}