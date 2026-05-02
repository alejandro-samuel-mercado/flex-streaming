'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCheck, Coins, LogOut, MonitorPlay, ChevronLeft, Menu, X } from 'lucide-react';

const NAV = [
  { href: '/super-vendor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/super-vendor/vendors', label: 'Vendedores', icon: Users },
  { href: '/super-vendor/end-users', label: 'Clientes', icon: UserCheck },
];

export default function SuperVendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const title = NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? 'Super Vendedor';

  return (
    <div className="adm-root">
      <aside className={`adm-sidebar${mobileOpen ? ' adm-sidebar--open' : ''}`}>
        <div className="adm-sidebar-logo-row">
          <Link href="/super-vendor" className="adm-sidebar-logo" onClick={() => setMobileOpen(false)}>
            <MonitorPlay size={24} strokeWidth={1.5} className="adm-logo-icon" />
            <span className="adm-logo-text">SUPER VENDOR</span>
          </Link>
        </div>
        <nav className="adm-sidebar-nav">
          <span className="adm-nav-section-label">NAVEGACIÓN</span>
          {NAV.map(item => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href + '/') || pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={`adm-nav-link${active ? ' adm-nav-link--active' : ''}`} onClick={() => setMobileOpen(false)}>
                <item.icon size={18} strokeWidth={active ? 2 : 1.5} className="adm-nav-icon" />
                <span className="adm-nav-label">{item.label}</span>
                {active && <span className="adm-nav-pip" />}
              </Link>
            );
          })}
        </nav>
        <div className="adm-sidebar-bottom">
          <Link href="/" className="adm-nav-link adm-nav-link--muted"><MonitorPlay size={18} strokeWidth={1.5} className="adm-nav-icon" /><span className="adm-nav-label">Ver sitio</span></Link>
          <button className="adm-nav-link adm-nav-link--muted adm-logout-btn" onClick={logout}><LogOut size={18} strokeWidth={1.5} className="adm-nav-icon" /><span className="adm-nav-label">Cerrar sesión</span></button>
        </div>
      </aside>
      {mobileOpen && <div className="adm-mobile-overlay" onClick={() => setMobileOpen(false)} />}
      <div className="adm-content-wrapper">
        <header className="adm-header">
          <div className="adm-header-left">
            <button className="adm-hamburger" onClick={() => setMobileOpen(o => !o)}>{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
            <div className="adm-breadcrumb"><span className="adm-breadcrumb-root">Super Vendedor</span><span className="adm-breadcrumb-sep">/</span><span className="adm-breadcrumb-current">{title}</span></div>
          </div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
