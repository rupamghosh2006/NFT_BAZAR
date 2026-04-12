'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { NFT } from '@/types';
import { getImageUrl, cn } from '@/lib/utils';
import { formatLumens } from '@/lib/constants';
import { useWalletStore } from '@/lib/store';

interface NFTCardProps {
  nft: NFT;
  onBuy?: (nft: NFT) => void;
  buyLoading?: boolean;
}

export function NFTCard({ nft, onBuy, buyLoading }: NFTCardProps) {
  const { address, isConnected } = useWalletStore();
  const listing = nft.listing;
  const isOwner = address && nft.ownerAddress?.toUpperCase() === address.toUpperCase();

  return (
    <div className="card group hover:border-primary-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5">
      <Link href={`/nft/${nft.contractAddress}/${nft.tokenId}`}>
        <div className="relative aspect-square overflow-hidden bg-dark-200">
          <Image
            src={getImageUrl(nft.image)}
            alt={nft.name || `NFT #${nft.tokenId}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            unoptimized
          />
          {listing?.active && (
            <div className="absolute top-2 right-2">
              <span className="badge bg-accent-500 text-dark-300 font-bold">
                {formatLumens(listing.price)}
              </span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/nft/${nft.contractAddress}/${nft.tokenId}`}>
          <h3 className="font-semibold text-white truncate group-hover:text-primary-400 transition-colors">
            {nft.name || `NFT #${nft.tokenId}`}
          </h3>
        </Link>
        <p className="text-xs text-white/40 mt-0.5">
          by {nft.ownerAddress ? `${nft.ownerAddress.slice(0, 4)}...${nft.ownerAddress.slice(-4)}` : 'Unknown'}
        </p>

        {listing?.active && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-accent-500 font-bold text-sm">
              {formatLumens(listing.price)}
            </span>
            {!isOwner && isConnected && (
              <button
                onClick={(e) => { e.preventDefault(); onBuy?.(nft); }}
                disabled={buyLoading}
                className="btn-primary text-xs py-1.5 px-3"
              >
                {buyLoading ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : 'Buy'}
              </button>
            )}
          </div>
        )}

        {!listing?.active && (
          <p className="text-xs text-white/30 mt-3">Not listed</p>
        )}
      </div>
    </div>
  );
}