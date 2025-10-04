'use client';

import React, { useEffect } from 'react';
import FloatingStopwatchButton from './FloatingStopwatchButton';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement } from 'chart.js';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import DonationModal from './DonationModal';
import { useDonationModal } from '../context/DonationModalContext';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { isModalOpen, closeModal } = useDonationModal();

  useEffect(() => {
    Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title, BarElement);
  }, []);

  useEffect(() => {
    // Define public paths that don't require authentication
    const publicPaths = ['/login', '/register'];

    // If not loading and not authenticated, and not on a public path, redirect to login
    if (status === 'unauthenticated' && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
    // If authenticated and on a login/register page, redirect to dashboard
    if (status === 'authenticated' && publicPaths.includes(pathname)) {
      router.push('/dashboard');
    }
  }, [status, router, pathname]); // Re-run when status, router, or pathname changes

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-800 dark:text-gray-100">Carregando...</p>
      </div>
    );
  }

  // Only render children if authenticated or on a public path
  if (status === 'authenticated' || ['/login', '/register'].includes(pathname)) {
    return (
      <>
        {children}
        <FloatingStopwatchButton isVisible={pathname !== '/login'} />
        <DonationModal isOpen={isModalOpen} onClose={closeModal} />
      </>
    );
  }

  // Fallback for unauthenticated users on protected routes (should be redirected by useEffect)
  return null;
}