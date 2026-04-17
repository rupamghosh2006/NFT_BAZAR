'use client';

import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useNFT } from '@/hooks/useNFTs';
import { useSalesByNFT } from '@/hooks/useSales';
import { useWallet } from '@/hooks/useWallet';
import { getImageUrl, formatDate, truncateAddress } from '@/lib/utils';
import { formatLumens, ROYALTY_SPLIT } from '@/lib/constants';
import { toastTxPending, toastTxSuccess, toastTxError } from '@/components/ui';
import toast from 'react-hot-toast';

async function buyNFT(contractAddress: string, tokenId: string, price: string) {
  toastTxPending();
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log(`Buying NFT ${tokenId} from contract ${contractAddress} for ${price}`);
    toastTxSuccess('NFT purchased successfully!');
  } catch (err: any) {
    toastTxError(err.message || 'Purchase failed');
  }
}

export default function NFTDetailPage() {
  const { contract, tokenId } = useParams() as { contract: string; tokenId: string };
  const { address, isConnected, connect } = useWallet();
  const { data: nft, isLoading } = useNFT(contract, tokenId);
  const { data: sales } = useSalesByNFT(contract, tokenId);

  const listing = nft?.listing;
  const isOwner = address && nft?.ownerAddress?.toUpperCase() === address.toUpperCase();

  const handleBuy = async () => {
    if (!isConnected) {
      connect();
      return;
    }
    if (!listing) return;
    await buyNFT(contract, tokenId, listing.price);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-dark-200 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-dark-200 rounded-xl w-3/4 animate-pulse" />
            <div className="h-4 bg-dark-200 rounded-xl w-1/2 animate-pulse" />
            <div className="h-12 bg-dark-200 rounded-xl w-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-white/60">NFT not found</h2>
        <Link href="/" className="btn-primary mt-4 inline-block">Back to Market</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-dark-200">
          <Image
            src={getImageUrl(nft.image)}
            alt={nft.name || `NFT #${nft.tokenId}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            unoptimized
          />
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-white/40 mb-2">
              <span>Collection</span>
              <span>•</span>
              <span>Token #{nft.tokenId}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {nft.name || `NFT #${nft.tokenId}`}
            </h1>
          </div>

          <div className="bg-dark-100 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-white/40 mb-1">Current Owner</p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-xs font-bold">
                {nft.ownerAddress?.slice(0, 1)}
              </div>
              <span className="font-mono text-sm text-white">
                {truncateAddress(nft.ownerAddress, 6)}
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(nft.ownerAddress || '')}
                className="text-white/30 hover:text-white/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {listing?.active ? (
            <div className="bg-dark-100 rounded-xl p-5 border border-accent-500/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/50 text-sm">Listed Price</span>
                <span className="text-2xl font-bold text-accent-500">
                  {formatLumens(listing.price)}
                </span>
              </div>

              {isOwner ? (
                <div className="space-y-2">
                  <p className="text-sm text-primary-400 text-center">You own this NFT</p>
                  <Link href="/my-nfts" className="btn-secondary w-full text-center block text-sm">
                    Manage in My NFTs
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handleBuy}
                  className="btn-accent w-full text-base py-3"
                >
                  {!isConnected ? 'Connect Wallet to Buy' : 'Buy Now'}
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-xs text-white/40 mb-2">Royalty Split</p>
                <div className="space-y-1">
                  {Object.entries(ROYALTY_SPLIT).map(([role, pct]) => (
                    <div key={role} className="flex justify-between text-sm">
                      <span className="text-white/60 capitalize">{role}</span>
                      <span className="text-white/80 font-medium">{pct}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-primary-400 mt-2">10% royalty on every resale</p>
              </div>
            </div>
          ) : (
            <div className="bg-dark-100 rounded-xl p-5 border border-white/5 text-center">
              <p className="text-white/40 mb-3">This NFT is not listed for sale</p>
              {isOwner && (
                <Link href="/list" className="btn-primary inline-block">
                  List for Sale
                </Link>
              )}
            </div>
          )}

          {nft.metadataUri && (
            <div className="bg-dark-100 rounded-xl p-4 border border-white/5">
              <p className="text-xs text-white/40 mb-2">Metadata URI</p>
              <p className="text-xs font-mono text-white/60 break-all">{nft.metadataUri}</p>
            </div>
          )}
        </div>
      </div>

      {sales && sales.data.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-white mb-4">Sale History</h2>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left p-4 text-white/40 font-medium">Date</th>
                    <th className="text-left p-4 text-white/40 font-medium">Buyer</th>
                    <th className="text-left p-4 text-white/40 font-medium">Seller</th>
                    <th className="text-right p-4 text-white/40 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.data.map((sale) => (
                    <tr key={sale.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="p-4 text-white/60">{formatDate(sale.createdAt)}</td>
                      <td className="p-4 font-mono text-white/80">{truncateAddress(sale.buyerAddress, 4)}</td>
                      <td className="p-4 font-mono text-white/80">{truncateAddress(sale.sellerAddress, 4)}</td>
                      <td className="p-4 text-right font-bold text-accent-500">{formatLumens(sale.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
