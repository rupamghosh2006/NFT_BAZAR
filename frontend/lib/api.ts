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

async function fileUploadFetcher<T>(url: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    method: 'POST',
    body: formData,
    // Don't set Content-Type header - browser will set it with boundary for multipart/form-data
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.error?.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  upload: {
    image: (file: File, walletAddress?: string) => {
      const formData = new FormData();
      formData.append('image', file);
      if (walletAddress) {
        formData.append('walletAddress', walletAddress);
      }
      return fileUploadFetcher<ApiResponse<{ ipfsHash: string; url: string; size: number }>>('/upload', formData);
    },
  },

  soroban: {
    mint: {
      build: (walletAddress: string, name: string, imageUrl: string) =>
        fetcher<ApiResponse<{ transactionXDR: string; contractId: string; method: string; mintRequestId: string; requiresSignature: boolean; signerAddress: string }>>('/soroban/mint/build', {
          method: 'POST',
          body: JSON.stringify({ walletAddress, name, imageUrl }),
        }),
      submit: (signedTxXDR: string, mintRequestId: string, tokenId: number, walletAddress: string, name: string, imageUrl: string) =>
        fetcher<ApiResponse<{ nft: NFT; txHash: string; explorerUrl: string }>>('/soroban/mint/submit', {
          method: 'POST',
          body: JSON.stringify({ signedTxXDR, mintRequestId, tokenId, walletAddress, name, imageUrl }),
        }),
    },
    marketplace: {
      list: {
        build: (nftContractId: string, sellerAddress: string, tokenId: number, priceInStroops: string) =>
          fetcher<ApiResponse<{ transactionXDR: string; contractId: string; method: string; listingRequestId: string; requiresSignature: boolean; signerAddress: string }>>('/soroban/marketplace/list/build', {
            method: 'POST',
            body: JSON.stringify({ nftContractId, sellerAddress, tokenId, priceInStroops }),
          }),
        submit: (signedTxXDR: string, listingRequestId: string, nftContractId: string, tokenId: number, sellerAddress: string, priceInStroops: string, txHash: string) =>
          fetcher<ApiResponse<Listing>>('/soroban/marketplace/list/submit', {
            method: 'POST',
            body: JSON.stringify({ signedTxXDR, listingRequestId, nftContractId, tokenId, sellerAddress, priceInStroops, txHash }),
          }),
      },
      buy: {
        build: (nftContractId: string, buyerAddress: string, tokenId: number) =>
          fetcher<ApiResponse<{ transactionXDR: string; contractId: string; method: string; buyRequestId: string; requiresSignature: boolean; signerAddress: string }>>('/soroban/marketplace/buy/build', {
            method: 'POST',
            body: JSON.stringify({ nftContractId, buyerAddress, tokenId }),
          }),
        submit: (signedTxXDR: string, buyRequestId: string, nftContractId: string, tokenId: number, buyerAddress: string, price: string, txHash: string) =>
          fetcher<ApiResponse<Sale>>('/soroban/marketplace/buy/submit', {
            method: 'POST',
            body: JSON.stringify({ signedTxXDR, buyRequestId, nftContractId, tokenId, buyerAddress, price, txHash }),
          }),
      },
    },
  },

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
      return fetcher<ApiResponse<{ data: NFT[]; pagination: import('@/types').PaginationMeta }>>(`/nfts/owner/${address}?${qs}`).then((r) => r.data!);
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
      return fetcher<PaginatedResponse<Listing>>(`/listings?${qs}`);
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
