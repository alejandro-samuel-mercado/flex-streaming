'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Film, Users, Settings, LogOut,
    UploadCloud, MonitorPlay, ChevronLeft, Bell,
    Search, Tag, Server, Menu, X, Activity,
    Calendar, Package, UserCheck, Coins,
    MessageSquare, Loader2
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import { useUploadStore } from '@/lib/upload-store';

const NAV = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/admin/content', label: 'Contenido', icon: Film },
    { href: '/admin/upload', label: 'Subidas / HLS', icon: UploadCloud },
    { href: '/admin/processing', label: 'Monitor Proceso', icon: Activity },
    { href: '/admin/taxonomy', label: 'Taxonomía', icon: Tag },
    { href: '/admin/homepage', label: 'Gestión Web', icon: LayoutDashboard },

    // ── User Management ──────────────────────────────────────────────────
    { href: '/admin/users', label: 'Usuarios', icon: Users },

    // ── Billing & Support ────────────────────────────────────────────────
    { href: '/admin/subscription-plans', label: 'Planes', icon: Calendar },
    { href: '/admin/credit-packages', label: 'Paquetes Créditos', icon: Package },
    { href: '/admin/comments', label: 'Comentarios', icon: MessageSquare },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

function pageTitle(p: string) {
    return NAV.find(n => n.exact ? p === n.href : (p === n.href || p.startsWith(n.href + '/')))?.label ?? 'Admin';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { files, hasHydrated } = useUploadStore();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authed, setAuthed] = useState<boolean | null>(null);

    // Notifications State
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifs, setNotifs] = useState<any[]>([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Prevención de salida/recarga accidental durante subidas
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const isUploading = files.some(f => f.status === 'uploading' && f.progress < 100);
            if (isUploading) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [files]);

    const fetchNotifs = async () => {
        setLoadingNotifs(true);
        try {
            const res = await adminFetch(API_ROUTES.ADMIN.DASHBOARD);
            const json = await res.json();
            if (json.success && json.data?.activity) {
                setNotifs(json.data.activity);
                setUnreadCount(json.data.activity.length);
            }
        } catch (e) { }
        setLoadingNotifs(false);
    };

    useEffect(() => {
        if (pathname === '/admin/login') { setAuthed(true); return; }
        const t = localStorage.getItem('adminToken');
        if (!t) router.replace('/admin/login');
        else setAuthed(true);
    }, [pathname, router]);

    const logout = useCallback(() => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        // Eliminar cookie para que el middleware bloquee /admin de inmediato
        document.cookie = 'adminToken=; path=/; max-age=0; SameSite=Lax';
        router.replace('/admin/login');
    }, [router]);

    if (pathname === '/admin/login') return <>{children}</>;
    if (authed === null) return null;

    const title = pageTitle(pathname);
    const uploadingFiles = files.filter(f => f.status === 'uploading');
    const uploadingCount = uploadingFiles.length;
    const totalProgress = uploadingCount > 0
        ? Math.round(uploadingFiles.reduce((acc, f) => acc + f.progress, 0) / uploadingCount)
        : 0;

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

                        <div className="relative">
                            <button
                                className={`adm-header-btn adm-notif-btn ${notifOpen ? 'text-[var(--color-primary)]' : ''}`}
                                title="Notificaciones"
                                onClick={() => {
                                    setNotifOpen(!notifOpen);
                                    if (!notifOpen && notifs.length === 0) fetchNotifs();
                                }}
                            >
                                <Bell size={16} />
                                {unreadCount > 0 && <span className="adm-notif-dot" />}
                            </button>

                            {notifOpen && (
                                <div className="absolute!  !top-full !right-0 !mt-3 !w-80 !bg-[#0A0A0F] !border !border-white/10 !shadow-2xl !rounded-xl  animate-in fade-in slide-in-from-top-2" style={{ zIndex: "99999 !important" }}>
                                    <div className="!p-4 !border-b !border-white/10 !flex !justify-between !items-center !bg-[#141414]">
                                        <h3 className="!font-bold !text-white !text-sm !m-0">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                className="!text-xs !text-[var(--color-primary)] hover:!underline !bg-transparent !border-none !p-0 !cursor-pointer"
                                                onClick={() => setUnreadCount(0)}
                                            >
                                                Marcar leídas
                                            </button>
                                        )}
                                    </div>
                                    <div className="!max-h-[300px] !overflow-y-auto !bg-[#0A0A0F]">
                                        {loadingNotifs ? (
                                            <div className="!p-6 !flex !justify-center"><Loader2 className="animate-spin text-[var(--color-primary)]" size={20} /></div>
                                        ) : notifs.length === 0 ? (
                                            <div className="!p-6 !text-center !text-[var(--adm-muted)] !text-sm">
                                                No hay notificaciones recientes.
                                            </div>
                                        ) : (
                                            notifs.map((n: any, idx: number) => (
                                                <div key={idx} className="!p-4 !border-b !border-white/5 hover:!bg-white/5 !transition-colors !cursor-pointer !flex !gap-3 !items-start">
                                                    <div className={`!mt-0.5 !w-2 !h-2 !rounded-full ${n.status === 'COMPLETED' ? '!bg-green-400' : n.status === 'FAILED' ? '!bg-red-400' : '!bg-blue-400'}`} />
                                                    <div className="!flex-1">
                                                        <p className="!text-xs !text-white !font-medium !mb-1 !m-0">{n.name}</p>
                                                        <p className="!text-[10px] !text-[var(--adm-muted)] !uppercase !m-0">{n.status} • {n.time}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
