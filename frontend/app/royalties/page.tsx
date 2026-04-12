'use client';

import { useWallet } from '@/hooks/useWallet';
import { useClaimable, useRoyaltyHistory, useClaim } from '@/hooks/useRoyalties';
import { WalletButton } from '@/components/layout/WalletButton';
import { formatLumens, ROYALTY_SPLIT } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui';
import toast from 'react-hot-toast';

export default function RoyaltiesPage() {
  const { address, isConnected } = useWallet();
  const { data: claimable, isLoading: loadingClaimable } = useClaimable(address || '');
  const { data: history, isLoading: loadingHistory } = useRoyaltyHistory(address || '');
  const claimMutation = useClaim();

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <h2 className="text-xl font-semibold text-white/60 mb-4">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6 text-sm">Connect to view your royalty earnings</p>
        <WalletButton />
      </div>
    );
  }

  const handleClaim = async () => {
    try {
      await claimMutation.mutateAsync([]);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Royalties</h1>

      {/* Summary Card */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm text-white/50 mb-1">Claimable Balance</p>
            <div className="flex items-baseline gap-2">
              {loadingClaimable ? (
                <div className="h-10 w-40 bg-dark-200 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-3xl font-bold text-accent-500">
                    {formatLumens(claimable?.claimableAmount || '0')}
                  </span>
                  <span className="text-white/40 text-sm">XLM</span>
                </>
              )}
            </div>
            <p className="text-xs text-white/30 mt-1">
              {claimable?.pendingCount || 0} pending earnings
            </p>
          </div>
          <button
            onClick={handleClaim}
            disabled={!claimable?.claimableAmount || parseFloat(claimable.claimableAmount) === 0 || claimMutation.isPending}
            className="btn-accent text-sm py-3 px-8"
          >
            {claimMutation.isPending ? 'Claiming...' : 'Claim All'}
          </button>
        </div>

        {/* Royalty Split */}
        <div>
          <p className="text-xs text-white/40 mb-3">Royalty Split Pool Distribution</p>
          <div className="space-y-2">
            {Object.entries(ROYALTY_SPLIT).map(([role, pct]) => (
              <div key={role} className="flex items-center gap-3">
                <div className="w-24 text-sm text-white/70 capitalize">{role}</div>
                <div className="flex-1 bg-dark-300 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm font-medium text-white">{pct}%</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-primary-400 mt-3">
            10% royalty on every secondary sale is split: Creator 50%, Stakers 30%, Treasury 20%
          </p>
        </div>
      </div>

      {/* Earnings History */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Earnings History</h2>

        {loadingHistory ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-dark-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !history?.data || history.data.length === 0 ? (
          <EmptyState
            title="No earnings yet"
            description="Royalties from sales will appear here"
          />
        ) : (
          <div className="space-y-2">
            {history.data.map((earning) => (
              <div key={earning.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {formatLumens(earning.amount)} XLM
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    {formatDate(earning.createdAt)}
                  </p>
                </div>
                <span className={`badge ${earning.claimed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {earning.claimed ? 'Claimed' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
