'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';

const publicPaths = ['/login'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicPage = publicPaths.includes(pathname);

  if (isPublicPage) {
    // Login page — no navbar, no auth guard
    return <>{children}</>;
  }

  return (
    <AuthGuard>
      <Navbar />
      <main>
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </AuthGuard>
  );
}
