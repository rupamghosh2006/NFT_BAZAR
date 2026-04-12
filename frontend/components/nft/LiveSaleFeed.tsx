'use client';

import Image from 'next/image';
import { useRecentSales } from '@/hooks/useSales';
import { formatLumens } from '@/lib/constants';
import { timeAgo, getImageUrl, truncateAddress } from '@/lib/utils';
import { CardSkeleton } from '@/components/ui';

export function LiveSaleFeed() {
  const { data, isLoading } = useRecentSales({ limit: 10 });

  return (
    <div className="card h-fit sticky top-20">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <h3 className="font-semibold text-white">Live Sales</h3>
        </div>
      </div>

      <div className="p-2 space-y-1 max-h-[600px] overflow-y-auto">
        {isLoading && (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        )}

        {!isLoading && (!data?.data || data.data.length === 0) && (
          <p className="text-center text-white/30 text-sm py-8">No sales yet</p>
        )}

        {data?.data.map((sale) => (
          <div
            key={sale.id}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors animate-fade-in"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-200 shrink-0 relative">
              {sale.nft?.image && (
                <Image
                  src={getImageUrl(sale.nft.image)}
                  alt={sale.nft?.name || ''}
                  fill
                  className="object-cover"
                  unoptimized
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {sale.nft?.name || `NFT #${sale.nft?.tokenId}`}
              </p>
              <p className="text-xs text-white/40">
                {truncateAddress(sale.buyerAddress, 3)} bought
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-accent-500">
                {formatLumens(sale.price)}
              </p>
              <p className="text-xs text-white/30">
                {timeAgo(sale.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}