'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import PublicSidebar from './PublicSidebar';
import PublicTopBar from './PublicTopBar';
import MobileBottomNav from './MobileBottomNav';

export default function PublicLayout({ 
  children, 
  hideSidebar = false,
  hideTopBar = false
}: { 
  children: React.ReactNode; 
  hideSidebar?: boolean;
  hideTopBar?: boolean;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isReseller = user?.role === 'RESELLER';
  const isFranchisee = user?.role === 'FRANCHISEE';

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-[var(--bg-main)] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }


  return (
    <div className="serivia-layout">
      {/* Sidebar - Desktop */}
      {!hideSidebar && (
        <div className="hidden lg:block z-50">
          <PublicSidebar />
        </div>
      )}

      {/* Main Content Area */}
      <div className="serivia-main-content overflow-x-hidden">
        {!hideTopBar && <PublicTopBar />}
        {/* pb-20 on mobile for BottomNav */}
        <main className="flex-1 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
