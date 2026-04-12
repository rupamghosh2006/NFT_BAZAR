'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWalletStore } from '@/lib/store';
import toast from 'react-hot-toast';

export function useClaimable(address: string) {
  return useQuery({
    queryKey: ['royalties', 'claimable', address],
    queryFn: () => api.royalties.claimable(address).then((r) => r.data!),
    enabled: !!address,
    refetchInterval: 30000,
  });
}

export function useRoyaltyHistory(address: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['royalties', 'history', address, params],
    queryFn: () => api.royalties.history(address, params).then((r) => r.data!),
    enabled: !!address,
  });
}

export function useClaim() {
  const queryClient = useQueryClient();
  const { address } = useWalletStore();

  return useMutation({
    mutationFn: async (earningIds: string[] = []) => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/royalties/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earningIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Claim failed');
      }
      return res.json();
    },
    onSuccess: () => {
      if (address) {
        queryClient.invalidateQueries({ queryKey: ['royalties', address] });
      }
      toast.success('Claim transaction queued!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}