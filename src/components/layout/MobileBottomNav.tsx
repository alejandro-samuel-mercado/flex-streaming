'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Heart, History, Home, Settings, Shield, User, Video } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isReseller = user?.role === 'RESELLER';

  const navItems = [
    { name: 'Inicio', path: '/', icon: Home },
    { name: 'Explorar', path: '/explorar', icon: Compass },
    ...(isLoggedIn ? [{ name: 'Historial', path: '/historial', icon: History }] : [
      { name: 'Mi Lista', path: '/mi-lista', icon: Heart },
    ]),
    ...(isAdmin
      ? [{ name: 'Admin', path: '/admin', icon: Shield }]
      : isReseller
        ? [{ name: 'Reseller', path: '/reseller/dashboard', icon: Video }]
        : []
    ),
    { name: isLoggedIn ? 'Perfil' : 'Entrar', path: isLoggedIn ? '/perfil' : '/auth/login', icon: User },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-panel)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)] pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/') && item.path !== '/';
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 min-w-[52px]
                ${isActive ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}
              `}
            >
              <item.icon size={22} className={isActive ? 'drop-shadow-md' : ''} />
              <span className={`text-[9px] mt-1 font-bold truncate max-w-[52px] text-center ${isActive ? 'opacity-100' : 'opacity-70'} transition-all`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
