'use client';

import { Activity, Users, Film, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-[var(--color-text-muted)]">Resumen de la plataforma y métricas en tiempo real</p>
      </div>

      {/* KPI Cards (Uses globals.css classes) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="flex justify-between items-start">
            <span className="kpi-label">Usuarios Activos</span>
            <Users className="text-[#00D4FF]" size={20} />
          </div>
          <span className="kpi-value text-gradient">24,592</span>
          <span className="text-xs text-[var(--color-success)]">+12% vs mes anterior</span>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-start">
            <span className="kpi-label">Contenido Total</span>
            <Film className="text-[var(--color-primary)]" size={20} />
          </div>
          <span className="kpi-value text-gradient">1,402</span>
          <span className="text-xs text-[var(--color-text-muted)]">Películas y Series</span>
        </div>

        <div className="kpi-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary-glow)] to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative z-10 flex justify-between items-start">
            <span className="kpi-label text-white">Streamings Activos</span>
            <Activity className="text-white animate-pulse" size={20} />
          </div>
          <span className="relative z-10 kpi-value text-white">4,819</span>
          <span className="relative z-10 text-xs text-white/70">En este momento</span>
        </div>

        <div className="kpi-card">
          <div className="flex justify-between items-start">
            <span className="kpi-label">Cola de Procesamiento</span>
            <Clock className="text-[var(--color-warning)]" size={20} />
          </div>
          <span className="kpi-value">3</span>
          <span className="text-xs text-[var(--color-warning)]">Videos en codificación (BullMQ)</span>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 mt-8">
        <h2 className="text-xl font-bold mb-6">Actividad Reciente en el Sistema</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="pb-3 font-semibold">Proceso</th>
                <th className="pb-3 font-semibold">Estado</th>
                <th className="pb-3 font-semibold">Fecha / Hora</th>
                <th className="pb-3 font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {[
                { name: 'Oppenheimer (HLS 4K)', status: 'Completado', time: 'Hace 5 min', color: 'success' },
                { name: 'Dune Part 2 (HLS)', status: 'Procesando 45%', time: 'En curso', color: 'warning' },
                { name: 'Respaldos Base de Datos', status: 'Completado', time: 'Hace 3 horas', color: 'success' },
                { name: 'Error en codificación', status: 'Fallido', time: 'Hace 4 horas', color: 'primary' },
              ].map((row, i) => (
                <tr key={i} className="hover:bg-[var(--color-surface-2)] transition-colors">
                  <td className="py-4 font-medium">{row.name}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      row.color === 'success' ? 'bg-[#46d369]/20 text-[#46d369]' :
                      row.color === 'warning' ? 'bg-[#f5c518]/20 text-[#f5c518]' :
                      'bg-[var(--color-error)]/20 text-[var(--color-error)]'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 text-[var(--color-text-muted)]">{row.time}</td>
                  <td className="py-4"><button className="text-[var(--color-primary)] hover:underline">Ver log</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
