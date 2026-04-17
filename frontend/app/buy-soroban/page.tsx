'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useSorobanTransaction } from '@/hooks/useSorobanTransaction';
import { WalletButton } from '@/components/layout/WalletButton';
import { toastTxPending, toastTxSuccess, toastTxError, CardSkeleton } from '@/components/ui';
import { getImageUrl } from '@/lib/utils';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

interface ListingWithNFT {
  id: string;
  nftId: string;
  sellerAddress: string;
  price: string;
  active: boolean;
  createdAt: string;
  nft: {
    id: string;
    tokenId: string;
    contractAddress: string;
    ownerAddress: string;
    metadataUri: string;
    name: string;
    image: string;
  };
}

export default function BuyNFTSorobanPage() {
  const { address, isConnected } = useWallet();
  const { signTransaction } = useSorobanTransaction();
  const queryClient = useQueryClient();

  const [listings, setListings] = useState<ListingWithNFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<ListingWithNFT | null>(null);
  const [step, setStep] = useState<'browse' | 'confirm' | 'sign'>('browse');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadListings = async () => {
      try {
       const response = await api.listings.list({ limit: 100 });
         // Filter listings that have NFT data populated
         const validListings = (response.data || []).filter((l: any) => l.nft && l.active) as ListingWithNFT[];
         setListings(validListings);
      } catch (err) {
        console.error('Failed to load listings:', err);
        toastTxError('Failed to load listings');
      } finally {
        setIsLoading(false);
      }
    };

    loadListings();
  }, []);

  const handleSelectListing = (listing: ListingWithNFT) => {
    if (address && listing.sellerAddress.toLowerCase() === address.toLowerCase()) {
      toastTxError("You can't buy your own NFT");
      return;
    }
    setSelectedListing(listing);
    setStep('confirm');
  };

  const handleBuy = async () => {
    if (!selectedListing || !address) return;

    toastTxPending();
    setIsSubmitting(true);
    try {
      // Step 1: Build unsigned transaction
      const buildResponse = await api.soroban.marketplace.buy.build(
        selectedListing.nft.contractAddress,
        address,
        parseInt(selectedListing.nft.tokenId)
      );

      if (!buildResponse.success) {
        throw new Error(buildResponse.error?.message || 'Failed to build transaction');
      }

      const { transactionXDR, buyRequestId } = buildResponse.data!;

      // Step 2: Sign with Freighter
      const signedTxXDR = await signTransaction(transactionXDR, address);

      // Step 3: Submit signed transaction
      const txHash = Buffer.from(signedTxXDR).toString('base64').slice(0, 64);
      
      const submitResponse = await api.soroban.marketplace.buy.submit(
        signedTxXDR,
        buyRequestId,
        selectedListing.nft.contractAddress,
        parseInt(selectedListing.nft.tokenId),
        address,
        selectedListing.price,
        txHash
      );

      if (!submitResponse.success) {
        throw new Error(submitResponse.error?.message || 'Failed to submit transaction');
      }

      toastTxSuccess(
        <div className="flex flex-col gap-2">
          <div>NFT "{selectedListing.nft.name}" purchased successfully!</div>
          <a
            href={`https://stellar.expert/explorer/testnet/contract/${selectedListing.nft.contractAddress}`}
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

      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      
      setSelectedListing(null);
      setStep('browse');
      
      // Reload listings
      const response = await api.listings.list({ limit: 100 });
      const validListings = (response.data || []).filter((l: any) => l.nft && l.active) as ListingWithNFT[];
      setListings(validListings);
    } catch (err: any) {
      toastTxError(err.message || 'Failed to buy NFT');
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
        <p className="text-white/40 mb-6">Connect your Freighter wallet to purchase NFTs on Stellar testnet</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-white">Buy NFTs</h1>
          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">Soroban</span>
        </div>
        <p className="text-white/50">Browse listed NFTs and purchase them using on-chain Soroban contracts. Transactions are recorded on Stellar testnet.</p>
      </div>

      {step === 'browse' && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-4">No NFTs listed for sale yet</p>
              <Link href="/list-soroban" className="text-primary-400 hover:text-primary-300">
                Be the first to list an NFT →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => handleSelectListing(listing)}
                  className="group relative overflow-hidden rounded-lg border border-white/10 hover:border-primary-500/50 transition-all cursor-pointer"
                >
                  <img
                    src={getImageUrl(listing.nft.image)}
                    alt={listing.nft.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                    <p className="text-white font-medium text-sm truncate">{listing.nft.name}</p>
                    <p className="text-primary-400 font-semibold text-sm">
                      {(parseInt(listing.price) / 10000000).toFixed(7)} XLM
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {step === 'confirm' && selectedListing && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-32 h-32">
                <img
                  src={getImageUrl(selectedListing.nft.image)}
                  alt={selectedListing.nft.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedListing.nft.name}</h2>
                <p className="text-white/60 text-sm mb-4">
                  Contract: {selectedListing.nft.contractAddress.slice(0, 8)}...
                </p>
                <p className="text-white/60 text-sm mb-4">
                  Token ID: {selectedListing.nft.tokenId}
                </p>
                <div className="bg-primary-500/10 border border-primary-500/20 rounded p-3">
                  <p className="text-sm text-white/70">Price:</p>
                  <p className="text-2xl font-bold text-primary-400">
                    {(parseInt(selectedListing.price) / 10000000).toFixed(7)} XLM
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-white/60 mb-3">Seller: {selectedListing.sellerAddress.slice(0, 8)}...</p>
              <p className="text-xs text-white/40">
                By clicking Buy, you'll sign a transaction with Freighter wallet to purchase this NFT on-chain.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('browse')}
              disabled={isSubmitting}
              className="btn-secondary flex-1 py-3"
            >
              Cancel
            </button>
            <button
              onClick={handleBuy}
              disabled={isSubmitting}
              className="btn-accent flex-1 py-3"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Purchasing...
                </span>
              ) : (
                'Confirm Purchase'
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
