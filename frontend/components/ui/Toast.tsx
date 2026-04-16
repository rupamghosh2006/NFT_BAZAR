'use client';

import toast from 'react-hot-toast';
import React from 'react';

export const showToast = {
  success: (message: string | React.ReactNode) => toast.success(message as any),
  error: (message: string | React.ReactNode) => toast.error(message as any),
  loading: (message: string) => toast.loading(message),
};

export function toastTxPending() {
  return toast.loading('Transaction submitted...', { id: 'tx-pending' });
}

export function toastTxSuccess(message: string | React.ReactNode = 'Transaction confirmed!') {
  toast.success(message as any, { id: 'tx-pending' });
}

export function toastTxError(message: string | React.ReactNode = 'Transaction failed') {
  toast.error(message as any, { id: 'tx-pending' });
}