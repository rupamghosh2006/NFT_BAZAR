import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/lib/providers';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'NFT Bazar — Stellar NFT Marketplace',
  description: 'Buy, sell and trade NFTs on the Stellar network with automatic royalty splitting.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-dark-300 text-white min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="pb-20 lg:pb-0">{children}</main>
          <BottomNav />
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: '#181825',
                color: '#fff',
                border: '1px solid #2a2a3e',
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  );
}