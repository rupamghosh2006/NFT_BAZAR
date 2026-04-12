'use client';

import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  loading: (message: string) => toast.loading(message),
};

export function toastTxPending() {
  return toast.loading('Transaction submitted...', { id: 'tx-pending' });
}

export function toastTxSuccess(message = 'Transaction confirmed!') {
  toast.success(message, { id: 'tx-pending' });
}

export function toastTxError(message = 'Transaction failed') {
  toast.error(message, { id: 'tx-pending' });
}