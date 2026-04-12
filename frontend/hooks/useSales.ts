'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useRecentSales(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['sales', 'recent', params],
    queryFn: () => api.sales.list(params).then((r) => r.data!),
  });
}

export function useSalesByNFT(contractAddress: string, tokenId: string) {
  return useQuery({
    queryKey: ['sales', 'nft', contractAddress, tokenId],
    queryFn: () => api.sales.byNFT(contractAddress, tokenId).then((r) => r.data!),
    enabled: !!contractAddress && !!tokenId,
  });
}

export function useSalesByUser(address: string, params?: { page?: number; limit?: number; role?: string }) {
  return useQuery({
    queryKey: ['sales', 'user', address, params],
    queryFn: () => api.sales.byUser(address, params).then((r) => r.data!),
    enabled: !!address,
  });
}