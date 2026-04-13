'use client';

import { useState } from 'react';
import { useListings } from '@/hooks/useNFTs';
import { NFTCard } from '@/components/nft/NFTCard';
import { LiveSaleFeed } from '@/components/nft/LiveSaleFeed';
import { CardSkeleton } from '@/components/ui';

export default function HomePage() {
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching } = useListings({
    page,
    limit: 20,
    sortBy,
    sortOrder,
  });

  const listings = Array.isArray(data) ? data : data?.data ?? [];

  const filteredNfts = search
    ? listings.filter((nft) =>
        nft.nft?.name?.toLowerCase().includes(search.toLowerCase()) ||
        nft.nft?.tokenId?.includes(search)
      )
    : listings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Hero */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
          Discover, Collect &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-500">
            Trade NFTs
          </span>
        </h1>
        <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
          The decentralized NFT marketplace on Stellar with automatic royalty splitting for creators.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search NFTs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 text-sm"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field w-full sm:w-auto text-sm"
        >
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="input-field w-full sm:w-auto text-sm"
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : filteredNfts?.map((listing) => (
              <NFTCard key={listing.id} nft={{ ...listing.nft!, listing }} />
            ))}
      </div>

      {/* Empty */}
      {!isLoading && (!filteredNfts || filteredNfts.length === 0) && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 text-white/20">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white/60">No NFTs listed yet</h3>
          <p className="text-sm text-white/30 mt-1">Be the first to list an NFT!</p>
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm"
          >
            Previous
          </button>
          <span className="flex items-center text-sm text-white/50 px-4">
            {page} / {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.pagination.hasMore}
            className="btn-secondary text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}