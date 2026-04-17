'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useSorobanTransaction } from '@/hooks/useSorobanTransaction';
import { useNFTsByOwner } from '@/hooks/useNFTs';
import { WalletButton } from '@/components/layout/WalletButton';
import { CardSkeleton } from '@/components/ui';
import { toastTxPending, toastTxSuccess, toastTxError } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export default function ListNFTSorobanPage() {
  const { address, isConnected } = useWallet();
  const { signTransaction } = useSorobanTransaction();
  const queryClient = useQueryClient();

  const [selectedNft, setSelectedNft] = useState<any | null>(null);
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'select' | 'review' | 'sign'>('select');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: nfts, isLoading } = useNFTsByOwner(address || '', { limit: 50 });
  const nftList = Array.isArray(nfts) ? nfts : (nfts?.data ?? []);
  const availableNfts = nftList.filter((n) => !n.listing?.active);

  const handleSelectNft = (nft: any) => {
    setSelectedNft(nft);
    setPrice('');
    setStep('review');
  };

  const handleList = async () => {
    if (!selectedNft || !price || parseFloat(price) <= 0 || !address) {
      toastTxError('Please enter a valid price');
      return;
    }

    toastTxPending();
    setIsSubmitting(true);
    try {
      // Convert price from XLM to stroops (1 XLM = 10,000,000 stroops)
      const priceInStroops = BigInt(Math.floor(parseFloat(price) * 10000000)).toString();

      // Step 1: Build unsigned transaction
      const buildResponse = await api.soroban.marketplace.list.build(
        selectedNft.contractAddress,
        address,
        parseInt(selectedNft.tokenId),
        priceInStroops
      );

      if (!buildResponse.success) {
        throw new Error(buildResponse.error?.message || 'Failed to build transaction');
      }

      const { transactionXDR, listingRequestId } = buildResponse.data!;

      // Step 2: Sign with Freighter
      const signedTxXDR = await signTransaction(transactionXDR, address);

      // Step 3: Submit signed transaction
      // We'll use a placeholder txHash - the backend will get the real one from Soroban RPC
      const txHash = Buffer.from(signedTxXDR).toString('base64').slice(0, 64);
      
      const submitResponse = await api.soroban.marketplace.list.submit(
        signedTxXDR,
        listingRequestId,
        selectedNft.contractAddress,
        parseInt(selectedNft.tokenId),
        address,
        priceInStroops,
        txHash
      );

      if (!submitResponse.success) {
        throw new Error(submitResponse.error?.message || 'Failed to submit transaction');
      }

      toastTxSuccess(
        <div className="flex flex-col gap-2">
          <div>NFT "{selectedNft.name}" listed successfully!</div>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${selectedNft.contractAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 underline text-sm flex items-center gap-1"
          >
            View on Stellar Explorer
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0V4m0 2H12" />
            </svg>
          </a>
        </div>
      );

      queryClient.invalidateQueries({ queryKey: ['nfts', 'owner', address] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      
      setSelectedNft(null);
      setPrice('');
      setStep('select');
    } catch (err: any) {
      toastTxError(err.message || 'Failed to list NFT');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 text-primary-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white/80 mb-2">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6">Connect your Freighter wallet to list NFTs for sale on Stellar testnet</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-white">List NFT for Sale</h1>
          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">Soroban</span>
        </div>
        <p className="text-white/50">Select an NFT from your collection and set a price. The listing will be recorded on-chain via Soroban contract.</p>
      </div>

      {step === 'select' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : availableNfts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">No NFTs available to list</p>
              <Link href="/mint-soroban" className="text-primary-400 hover:text-primary-300">
                Create your first NFT →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {availableNfts.map((nft) => (
                <button
                  key={nft.id}
                  onClick={() => handleSelectNft(nft)}
                  className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  <img
                    src={getImageUrl(nft.image)}
                    alt={nft.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white font-medium text-sm truncate">{nft.name}</p>
                    <p className="text-white/60 text-xs">Token #{nft.tokenId}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {step === 'review' && selectedNft && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-32 h-32">
                <img
                  src={getImageUrl(selectedNft.image)}
                  alt={selectedNft.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedNft.name}</h2>
                <p className="text-white/60 text-sm mb-4">Contract: {selectedNft.contractAddress.slice(0, 8)}...</p>
                <p className="text-white/60 text-sm">Token ID: {selectedNft.tokenId}</p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="block text-sm font-medium text-white/70 mb-3">Set Price (XLM)</label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price in XLM"
                  step="0.01"
                  min="0"
                  className="input-field flex-1"
                />
                <div className="flex items-end">
                  <span className="text-white/60 text-sm">XLM</span>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-2">
                {price ? `${price} XLM = ${(parseFloat(price) * 10000000).toLocaleString()} stroops` : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('select')}
              disabled={isSubmitting}
              className="btn-secondary flex-1 py-3"
            >
              Back
            </button>
            <button
              onClick={handleList}
              disabled={isSubmitting || !price || parseFloat(price) <= 0}
              className="btn-accent flex-1 py-3"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Listing...
                </span>
              ) : (
                'List NFT'
              )}
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
