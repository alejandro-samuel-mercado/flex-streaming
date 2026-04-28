'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Film, Users, Settings, LogOut,
    UploadCloud, MonitorPlay, ChevronLeft, Bell,
    Search, Tag, Server, Menu, X, Activity
} from 'lucide-react';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/content', label: 'Contenido', icon: Film },
    { href: '/admin/upload', label: 'Subidas / HLS', icon: UploadCloud },
    { href: '/admin/processing', label: 'Monitor Proceso', icon: Activity },
    { href: '/admin/categories', label: 'Categorías', icon: Tag },
    { href: '/admin/platforms', label: 'Plataformas', icon: Server },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

function pageTitle(p: string) {
    return NAV.find(n => n.exact ? p === n.href : (p === n.href || p.startsWith(n.href + '/')))?.label ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authed, setAuthed] = useState<boolean | null>(null);

    useEffect(() => {
        if (pathname === '/admin/login') { setAuthed(true); return; }
        const t = localStorage.getItem('adminToken');
        if (!t) router.replace('/admin/login');
        else setAuthed(true);
    }, [pathname, router]);

    const logout = useCallback(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        router.replace('/admin/login');
    }, [router]);

    if (pathname === '/admin/login') return <>{children}</>;
    if (authed === null) return null;

    const title = pageTitle(pathname);

    return (
        <div className={`adm-root${collapsed ? ' adm-root--collapsed' : ''}`}>
            {/* ── SIDEBAR ── */}
            <aside className={`adm-sidebar${mobileOpen ? ' adm-sidebar--open' : ''}`}>
                <div className="adm-sidebar-logo-row">
                    <Link href="/admin" className="adm-sidebar-logo" onClick={() => setMobileOpen(false)}>
                        <MonitorPlay size={24} strokeWidth={1.5} className="adm-logo-icon" />
                        <span className="adm-logo-text">FLEXSTREAMING</span>
                    </Link>
                    <button className="adm-collapse-btn" onClick={() => setCollapsed(c => !c)} title={collapsed ? 'Expandir' : 'Colapsar'}>
                        <ChevronLeft size={15} className="adm-collapse-chevron" />
                    </button>
                </div>

                <nav className="adm-sidebar-nav">
                    <span className="adm-nav-section-label">NAVEGACIÓN</span>
                    {NAV.map(item => {
                        const active = item.exact ? pathname === item.href : (pathname === item.href || pathname.startsWith(item.href + '/'));
                        return (
                            <Link key={item.href} href={item.href}
                                className={`adm-nav-link${active ? ' adm-nav-link--active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon size={18} strokeWidth={active ? 2 : 1.5} className="adm-nav-icon" />
                                <span className="adm-nav-label">{item.label}</span>
                                {active && <span className="adm-nav-pip" />}
                            </Link>
                        );
                    })}
                </nav>

                <div className="adm-sidebar-bottom">
                    <Link href="/" className="adm-nav-link adm-nav-link--muted" title={collapsed ? 'Ver sitio' : undefined}>
                        <MonitorPlay size={18} strokeWidth={1.5} className="adm-nav-icon" />
                        <span className="adm-nav-label">Ver sitio</span>
                    </Link>
                    <button className="adm-nav-link adm-nav-link--muted adm-logout-btn" onClick={logout} title={collapsed ? 'Salir' : undefined}>
                        <LogOut size={18} strokeWidth={1.5} className="adm-nav-icon" />
                        <span className="adm-nav-label">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {mobileOpen && <div className="adm-mobile-overlay" onClick={() => setMobileOpen(false)} />}

            {/* ── CONTENT WRAPPER ── */}
            <div className="adm-content-wrapper">
                {/* Header — shares same bg as sidebar → creates the visual "L-frame" */}
                <header className="adm-header">
                    <div className="adm-header-left">
                        <button className="adm-hamburger" onClick={() => setMobileOpen(o => !o)}>
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="adm-breadcrumb">
                            <span className="adm-breadcrumb-root">Admin</span>
                            <span className="adm-breadcrumb-sep">/</span>
                            <span className="adm-breadcrumb-current">{title}</span>
                        </div>
                    </div>
                    <div className="adm-header-right">
                        <button className="adm-header-btn" title="Buscar"><Search size={16} /></button>
                        <button className="adm-header-btn adm-notif-btn" title="Notificaciones">
                            <Bell size={16} />
                            <span className="adm-notif-dot" />
                        </button>
                        <div className="adm-avatar" title="Admin">A</div>
                    </div>
                </header>

                {/* The curved "content island" */}
                <main className="adm-main">
                    {children}
                </main>
            </div>
        </div>
    );
}
