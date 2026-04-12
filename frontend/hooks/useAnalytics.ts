'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useVolumeAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'volume'],
    queryFn: () => api.analytics.volume().then((r) => r.data!),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopNfts(limit = 10) {
  return useQuery({
    queryKey: ['analytics', 'topNfts', limit],
    queryFn: () => api.analytics.topNfts(limit).then((r) => r.data!),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketStats() {
  return useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: () => api.analytics.stats().then((r) => r.data!),
    staleTime: 5 * 60 * 1000,
  });
}