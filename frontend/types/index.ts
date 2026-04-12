export interface NFT {
  id: string;
  tokenId: string;
  contractAddress: string;
  ownerAddress: string;
  metadataUri?: string;
  name?: string;
  image?: string;
  createdAt: string;
  listing?: Listing | null;
}

export interface Listing {
  id: string;
  nftId: string;
  sellerAddress: string;
  price: string;
  active: boolean;
  createdAt: string;
  nft?: NFT;
}

export interface Sale {
  id: string;
  listingId: string;
  nftId: string;
  buyerAddress: string;
  sellerAddress: string;
  price: string;
  txHash?: string;
  royaltyAmount: string;
  createdAt: string;
  nft?: NFT;
  listing?: Listing;
}

export interface RoyaltyEarning {
  id: string;
  recipientAddress: string;
  amount: string;
  saleId: string;
  claimed: boolean;
  createdAt: string;
  sale?: Sale;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationMeta;
}

export interface VolumeData {
  daily: { volume: string; sales: number };
  weekly: { volume: string; sales: number };
  allTime: { volume: string; sales: number; totalRoyalty: string };
}

export interface TopNFT {
  nft: NFT;
  salePrice: string;
  saleId: string;
  sellerAddress: string;
  buyerAddress: string;
  soldAt: string;
}

export interface RoyaltyDistribution {
  recipientAddress: string;
  totalClaimed: string;
  totalUnclaimed: string;
}

export type TxStatus = 'idle' | 'pending' | 'success' | 'error';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  publicKey: string | null;
  network: string | null;
}