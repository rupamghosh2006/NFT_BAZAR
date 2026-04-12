export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'testnet';
export const HORIZON_URL = process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org';

export const CONTRACT_IDS = {
  NFT_COLLECTION: process.env.NEXT_PUBLIC_NFT_COLLECTION_ID || 'CBWA6JYF2XUQOPJYEVSVTN5IBUL2KXXN2ZOMV62UH5ESP2552S7IF4MX',
  MARKETPLACE: process.env.NEXT_PUBLIC_MARKETPLACE_ID || 'CBQQ6JAWRKCICVG3VT5IOSZOLFXPSG2F74DDFYFL7GWLOHDPOVK54BFT',
  ROYALTY_POOL: process.env.NEXT_PUBLIC_ROYALTY_POOL_ID || 'CCFACXY34DFXJZJIHFNV6WRDQLEHGKX7YXLLW6PVOKZTLJG2APU4LG4C',
  PAYMENT_TOKEN: process.env.NEXT_PUBLIC_PAYMENT_TOKEN_ID || 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
} as const;

export const ROYALTY_SPLIT = {
  creator: 50,
  staker: 30,
  treasury: 20,
} as const;

export const ROYALTY_ADDRESSES = {
  creator: process.env.NEXT_PUBLIC_CREATOR_ADDRESS || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC',
  stakers: process.env.NEXT_PUBLIC_STAKERS_ADDRESS || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC',
  treasury: process.env.NEXT_PUBLIC_TREASURY_ADDRESS || 'GAYWZSX43WUBRHM3F2QCWBL6ZOYSH7V5EOQOYMG6SMTGMM24RFEFCMHC',
} as const;

export const ROYALTY_PERCENTAGE = 1000; // 10% in basis points (10000 = 100%)
export const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
export const EXPLORER_URL = STELLAR_NETWORK === 'testnet'
  ? 'https://stellar.expert/explorer/testnet'
  : 'https://stellar.expert/explorer/public';

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatAddress(address: string): string {
  return address?.toUpperCase() || '';
}

export function parseLumens(value: string, decimals = 7): string {
  const num = BigInt(value || '0');
  const divisor = BigInt(10 ** decimals);
  const integerPart = num / divisor;
  const fractionalPart = (num % divisor).toString().padStart(decimals, '0');
  return `${integerPart}.${fractionalPart.replace(/0+$/, '')}`;
}

export function formatLumens(value: string): string {
  const num = parseLumens(value, 7);
  return `${num} XLM`;
}