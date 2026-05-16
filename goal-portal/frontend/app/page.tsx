'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Role-based redirect
    switch (user.role) {
      case 'ADMIN':
        router.replace('/users');
        break;
      case 'MANAGER':
        router.replace('/team');
        break;
      case 'EMPLOYEE':
      default:
        router.replace('/goals');
        break;
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-brand" />
    </div>
  );
}
