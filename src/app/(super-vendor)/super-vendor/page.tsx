'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Coins, Activity, TrendingUp, Clock, RefreshCw, Loader2, AlertTriangle, Send } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';

const COLOR: Record<string, string> = {
  blue: '#60a5fa', green: '#4ade80', yellow: '#facc15', purple: '#a78bfa',
};

export default function SuperVendorDashboard() {
  const [stats, setStats] = useState({ vendors: 0, endUsers: 0, credits: 0 });
  const [recentVendors, setRecentVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [vRes, euRes, meRes] = await Promise.all([
        resellerFetch(API_ROUTES.RESELLER.LIST),
        resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1`),
        resellerFetch(API_ROUTES.AUTH.ME),
      ]);

      const vJson = await vRes.json();
      const euJson = await euRes.json();
      const meJson = await meRes.json();

      if (vJson.success && euJson.success && meJson.success) {
        setStats({
          vendors: vJson.data.length,
          endUsers: euJson.data.total,
          credits: meJson.data.credits ?? 0,
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
    { label: 'Mis Créditos', value: stats.credits, icon: Coins, color: 'yellow', desc: 'Saldo disponible' },
    { label: 'Actividad', value: 'Live', icon: Activity, color: 'purple', desc: 'Estado del sistema' },
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
          <p className="adm-page-subtitle">Resumen de tu red de revendedores</p>
        </div>
        <div className="adm-header-actions">
          <button onClick={fetchData} className="adm-btn adm-btn--ghost" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
        </div>
      )}

      {/* KPIs */}
      <div className="adm-kpi-row">
        {kpis.map((k, i) => (
          <div key={i} className="adm-kpi">
            <div className="adm-kpi-top">
              <span className="adm-kpi-label">{k.label}</span>
              <div className="adm-kpi-icon" style={{ color: COLOR[k.color], background: COLOR[k.color] + '18' }}>
                <k.icon size={18} />
              </div>
            </div>
            <div className="adm-kpi-value">{k.value}</div>
            <div className="adm-kpi-change neutral">
              • {k.desc}
            </div>
          </div>
        ))}
      </div>

      <div className="adm-dashboard-cols">
        {/* Recent Vendors */}
        <div className="adm-table-card" style={{ flex: 3 }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Vendedores Recientes</h2>
            <Link href="/super-vendor/vendors" className="adm-link text-xs">Ver todos</Link>
          </div>
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
              {recentVendors.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-[var(--adm-muted)]">No tienes vendedores registrados</td>
                </tr>
              )}
              {recentVendors.map((v: any, i: number) => (
                <tr key={i}>
                  <td>
                    <div className="adm-table-process">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                        {v.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{v.name}</span>
                        <span className="text-[10px] text-gray-500">{v.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5 font-mono text-yellow-500">
                      <Coins size={12} /> {v.credits}
                    </div>
                  </td>
                  <td className="adm-table-muted">{v._count?.managedEndUsers ?? 0}</td>
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

        {/* Quick Actions / Tips */}
        <div className="adm-table-card" style={{ flex: 2 }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Acciones Rápidas</h2>
            <TrendingUp size={16} className="text-purple-400" />
          </div>
          <div className="p-4 flex flex-col gap-3">
            <Link href="/super-vendor/vendors" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <div>
                <div className="text-sm font-bold">Nuevo Vendedor</div>
                <div className="text-[11px] text-gray-500">Expande tu red de reventa</div>
              </div>
            </Link>

            <Link href="/super-vendor/end-users" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="text-sm font-bold">Gestionar Clientes</div>
                <div className="text-[11px] text-gray-500">Administra cuentas finales</div>
              </div>
            </Link>

            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/20 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <Coins size={80} />
              </div>
              <div className="relative z-10">
                <div className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Tu Saldo</div>
                <div className="text-2xl font-black text-white flex items-baseline gap-2">
                  {stats.credits} <span className="text-sm font-normal text-gray-400">créditos</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Usa tus créditos para cargar cuentas de tus vendedores o clientes directos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

