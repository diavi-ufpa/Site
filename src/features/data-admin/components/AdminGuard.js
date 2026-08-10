'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const { appLoading, isAdmin } = useAuth();

  useEffect(() => {
    if (!appLoading && !isAdmin) router.replace('/portal');
  }, [appLoading, isAdmin, router]);

  if (appLoading || !isAdmin) return null;
  return children;
}
