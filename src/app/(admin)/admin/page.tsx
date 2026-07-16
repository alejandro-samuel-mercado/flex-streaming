'use client';

import { useEffect, useState } from 'react';
import {
  Activity, Users, Film, Clock, TrendingUp,
  CheckCircle2, AlertTriangle, Loader2, Eye,
  UploadCloud, Star, RefreshCw
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

const COLOR: Record<string, string> = {
  blue: '#60a5fa', purple: '#FFD700', green: '#4ade80', yellow: '#facc15', red: '#f87171',
};

// Helper for relative time
function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} d`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(API_ROUTES.ADMIN.DASHBOARD);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError('Error loading dashboard data');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="adm-page flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
      </div>
    );
  }

  // Map Backend Data to KPI structure
  const kpis = data ? [
    { label: 'Usuarios activos', value: data.kpis.totalUsers?.toString() || '0', change: 'En la plataforma', up: true, icon: Users, color: 'blue' },
    { label: 'Contenido total', value: data.kpis.totalContent?.toString() || '0', change: 'Total subidos', up: true, icon: Film, color: 'purple' },
    { label: 'Vistas totales', value: data.kpis.totalViews?.toString() || '0', change: 'Reproducciones', up: true, icon: Activity, color: 'green' },
    { label: 'Cola de encoding', value: data.kpis.processingVideos?.toString() || '0', change: 'Videos procesando', up: null, icon: Clock, color: 'yellow' },
  ] : [];

  // Map Backend Data to Activity structure
  const activities = (data?.activity || []).map((log: any) => {
    let icon = Clock;
    let color = 'blue';
    let statusText = log.status;

    if (log.status === 'COMPLETED' || log.status === 'READY') { icon = CheckCircle2; color = 'green'; statusText = 'COMPLETADO'; }
    if (log.status === 'FAILED' || log.status === 'ERROR') { icon = AlertTriangle; color = 'red'; statusText = 'FALLIDO'; }
    if (log.status === 'PROCESSING') { icon = Loader2; color = 'yellow'; statusText = 'PROCESANDO'; }
    if (log.status === 'QUEUED') { icon = Clock; color = 'blue'; statusText = 'EN COLA'; }

    return {
      name: log.name,
      status: statusText,
      time: timeAgo(log.time),
      icon,
      color
    };
  });

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-subtitle">Resumen de la plataforma en tiempo real</p>
        </div>
        <div className="adm-header-actions">
          <button onClick={fetchDashboard} className="adm-btn adm-btn--ghost" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="!mb-6 !p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center !gap-3">
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
            <div className={`adm-kpi-change ${k.up === true ? 'up' : k.up === false ? 'down' : 'neutral'}`}>
              {k.up === true ? '↑' : k.up === false ? '↓' : '•'} {k.change}
            </div>
          </div>
        ))}
      </div>

      <div className="adm-dashboard-cols">
        {/* Activity */}
        <div className="adm-table-card" style={{ flex: 3 }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Actividad de Procesamiento</h2>
            <span className="adm-badge adm-badge--blue">Live</span>
          </div>
          <div className="adm-table-wrapper">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Proceso</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center !py-6 text-[var(--adm-muted)]">No hay actividad reciente</td>
                  </tr>
                )}
                {activities.map((row: any, i: number) => (
                  <tr key={i}>
                    <td>
                      <div className="adm-table-process">
                        <row.icon size={15} style={{ color: COLOR[row.color], flexShrink: 0 }}
                          className={row.color === 'yellow' ? 'animate-spin' : ''} />
                        {row.name}
                      </div>
                    </td>
                    <td>
                      <span className={`adm-badge adm-badge--${row.color}`}>{row.status}</span>
                    </td>
                    <td className="adm-table-muted">{row.time}</td>
                    <td>
                      <button className="adm-link">Ver</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top content */}
        <div className="adm-table-card" style={{ flex: 2 }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Top Contenido (Vistas)</h2>
            <TrendingUp size={16} style={{ color: '#FFD700' }} />
          </div>
          <div className="adm-top-list">
            {(data?.topContent || []).length === 0 && (
              <div className="text-center !py-6 text-[var(--adm-muted)] text-sm">Sin datos suficientes</div>
            )}
            {(data?.topContent || []).map((item: any, i: number) => (
              <div key={i} className="adm-top-item">
                <div className="adm-top-rank">{i + 1}</div>
                <div className="adm-top-info">
                  <div className="adm-top-title line-clamp-1">{item.title}</div>
                  <div className="adm-top-meta">
                    <span className="adm-badge adm-badge--gray" style={{ fontSize: '.6rem' }}>{item.type}</span>
                    <span className="adm-table-muted"><Eye size={11} /> {item.views}</span>
                  </div>
                </div>
                <div className="adm-top-rating">
                  <Star size={12} fill="#facc15" stroke="none" />
                  {item.rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
