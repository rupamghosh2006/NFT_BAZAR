'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useNFTsByOwner, useListings } from '@/hooks/useNFTs';
import { useSalesByUser } from '@/hooks/useSales';
import { NFTCard } from '@/components/nft/NFTCard';
import { CardSkeleton, EmptyState } from '@/components/ui';
import { WalletButton } from '@/components/layout/WalletButton';
import { truncateAddress } from '@/lib/constants';
import { formatLumens } from '@/lib/constants';
import { formatDate } from '@/lib/utils';

type Tab = 'owned' | 'listed' | 'sold';

export default function MyNFTsPage() {
  const { address, isConnected } = useWallet();
  const [tab, setTab] = useState<Tab>('owned');

  const { data: owned, isLoading: loadingOwned } = useNFTsByOwner(address || '', { limit: 50 });
  const { data: listings } = useListings({ seller: address, limit: 50 });
  const { data: sales, isLoading: loadingSales } = useSalesByUser(address || '', { limit: 50 });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto mb-4 text-white/20">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white/60 mb-4">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6 text-sm">Connect your Freighter wallet to view your NFTs</p>
        <WalletButton />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'owned', label: 'Owned', count: owned?.pagination.total || 0 },
    { key: 'listed', label: 'Listed', count: listings?.data.filter((l) => l.active).length || 0 },
    { key: 'sold', label: 'Sold', count: sales?.data.filter((s) => s.sellerAddress.toUpperCase() === address?.toUpperCase()).length || 0 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center font-bold text-sm">
          {address?.slice(0, 1)}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">My NFTs</h1>
          <p className="text-xs text-white/40 font-mono">{truncateAddress(address || '', 8)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-200 p-1 rounded-xl mb-6 w-fit">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary-600 text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'owned' && (
        <div>
          {loadingOwned ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : !owned?.data || owned.data.length === 0 ? (
            <EmptyState
              title="No NFTs owned"
              description="Mint or buy your first NFT"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {owned.data.map((nft) => (
                <NFTCard key={nft.id} nft={nft} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'listed' && (
        <div>
          {!listings?.data || listings.data.filter((l) => l.active).length === 0 ? (
            <EmptyState
              title="No active listings"
              description="List your NFTs to start selling"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {listings.data
                .filter((l) => l.active && l.nft)
                .map((listing) => (
                  <NFTCard key={listing.id} nft={listing.nft!} />
                ))}
            </div>
          )}
        </div>
      )}

      {tab === 'sold' && (
        <div>
          {loadingSales ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-dark-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {sales?.data
                .filter((s) => s.sellerAddress.toUpperCase() === address?.toUpperCase())
                .map((sale) => (
                  <div key={sale.id} className="card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {sale.nft?.name || `NFT #${sale.nft?.tokenId}`}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5">
                        Sold to {truncateAddress(sale.buyerAddress, 4)} • {formatDate(sale.createdAt)}
                      </p>
                    </div>
                    <span className="text-accent-500 font-bold">{formatLumens(sale.price)}</span>
                  </div>
                ))}

              {sales?.data.filter((s) => s.sellerAddress.toUpperCase() === address?.toUpperCase()).length === 0 && (
                <EmptyState title="No sales yet" description="Sold NFTs will appear here" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
