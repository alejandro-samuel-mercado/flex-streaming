'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Coins, Activity, TrendingUp, RefreshCw, Loader2, AlertTriangle, AlertCircle, Zap } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';
import { CreditHistoryModal } from '@/components/reseller/CreditHistoryModal';

const COLOR: Record<string, string> = {
    blue: '#60a5fa', green: '#4ade80', yellow: '#facc15', purple: '#FFD700',
};

export default function SuperVendorDashboard() {
    const [stats, setStats] = useState({ vendors: 0, endUsers: 0, credits: 0, expiringUsers: 0 });
    const [recentVendors, setRecentVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [vRes, euRes, meRes, expiringRes] = await Promise.all([
                resellerFetch(API_ROUTES.RESELLER.LIST),
                resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1`),
                resellerFetch(API_ROUTES.AUTH.ME),
                resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1&expiringInDays=5`),
            ]);

            const vJson = await vRes.json();
            const euJson = await euRes.json();
            const meJson = await meRes.json();
            const expiringJson = await expiringRes.json();

            if (vJson.success && euJson.success && meJson.success) {
                setStats({
                    vendors: vJson.data.length,
                    endUsers: euJson.data.total,
                    credits: meJson.data.credits ?? 0,
                    expiringUsers: expiringJson.success ? expiringJson.data.total : 0,
                });
                setRecentVendors(vJson.data.slice(0, 5));
            } else {
                setError('Error al cargar datos del dashboard');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const kpis = [
        { label: 'Mis Vendedores', value: stats.vendors, icon: Users, color: 'blue', desc: 'Vendedores directos' },
        { label: 'Mis Clientes', value: stats.endUsers, icon: UserCheck, color: 'green', desc: 'Cuentas creadas' },
        { label: 'Por Vencer', value: stats.expiringUsers, icon: AlertCircle, color: 'yellow', desc: 'En próximos 5 días' },
        { label: 'Mis Créditos', value: stats.credits, icon: Coins, color: 'purple', desc: 'Saldo disponible' },
    ];

    if (loading && !stats.vendors && !stats.credits) {
        return (
            <div className="adm-page flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
            </div>
        );
    }

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Dashboard</h1>
                    <p className="adm-page-subtitle">Panel de control y resumen de tu red de distribución</p>
                </div>
                <div className="adm-header-actions">
                    <button onClick={fetchData} className="adm-header-btn" title="Refrescar datos" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="adm-alert adm-alert--error !mb-6">
                    <AlertTriangle size={18} />
                    <div className="adm-alert-content">
                        <div className="adm-alert-title">Error de Conexión</div>
                        <div className="adm-alert-desc">{error}</div>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="adm-kpi-row">
                {kpis.map((k, i) => (
                    <div key={i} className="adm-kpi">
                        <div className="adm-kpi-top">
                            <div className="adm-kpi-info">
                                <span className="adm-kpi-label">{k.label}</span>
                                <div className="adm-kpi-value">{k.value}</div>
                            </div>
                            <div className="adm-kpi-icon-wrapper" style={{ color: COLOR[k.color], background: COLOR[k.color] + '15' }}>
                                <k.icon size={22} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="adm-kpi-footer">
                            <div className="adm-kpi-trend neutral">
                                <Activity size={12} />
                                <span>{k.desc}</span>
                            </div>
                            {i === 3 && (
                                <button
                                    className="adm-kpi-action"
                                    onClick={() => setShowHistoryModal(true)}
                                >
                                    Historial
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="adm-dashboard-cols">
                {/* Recent Vendors */}
                <div className="adm-table-card" style={{ flex: 3 }}>
                    <div className="adm-table-card-header">
                        <div className="flex items-center !gap-3">
                            <div className="adm-card-icon"><Users size={18} /></div>
                            <h2 className="adm-table-card-title">Vendedores Recientes</h2>
                        </div>
                        <Link href="/super-vendor/vendors" className="adm-btn adm-btn--ghost adm-btn--sm">Ver todos</Link>
                    </div>
                    <div className="adm-table-wrapper">
                        <table className="adm-table">
                            <thead>
                                <tr>
                                    <th>Vendedor</th>
                                    <th>Créditos</th>
                                    <th>Clientes</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentVendors.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={4} className="adm-table-empty">
                                            <Users size={32} />
                                            <p>No tienes vendedores registrados</p>
                                        </td>
                                    </tr>
                                )}
                                {recentVendors.map((v: any, i: number) => (
                                    <tr key={i}>
                                        <td>
                                            <div className="adm-table-user">
                                                <div className="adm-table-avatar" style={{ background: `linear-gradient(135deg, ${COLOR.blue}22, ${COLOR.purple}22)` }}>
                                                    {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                                                </div>
                                                <div className="adm-table-user-info">
                                                    <span className="adm-table-user-name">{v.name}</span>
                                                    <span className="adm-table-user-email">{v.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="adm-table-credits">
                                                <Coins size={14} /> <span>{v.credits}</span>
                                            </div>
                                        </td>
                                        <td className="adm-table-muted">
                                            <div className="flex items-center !gap-2">
                                                <UserCheck size={14} className="opacity-40" />
                                                {v._count?.managedEndUsers ?? 0}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>
                                                {v.isActive ? 'ACTIVO' : 'INACTIVO'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="adm-table-card" style={{ flex: 2 }}>
                    <div className="adm-table-card-header">
                        <div className="flex items-center !gap-3">
                            <div className="adm-card-icon accent"><Zap size={18} /></div>
                            <h2 className="adm-table-card-title">Acciones Rápidas</h2>
                        </div>
                    </div>
                    <div className="!p-5 flex flex-col !gap-4">
                        <Link href="/super-vendor/vendors" className="adm-quick-action-card group">
                            <div className="adm-quick-action-icon" style={{ background: 'var(--adm-accent)15', color: 'var(--adm-accent)' }}>
                                <Users size={20} />
                            </div>
                            <div className="adm-quick-action-info">
                                <div className="adm-quick-action-title">Nuevo Vendedor</div>
                                <div className="adm-quick-action-desc">Expande tu red de distribución</div>
                            </div>
                            <div className="adm-quick-action-arrow">→</div>
                        </Link>

                        <Link href="/super-vendor/end-users" className="adm-quick-action-card group">
                            <div className="adm-quick-action-icon" style={{ background: '#10b98115', color: '#10b981' }}>
                                <UserCheck size={20} />
                            </div>
                            <div className="adm-quick-action-info">
                                <div className="adm-quick-action-title">Gestionar Clientes</div>
                                <div className="adm-quick-action-desc">Administra cuentas de usuario final</div>
                            </div>
                            <div className="adm-quick-action-arrow">→</div>
                        </Link>

                        <div className="adm-balance-card">
                            <div className="adm-balance-pattern" />
                            <div className="relative z-10">
                                <div className="adm-balance-label">Tu Saldo Disponible</div>
                                <div className="adm-balance-amount">
                                    {stats.credits} <span className="adm-balance-unit">créditos</span>
                                </div>
                                <p className="adm-balance-desc">Utiliza tus créditos para cargar planes a tus vendedores o clientes directos.</p>
                                <div className="!mt-4">
                                    <button className="adm-btn adm-btn--white adm-btn--sm" onClick={() => setShowHistoryModal(true)}>Ver movimientos</button>
                                </div>
                            </div>
                            <Coins size={80} className="adm-balance-icon-bg" />
                        </div>
                    </div>
                </div>
            </div>

            <CreditHistoryModal
                isOpen={showHistoryModal}
                onClose={() => setShowHistoryModal(false)}
            />
        </div>
    );
}

