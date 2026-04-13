'use client';

import { useState, useEffect, useRef, Key } from 'react';
import { gsap } from 'gsap';
import { useListings } from '@/hooks/useNFTs';
import { NFTCard } from '@/components/nft/NFTCard';
import { CardSkeleton } from '@/components/ui';
import { NFT } from '@/types';

function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(headingRef.current, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 })
      .fromTo(subRef.current, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4');
  }, []);

  return (
    <div className="text-center mb-8">
      <h1 ref={headingRef} className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 opacity-0">
        Discover, Collect &amp;{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-500">
          Trade NFTs
        </span>
      </h1>
      <p ref={subRef} className="text-white/50 text-sm max-w-md mx-auto opacity-0">
        Decentralized NFT marketplace on Stellar with automatic royalty splitting.
      </p>
    </div>
  );
}

export default function HomePage() {
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useListings({ page, limit: 20, sortBy, sortOrder });

  const listings = Array.isArray(data) ? data : (data as any)?.data ?? [];
  const pagination = Array.isArray(data) ? null : (data as any)?.pagination ?? null;
  const filteredNfts = search
    ? listings.filter((l: { nft: { name: string; tokenId: string | string[]; }; }) =>
        l.nft?.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.nft?.tokenId?.includes(search)
      )
    : listings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <Hero />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search NFTs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field flex-1 text-sm"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field w-full sm:w-auto text-sm">
          <option value="createdAt">Newest</option>
          <option value="price">Price</option>
        </select>
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input-field w-full sm:w-auto text-sm">
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          : filteredNfts.map((listing: any) => (
              <NFTCard key={listing.id} nft={{ ...listing.nft!, listing }} />
            ))}
      </div>

      {/* Empty */}
      {!isLoading && filteredNfts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-12 h-12 mx-auto mb-3 text-white/20">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-white/40 text-sm">No NFTs listed yet</p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-3 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm">
            Previous
          </button>
          <span className="flex items-center text-sm text-white/50 px-4">
            {page} / {pagination.totalPages}
          </span>
          <button onClick={() => setPage((p) => p + 1)} disabled={!pagination.hasMore} className="btn-secondary text-sm">
            Next
          </button>
        </div>
      )}
    </div>
  );
}