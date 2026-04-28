'use client';

import {
  Activity, Users, Film, Clock, TrendingUp,
  CheckCircle2, AlertTriangle, Loader2, Eye,
  UploadCloud, Star
} from 'lucide-react';

const KPI = [
  { label: 'Usuarios activos', value: '24,592', change: '+12%', up: true, icon: Users, color: 'blue' },
  { label: 'Contenido total', value: '1,402', change: '+8 este mes', up: true, icon: Film, color: 'purple' },
  { label: 'Streams activos', value: '4,819', change: 'En este momento', up: true, icon: Activity, color: 'green' },
  { label: 'Cola de encoding', value: '3', change: 'Procesando', up: null, icon: Clock, color: 'yellow' },
];

const ACTIVITY = [
  { name: 'Oppenheimer (HLS 4K)', status: 'COMPLETADO', time: 'Hace 5 min', icon: CheckCircle2, color: 'green' },
  { name: 'Dune Part 2 (HLS 1080p)', status: 'PROCESANDO 45%', time: 'En curso', icon: Loader2, color: 'yellow' },
  { name: 'Respaldo de base de datos', status: 'COMPLETADO', time: 'Hace 3 h', icon: CheckCircle2, color: 'green' },
  { name: 'Dune Part 1 (encoding)', status: 'FALLIDO', time: 'Hace 4 h', icon: AlertTriangle, color: 'red' },
  { name: 'Avatar: El camino del agua', status: 'EN COLA', time: 'Próximo', icon: Clock, color: 'blue' },
];

const TOP_CONTENT = [
  { title: 'Oppenheimer', type: 'PELÍCULA', views: '84,293', rating: 9.1 },
  { title: 'The Last of Us T2', type: 'SERIE', views: '72,401', rating: 9.4 },
  { title: 'Dune: Parte 2', type: 'PELÍCULA', views: '65,837', rating: 8.9 },
  { title: 'House of the Dragon T2', type: 'SERIE', views: '58,120', rating: 8.5 },
];

const COLOR: Record<string, string> = {
  blue: '#60a5fa', purple: '#a78bfa', green: '#4ade80', yellow: '#facc15', red: '#f87171',
};

export default function AdminDashboardPage() {
  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Dashboard</h1>
          <p className="adm-page-subtitle">Resumen de la plataforma en tiempo real</p>
        </div>
        <div className="adm-header-actions">
          <button className="adm-btn adm-btn--ghost"><UploadCloud size={16} /> Subir video</button>
          <button className="adm-btn adm-btn--primary"><Film size={16} /> Nuevo contenido</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="adm-kpi-row">
        {KPI.map((k, i) => (
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
            <h2 className="adm-table-card-title">Actividad del sistema</h2>
            <span className="adm-badge adm-badge--blue">Live</span>
          </div>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Proceso</th>
                <th>Estado</th>
                <th>Hora</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ACTIVITY.map((row, i) => (
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
                    <button className="adm-link">Ver log</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top content */}
        <div className="adm-table-card" style={{ flex: 2 }}>
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Top Contenido</h2>
            <TrendingUp size={16} style={{ color: '#a78bfa' }} />
          </div>
          <div className="adm-top-list">
            {TOP_CONTENT.map((item, i) => (
              <div key={i} className="adm-top-item">
                <div className="adm-top-rank">{i + 1}</div>
                <div className="adm-top-info">
                  <div className="adm-top-title">{item.title}</div>
                  <div className="adm-top-meta">
                    <span className="adm-badge adm-badge--gray" style={{ fontSize: '.6rem' }}>{item.type}</span>
                    <span className="adm-table-muted"><Eye size={11} /> {item.views}</span>
                  </div>
                </div>
                <div className="adm-top-rating">
                  <Star size={12} fill="#facc15" stroke="none" />
                  {item.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
