'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useListings(params?: {
  page?: number;
  limit?: number;
  contractAddress?: string;
  seller?: string | null;
  sortBy?: string;
  sortOrder?: string;
}) {
  const cleanParams = params ? Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  ) : undefined;
  return useQuery({
    queryKey: ['listings', params],
    queryFn: () => api.listings.list(cleanParams as Parameters<typeof api.listings.list>[0]).then((r) => r.data!),
  });
}

export function useNFTList(params?: {
  page?: number;
  limit?: number;
  owner?: string;
  contractAddress?: string;
  listed?: boolean;
}) {
  return useQuery({
    queryKey: ['nfts', params],
    queryFn: () => api.nfts.list(params).then((r) => r.data!),
    enabled: true,
  });
}

export function useNFT(contractAddress: string, tokenId: string) {
  return useQuery({
    queryKey: ['nft', contractAddress, tokenId],
    queryFn: () => api.nfts.get(contractAddress, tokenId).then((r) => r.data!),
    enabled: !!contractAddress && !!tokenId,
  });
}

export function useNFTsByOwner(address: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['nfts', 'owner', address, params],
    queryFn: () => api.nfts.byOwner(address, params),
    enabled: !!address,
  });
}

