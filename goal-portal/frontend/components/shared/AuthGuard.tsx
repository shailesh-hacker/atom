'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

type Role = 'EMPLOYEE' | 'MANAGER' | 'ADMIN';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

const roleRouteMap: Record<string, Role[]> = {
  '/goals': ['EMPLOYEE'],
  '/checkins': ['EMPLOYEE', 'MANAGER'],
  '/team': ['MANAGER'],
  '/approvals': ['MANAGER'],
  '/users': ['ADMIN'],
  '/cycles': ['ADMIN'],
  '/audit': ['ADMIN'],
  '/reports': ['ADMIN'],
};

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in — redirect to login
    if (!user) {
      router.replace('/login');
      return;
    }

    // Check role-based access
    const roles = allowedRoles || getRolesForPath(pathname);
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      // Redirect to their default page
      const defaultPage = getDefaultPage(user.role);
      router.replace(defaultPage);
    }
  }, [user, isLoading, pathname, router, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-sm text-text-secondary">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check role access
  const roles = allowedRoles || getRolesForPath(pathname);
  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

function getRolesForPath(pathname: string): Role[] | undefined {
  // Match the most specific route first
  for (const [route, roles] of Object.entries(roleRouteMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return roles;
    }
  }
  return undefined; // No restriction
}

function getDefaultPage(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/users';
    case 'MANAGER':
      return '/team';
    case 'EMPLOYEE':
    default:
      return '/goals';
  }
}
