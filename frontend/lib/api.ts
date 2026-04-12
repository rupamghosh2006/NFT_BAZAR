import type {
  ApiResponse,
  PaginatedResponse,
  NFT,
  Listing,
  Sale,
  RoyaltyEarning,
  VolumeData,
  TopNFT,
  RoyaltyDistribution,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  nfts: {
    list: (params?: {
      page?: number;
      limit?: number;
      owner?: string;
      contractAddress?: string;
      listed?: boolean;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null) qs.set(k, String(v));
        });
      }
      return fetcher<ApiResponse<PaginatedResponse<NFT>>>(`/nfts?${qs}`);
    },
    get: (contractAddress: string, tokenId: string) =>
      fetcher<ApiResponse<NFT>>(`/nfts/${contractAddress}/${tokenId}`),
    byOwner: (address: string, params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      return fetcher<ApiResponse<PaginatedResponse<NFT>>>(`/nfts/owner/${address}?${qs}`);
    },
  },

  listings: {
    list: (params?: {
      page?: number;
      limit?: number;
      contractAddress?: string;
      seller?: string;
      sortBy?: string;
      sortOrder?: string;
    }) => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      return fetcher<ApiResponse<PaginatedResponse<Listing>>>(`/listings?${qs}`);
    },
    get: (id: string) => fetcher<ApiResponse<Listing>>(`/listings/${id}`),
  },

  sales: {
    list: (params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      return fetcher<ApiResponse<PaginatedResponse<Sale>>>(`/sales?${qs}`);
    },
    byNFT: (contractAddress: string, tokenId: string) =>
      fetcher<ApiResponse<PaginatedResponse<Sale>>>(`/sales/nft/${contractAddress}/${tokenId}`),
    byUser: (address: string, params?: { page?: number; limit?: number; role?: string }) => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      return fetcher<ApiResponse<PaginatedResponse<Sale>>>(`/sales/user/${address}?${qs}`);
    },
  },

  royalties: {
    claimable: (address: string) =>
      fetcher<ApiResponse<{ walletAddress: string; claimableAmount: string; pendingCount: number }>>(
        `/royalties/${address}`
      ),
    history: (address: string, params?: { page?: number; limit?: number }) => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
      return fetcher<ApiResponse<PaginatedResponse<RoyaltyEarning>>>(
        `/royalties/history/${address}?${qs}`
      );
    },
  },

  analytics: {
    volume: () => fetcher<ApiResponse<VolumeData>>('/analytics/volume'),
    topNfts: (limit = 10) =>
      fetcher<ApiResponse<{ data: TopNFT[] }>>(`/analytics/top-nfts?limit=${limit}`),
    stats: () =>
      fetcher<ApiResponse<{ totalNfts: number; totalListings: number; totalSales: number; totalUsers: number }>>(
        '/analytics/stats'
      ),
  },
};