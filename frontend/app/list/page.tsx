'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useWallet } from '@/hooks/useWallet';
import { useNFTsByOwner } from '@/hooks/useNFTs';
import { WalletButton } from '@/components/layout/WalletButton';
import { CardSkeleton } from '@/components/ui';
import { getImageUrl, cn } from '@/lib/utils';
import { formatLumens } from '@/lib/constants';
import toast from 'react-hot-toast';

export default function ListNFTPage() {
  const { address, isConnected } = useWallet();
  const [selectedNft, setSelectedNft] = useState<string | null>(null);
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'select' | 'approve' | 'list'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: nfts, isLoading } = useNFTsByOwner(address || '', { limit: 50 });

  const nftList = Array.isArray(nfts) ? nfts : (nfts?.data ?? []);
  const availableNfts = nftList.filter((n) => !n.listing?.active);

  const handleList = async () => {
    if (!selectedNft || !price || parseFloat(price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }
    setIsSubmitting(true);
    setStep('list');
    try {
      // In production: call Stellar Soroban contract
      await new Promise((resolve) => setTimeout(resolve, 3000));
      toast.success('NFT listed successfully!');
      setSelectedNft(null);
      setPrice('');
      setStep('select');
    } catch (err: any) {
      toast.error(err.message || 'Failed to list NFT');
      setStep('approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-xl font-semibold text-white/60 mb-4">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6 text-sm">Connect your Freighter wallet to list NFTs</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">List NFT for Sale</h1>
      <p className="text-white/50 text-sm mb-8">Select an NFT from your collection and set a price</p>

      {step === 'select' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : availableNfts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-white/40 mb-2">No NFTs available to list</p>
              <p className="text-xs text-white/30">All your NFTs are already listed or you have none</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableNfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => setSelectedNft(nft.id)}
                  className={cn(
                    'card text-left p-0 overflow-hidden transition-all',
                    selectedNft === nft.id
                      ? 'ring-2 ring-primary-500 border-primary-500/50'
                      : 'hover:border-white/20'
                  )}
                >
                  <div className="relative aspect-square bg-dark-200">
                    <Image
                      src={getImageUrl(nft.image)}
                      alt={nft.name || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-white truncate">{nft.name || `#${nft.tokenId}`}</p>
                    <p className="text-xs text-white/40 mt-0.5">#{nft.tokenId}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedNft && (
            <div className="mt-8 bg-dark-100 rounded-2xl p-6 border border-white/5">
              <h3 className="font-semibold text-white mb-4">Set Your Price</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    min="0"
                    step="0.0000001"
                    placeholder="0.0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="input-field text-lg font-bold"
                  />
                  <p className="text-xs text-white/40 mt-1">Price in XLM</p>
                </div>
                <button
                  onClick={() => setStep('approve')}
                  disabled={!price || parseFloat(price) <= 0}
                  className="btn-primary self-end"
                >
                  Continue
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {step === 'approve' && (
        <div className="bg-dark-100 rounded-2xl p-8 border border-white/5 text-center">
          <div className="w-12 h-12 bg-accent-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Approve Marketplace</h3>
          <p className="text-sm text-white/50 mb-6">Approve the marketplace to transfer your NFT</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => setStep('select')} className="btn-secondary">
              Back
            </button>
            <button
              onClick={() => setStep('list')}
              className="btn-primary"
            >
              Approve
            </button>
          </div>
        </div>
      )}

      {step === 'list' && (
        <div className="bg-dark-100 rounded-2xl p-8 border border-primary-500/20 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Confirm Listing</h3>
          <p className="text-sm text-white/50 mb-6">
            Listing for <span className="text-accent-500 font-bold">{price} XLM</span>
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => { setStep('select'); setSelectedNft(null); setPrice(''); }}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleList}
              disabled={isSubmitting}
              className="btn-accent min-w-[140px]"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Listing...
                </span>
              ) : 'Confirm & List'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
