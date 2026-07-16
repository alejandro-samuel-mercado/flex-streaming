'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, MonitorPlay, LogOut } from 'lucide-react';

const NAV = [
  { href: '/super-vendor', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/super-vendor/vendors', label: 'Vendedores', icon: Users, exact: false },
  { href: '/super-vendor/end-users', label: 'Clientes', icon: UserCheck, exact: false },
  { href: '/', label: 'Nuba', icon: MonitorPlay, exact: true },
];

export default function SuperVendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    if (!t) router.replace('/admin/login');
    else setAuthed(true);
  }, [pathname, router]);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    router.replace('/admin/login');
  }, [router]);

  if (authed === null) return null;

  return (
    <div className="vendor-root">
      <style dangerouslySetInnerHTML={{ __html: `
        .vendor-root {
          min-height: 100vh;
          color: white;
          display: flex;
          flex-direction: column;
        }

        .vendor-main-wrapper {
          flex: 1;
          padding-bottom: 100px;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
        }

        .vendor-header {
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          background: rgba(6, 9, 19, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .vendor-brand {
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .vendor-brand-accent {
          color: #FFD700;
          background: rgba(255, 215, 0, 0.15);
          padding: 2px 8px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .vendor-logout-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .vendor-logout-btn:hover {
          background: rgba(244, 63, 94, 0.15);
          border-color: rgba(244, 63, 94, 0.3);
          color: #f43f5e;
        }

        .vendor-main-content {
          padding: 24px;
          flex: 1;
        }

        /* BOTTOM NAV */
        .vendor-bottom-nav {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 32px);
          max-width: 480px;
          height: 64px;
          background: rgba(10, 15, 37, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          padding: 0 16px;
        }

        .vendor-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          text-decoration: none;
          font-size: 0.65rem;
          font-weight: 600;
          gap: 4px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 6px 12px;
          border-radius: 16px;
          position: relative;
          height: 100%;
        }

        .vendor-nav-item:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        .vendor-nav-item.active {
          color: #FFD700;
        }

        .vendor-nav-icon {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .vendor-nav-item.active .vendor-nav-icon {
          transform: translateY(-2px);
          filter: drop-shadow(0 4px 8px rgba(255, 215, 0, 0.5));
        }

        .vendor-nav-item.active::after {
          content: '';
          position: absolute;
          bottom: 6px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 3px;
          background: #FFD700;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        @media (min-width: 768px) {
          .vendor-bottom-nav {
            bottom: 30px;
            width: auto;
            min-width: 440px;
          }
        }
        
        @media (max-width: 600px) {
          .vendor-header {
            padding: 0 16px;
          }
          .vendor-main-content {
            padding: 16px;
          }
        }
      `}} />

      <div className="vendor-main-wrapper">
        <header className="vendor-header">
          <div className="vendor-brand">
            Nuba <span className="vendor-brand-accent">Super Vendor</span>
          </div>
          <button onClick={logout} className="vendor-logout-btn" title="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </header>
        
        <main className="vendor-main-content">
            {children}
        </main>
      </div>

      <nav className="vendor-bottom-nav">
        {NAV.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`vendor-nav-item ${active ? 'active' : ''}`}>
              <item.icon size={22} strokeWidth={active ? 2.5 : 2} className="vendor-nav-icon" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
