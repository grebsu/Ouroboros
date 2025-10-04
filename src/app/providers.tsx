'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';
import { DonationModalProvider } from '@/context/DonationModalContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DonationModalProvider>{children}</DonationModalProvider>
    </SessionProvider>
  );
}
