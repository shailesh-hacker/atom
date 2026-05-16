'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Target, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import RoleBadge from './RoleBadge';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const navTabs = {
  EMPLOYEE: [
    { name: 'My Goals', href: '/goals' },
    { name: 'Check-ins', href: '/checkins' },
  ],
  MANAGER: [
    { name: 'Team Goals', href: '/team' },
    { name: 'Approvals', href: '/approvals' },
    { name: 'Check-ins', href: '/checkins' },
  ],
  ADMIN: [
    { name: 'Users', href: '/users' },
    { name: 'Cycles', href: '/cycles' },
    { name: 'Audit Logs', href: '/audit' },
    { name: 'Reports', href: '/reports' },
  ],
};

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  const tabs = navTabs[user?.role as keyof typeof navTabs] || navTabs.EMPLOYEE;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Don't show navbar on login page
  if (pathname === '/login') return null;

  // Don't render until user is available
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  return (
    <header className="sticky top-0 z-30 bg-surface border-b border-border shadow-sm h-16">
      <div className="flex justify-between items-center px-6 h-full max-w-[1280px] mx-auto">
        {/* Left: Logo */}
        <div className="flex items-center gap-8 h-full">
          <Link href="/goals" className="flex items-center gap-2 shrink-0">
            <div className="bg-brand rounded-lg p-1.5">
              <Target size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-brand hidden sm:block">GoalTrack</span>
          </Link>

          {/* Center: Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'h-full flex items-center px-4 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'text-brand border-brand'
                      : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border'
                  )}
                >
                  {tab.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: User */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 hover:bg-background rounded-lg px-3 py-2 transition-colors"
            aria-label="User menu"
          >
            <div className="h-8 w-8 rounded-full bg-brand-light border border-border flex items-center justify-center">
              <span className="text-brand font-semibold text-sm">{initials}</span>
            </div>
            <span className="text-sm font-medium text-text-primary hidden sm:block">{user.name}</span>
            <RoleBadge role={user.role} className="hidden lg:inline-flex" />
            <ChevronDown size={16} className="text-text-secondary" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 bg-surface border border-border rounded-xl shadow-md py-2 min-w-[180px] z-50">
              <div className="px-4 py-2 border-b border-border">
                <p className="text-sm font-semibold text-text-primary">{user.name}</p>
                <p className="text-xs text-text-secondary">{user.email}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-light transition-colors"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
