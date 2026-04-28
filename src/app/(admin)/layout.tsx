'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Film, Users, Settings, LogOut, UploadCloud, MonitorPlay } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/content', label: 'Contenido', icon: Film },
  { href: '/admin/upload', label: 'Subidas / HLS', icon: UploadCloud },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-sidebar-logo flex items-center gap-2">
          <MonitorPlay className="text-[var(--color-primary)]" size={28} />
          <span>ADMIN</span>
        </Link>
        <nav className="admin-sidebar-nav mt-6">
          {ADMIN_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${isActive ? 'active' : ''}`}
              >
                <item.icon size={20} className={isActive ? 'text-[var(--color-primary)]' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4 px-6 border-t border-[var(--color-border)]">
          <Link href="/" className="flex items-center gap-2 text-[var(--color-text-muted)] hover:text-white transition">
            <LogOut size={18} />
            <span className="font-semibold text-sm">Volver al sitio</span>
          </Link>
        </div>
      </aside>
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
}
