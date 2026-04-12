'use client';

import { useVolumeAnalytics, useTopNfts, useMarketStats } from '@/hooks/useAnalytics';
import { formatLumens } from '@/lib/constants';
import { formatDate } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CardSkeleton } from '@/components/ui';

const PIE_COLORS = ['#5c7cfa', '#fab005', '#748ffc'];

export default function AnalyticsPage() {
  const { data: volume, isLoading: loadingVolume } = useVolumeAnalytics();
  const { data: topNfts, isLoading: loadingTop } = useTopNfts(10);
  const { data: stats, isLoading: loadingStats } = useMarketStats();

  const pieData = [
    { name: 'Creator', value: 50, color: PIE_COLORS[0] },
    { name: 'Stakers', value: 30, color: PIE_COLORS[1] },
    { name: 'Treasury', value: 20, color: PIE_COLORS[2] },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold text-white mb-8">Analytics</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loadingStats ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="card p-5 h-28 animate-pulse" />)
        ) : (
          <>
            <div className="card p-5">
              <p className="text-xs text-white/40 mb-1">Total Volume</p>
              <p className="text-xl font-bold text-white">
                {formatLumens(volume?.allTime.volume || '0')}
              </p>
              <p className="text-xs text-white/30 mt-0.5">All time</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-white/40 mb-1">Total Sales</p>
              <p className="text-xl font-bold text-white">
                {stats?.totalSales || volume?.allTime.sales || 0}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Transactions</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-white/40 mb-1">Total Royalties</p>
              <p className="text-xl font-bold text-accent-500">
                {formatLumens(volume?.allTime.totalRoyalty || '0')}
              </p>
              <p className="text-xs text-white/30 mt-0.5">Distributed</p>
            </div>
            <div className="card p-5">
              <p className="text-xs text-white/40 mb-1">Listed NFTs</p>
              <p className="text-xl font-bold text-white">{stats?.totalListings || 0}</p>
              <p className="text-xs text-white/30 mt-0.5">Active</p>
            </div>
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {/* Volume Chart */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="font-semibold text-white mb-4">Trading Volume</h3>
          {loadingVolume ? (
            <div className="h-48 animate-pulse bg-dark-200 rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={[
                  { label: 'Daily', volume: volume?.daily.volume || '0', sales: volume?.daily.sales || 0 },
                  { label: 'Weekly', volume: volume?.weekly.volume || '0', sales: volume?.weekly.sales || 0 },
                  { label: 'All Time', volume: volume?.allTime.volume || '0', sales: volume?.allTime.sales || 0 },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                <XAxis dataKey="label" tick={{ fill: '#ffffff60', fontSize: 12 }} />
                <YAxis tick={{ fill: '#ffffff60', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#181825', border: '1px solid #2a2a3e', borderRadius: 12 }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="sales" fill="#5c7cfa" radius={[8, 8, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Royalty Pie */}
        <div className="card p-6">
          <h3 className="font-semibold text-white mb-4">Royalty Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#181825', border: '1px solid #2a2a3e', borderRadius: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-white/60">{item.name}</span>
                </div>
                <span className="text-white font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top NFTs */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-semibold text-white">Top Sales</h3>
        </div>
        {loadingTop ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-dark-200 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-white/40 font-medium">NFT</th>
                  <th className="text-left p-4 text-white/40 font-medium">Seller</th>
                  <th className="text-left p-4 text-white/40 font-medium">Buyer</th>
                  <th className="text-left p-4 text-white/40 font-medium">Date</th>
                  <th className="text-right p-4 text-white/40 font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {topNfts?.data?.map((item) => (
                  <tr key={item.saleId} className="border-b border-white/5 hover:bg-white/2">
                    <td className="p-4 font-medium text-white">
                      {item.nft?.name || `#${item.nft?.tokenId}`}
                    </td>
                    <td className="p-4 font-mono text-white/60">
                      {item.sellerAddress.slice(0, 4)}...{item.sellerAddress.slice(-4)}
                    </td>
                    <td className="p-4 font-mono text-white/60">
                      {item.buyerAddress.slice(0, 4)}...{item.buyerAddress.slice(-4)}
                    </td>
                    <td className="p-4 text-white/60">{formatDate(item.soldAt)}</td>
                    <td className="p-4 text-right font-bold text-accent-500">
                      {formatLumens(item.salePrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
