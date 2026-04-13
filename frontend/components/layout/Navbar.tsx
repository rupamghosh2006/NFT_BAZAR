'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { WalletButton } from './WalletButton';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Market' },
  { href: '/my-nfts', label: 'My NFTs' },
  { href: '/mint', label: 'Mint' },
  { href: '/list', label: 'List NFT' },
  { href: '/royalties', label: 'Royalties' },
  { href: '/analytics', label: 'Analytics' },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-dark-200/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 flex items-center justify-center rounded-full overflow-hidden">
            <img src="/favicon.jpeg" alt="NFT Bazar" className="w-full h-full object-cover" />
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">NFT Bazar</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                pathname === link.href
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <WalletButton />
        </div>
      </div>
    </header>
  );
}