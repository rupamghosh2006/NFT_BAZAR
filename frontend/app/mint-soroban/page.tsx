'use client';

import { useState, useRef } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useSorobanTransaction } from '@/hooks/useSorobanTransaction';
import { WalletButton } from '@/components/layout/WalletButton';
import { toastTxPending, toastTxSuccess, toastTxError } from '@/components/ui';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function MintPageSoroban() {
  const { address, isConnected } = useWallet();
  const { signTransaction } = useSorobanTransaction();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nftName, setNftName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toastTxError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toastTxError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Pinata
  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const response = await api.upload.image(selectedFile, address || undefined);

      if (!response.success) {
        throw new Error(response.error?.message || 'Upload failed');
      }

      setUploadedImageUrl(response.data!.url);
      toastTxSuccess('Image uploaded to Pinata successfully!');
      setImagePreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      toastTxError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Reset image selection
  const handleResetImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Mint NFT via Soroban
  const handleMint = async () => {
    if (!address || !uploadedImageUrl || !nftName.trim()) {
      toastTxError('Please fill all fields');
      return;
    }

    toastTxPending();
    setMinting(true);
    try {
      // Step 1: Build unsigned transaction
      const buildResponse = await api.soroban.mint.build(address, nftName.trim(), uploadedImageUrl);

      if (!buildResponse.success) {
        throw new Error(buildResponse.error?.message || 'Failed to build transaction');
      }

      const { transactionXDR, mintRequestId } = buildResponse.data!;

      // Step 2: Sign with Freighter
      const signedTxXDR = await signTransaction(transactionXDR, address);

      // Step 3: Extract transaction hash and token ID from signed XDR
      // Note: In production, you'd parse the XDR to get the actual token ID returned from contract
      // For now, we'll use a client-side generated ID (backend will use the actual one from contract)
      const tokenId = Math.floor(Math.random() * 1000000); // Placeholder
      const txHash = Buffer.from(transactionXDR).toString('base64').slice(0, 32); // Placeholder

      // Step 4: Submit signed transaction to backend
      const submitResponse = await api.soroban.mint.submit(
        signedTxXDR,
        mintRequestId,
        tokenId,
        address,
        nftName.trim(),
        uploadedImageUrl
      );

      if (!submitResponse.success) {
        throw new Error(submitResponse.error?.message || 'Failed to submit transaction');
      }

      const { nft, explorerUrl } = submitResponse.data!;

      // Show success toast with explorer link
      toastTxSuccess(
        <div className="flex flex-col gap-2">
          <div>NFT "{nft.name}" minted successfully!</div>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 underline text-sm flex items-center gap-1"
          >
            View on Stellar Explorer
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4m-4-6l6-6m0 0V4m0 2H12" />
            </svg>
          </a>
        </div>
      );

      queryClient.invalidateQueries({ queryKey: ['nfts', 'owner', address] });
      setNftName('');
      setUploadedImageUrl(null);
    } catch (err: any) {
      toastTxError(err.message || 'Mint failed');
    } finally {
      setMinting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="w-20 h-20 mx-auto mb-6 text-primary-500">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white/80 mb-2">Connect Your Wallet</h2>
        <p className="text-white/40 mb-6">Connect your Freighter wallet to mint NFTs on Stellar testnet</p>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold text-white">Create Your NFT</h1>
          <span className="px-3 py-1 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">Soroban</span>
        </div>
        <p className="text-white/50">Upload an image and mint a real NFT on Stellar testnet via Soroban contract</p>
      </div>

      <div className="space-y-8">
        {/* NFT Name Input */}
        <div className="card p-6">
          <label className="block text-sm font-medium text-white/70 mb-3">NFT Name *</label>
          <input
            type="text"
            value={nftName}
            onChange={(e) => setNftName(e.target.value)}
            placeholder="Enter your NFT name..."
            className="input-field w-full"
          />
          <p className="text-xs text-white/30 mt-2">Give your NFT a unique and meaningful name</p>
        </div>

        {/* Image Upload Section */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Upload NFT Image *</h2>

          {!uploadedImageUrl ? (
            <div className="space-y-4">
              {/* File Input Area */}
              <div
                className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-white/40 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="space-y-4">
                    <img src={imagePreview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    <p className="text-sm text-white/70">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">Click to upload or drag and drop</p>
                      <p className="text-sm text-white/40 mt-1">PNG, JPG, GIF, WebP up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              {selectedFile && !imagePreview && (
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadImage}
                    disabled={uploading}
                    className="btn-accent flex-1 py-2"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Upload to Pinata'
                    )}
                  </button>
                  <button onClick={handleResetImage} disabled={uploading} className="btn-secondary py-2 px-4">
                    Cancel
                  </button>
                </div>
              )}

              {imagePreview && (
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadImage}
                    disabled={uploading}
                    className="btn-accent flex-1 py-2"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Uploading...
                      </span>
                    ) : (
                      'Upload to Pinata'
                    )}
                  </button>
                  <button onClick={handleResetImage} disabled={uploading} className="btn-secondary py-2 px-4">
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-sm mx-auto">
                <img src={uploadedImageUrl} alt="Uploaded" className="w-full rounded-lg border border-primary-500/20" />
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-500/90 text-white px-3 py-1 rounded-full text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Uploaded
                </div>
              </div>
              <button
                onClick={() => {
                  setUploadedImageUrl(null);
                  setSelectedFile(null);
                  setImagePreview(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="w-full btn-secondary py-2"
              >
                Choose Different Image
              </button>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
          <p className="text-sm text-white/70">
            <span className="font-semibold text-primary-400">Soroban Contract:</span> Your NFT will be minted directly on-chain using the Stellar Soroban contract. You'll be prompted to sign with Freighter wallet.
          </p>
        </div>

        {/* Mint Button */}
        <div className="bg-dark-100 rounded-2xl p-6 border border-white/5">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <p className="text-white font-medium">
                {nftName && uploadedImageUrl
                  ? `Ready to mint: ${nftName}`
                  : 'Fill in all fields to mint your NFT'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {address && `Minting to: ${address.slice(0, 8)}...${address.slice(-6)}`}
              </p>
            </div>
            <button
              onClick={handleMint}
              disabled={minting || !nftName.trim() || !uploadedImageUrl || !address}
              className="btn-accent min-w-[160px] text-base py-3"
            >
              {minting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Minting...
                </span>
              ) : (
                'Mint NFT'
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          ← Back to Marketplace
        </Link>
      </div>
    </div>
  );
}
