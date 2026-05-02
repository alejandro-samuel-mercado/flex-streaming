'use client';

import { useState } from 'react';
import { Search, Copy, Eye, EyeOff, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import type { EndUserAccount } from '@/types/reseller.types';
import AddPlanModal from './AddPlanModal';
import DevicesModal from './DevicesModal';
import ChangePasswordModal from './ChangePasswordModal';

const STATUS_COLORS: Record<string, string> = { ACTIVE: 'green', PAUSED: 'yellow', INACTIVE: 'gray', EXPIRED: 'red', DEMO: 'purple' };
const TYPE_COLORS: Record<string, string> = { DEMO: 'yellow', FORMAL: 'blue' };

function DeviceIcons({ count, max }: { count: number; max: number }) {
  return <span style={{ fontSize: '.82rem', display: 'flex', alignItems: 'center', gap: '.25rem' }}>{count}/{max}</span>;
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function expiryBadge(user: EndUserAccount) {
  if (!user.endDate) {
    if (user.plan) return <span className="adm-badge adm-badge--yellow">Pendiente Login</span>;
    return <span className="adm-badge adm-badge--gray">Sin plan</span>;
  }
  const end = new Date(user.endDate);
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return <span className="adm-badge adm-badge--red">{formatDate(user.endDate)}</span>;
  if (diffDays <= 7) return <span className="adm-badge adm-badge--yellow">{formatDate(user.endDate)}</span>;
  return <span className="adm-badge adm-badge--green">{formatDate(user.endDate)}</span>;
}

interface Props {
  users: EndUserAccount[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onRefresh: () => void;
  fetchFn: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function EndUsersTable({ users, loading, search, onSearchChange, page, totalPages, onPageChange, onRefresh, fetchFn }: Props) {
  const [visiblePw, setVisiblePw] = useState<Set<string>>(new Set());
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [planModal, setPlanModal] = useState<EndUserAccount | null>(null);
  const [devicesModal, setDevicesModal] = useState<EndUserAccount | null>(null);
  const [pwModal, setPwModal] = useState<EndUserAccount | null>(null);

  const togglePw = (id: string) => setVisiblePw(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const copyText = (text: string) => navigator.clipboard.writeText(text);

  const handlePause = async (acc: EndUserAccount) => {
    if (!confirm(`${acc.status === 'ACTIVE' ? 'Pausar' : 'Reanudar'} "${acc.username}"?`)) return;
    await fetchFn(API_ROUTES.END_USERS.PAUSE(acc.id), { method: 'POST' });
    onRefresh();
  };

  const handleDelete = async (acc: EndUserAccount) => {
    if (!confirm(`¿Eliminar cuenta "${acc.username}"?`)) return;
    const r = await fetchFn(API_ROUTES.END_USERS.BY_ID(acc.id), { method: 'DELETE' });
    const j = await r.json();
    if (j.success) onRefresh(); else alert(j.error);
  };

  return (
    <>
      <div className="adm-table-card">
        <div style={{ padding: '1rem', display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: '.6rem', top: '50%', transform: 'translateY(-50%)', opacity: .4 }} />
            <input className="adm-input" style={{ paddingLeft: '2rem' }} placeholder="Buscar por usuario..." value={search} onChange={e => onSearchChange(e.target.value)} />
          </div>
        </div>

        <table className="adm-table">
          <thead><tr><th>Usuario</th><th>Contraseña</th><th>Revendedor</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Tipo</th><th>Disp.</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr> :
              users.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }} className="adm-table-muted">Sin resultados</td></tr> :
              users.map(u => (
                <tr key={u.id}>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><span style={{ fontWeight: 500 }}>{u.username}</span><button className="adm-btn adm-btn--ghost" style={{ padding: '2px' }} onClick={() => copyText(u.username)} title="Copiar"><Copy size={12} /></button></div></td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><span style={{ fontFamily: 'monospace', fontSize: '.8rem' }}>{visiblePw.has(u.id) ? u.password : '••••••'}</span><button className="adm-btn adm-btn--ghost" style={{ padding: '2px' }} onClick={() => togglePw(u.id)}>{visiblePw.has(u.id) ? <EyeOff size={12} /> : <Eye size={12} />}</button><button className="adm-btn adm-btn--ghost" style={{ padding: '2px' }} onClick={() => copyText(u.password)} title="Copiar"><Copy size={12} /></button></div></td>
                  <td className="adm-table-muted" style={{ fontSize: '.82rem' }}>{u.managedBy?.name || u.managedBy?.email || '—'}</td>
                  <td className="adm-table-muted" style={{ fontSize: '.82rem' }}>{formatDate(u.startDate)}</td>
                  <td>{expiryBadge(u)}</td>
                  <td><span className={`adm-badge adm-badge--${STATUS_COLORS[u.status] || 'gray'}`}>{u.status}</span></td>
                  <td><span className={`adm-badge adm-badge--${TYPE_COLORS[u.type] || 'gray'}`}>{u.type}</span></td>
                  <td><button className="adm-btn adm-btn--ghost" style={{ padding: '2px 4px', fontSize: '.8rem' }} onClick={() => setDevicesModal(u)}><DeviceIcons count={u.connectedDevicesCount} max={u.maxDevices} /></button></td>
                  <td>
                    <div style={{ position: 'relative' }}>
                      <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem' }} onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}><MoreVertical size={15} /></button>
                      {openMenu === u.id && (
                        <div className="adm-dropdown" style={{ position: 'absolute', right: 0, top: '100%', zIndex: 50, minWidth: 180, background: 'var(--adm-surface, #1a1a2e)', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.4)', padding: '.3rem', border: '1px solid rgba(255,255,255,.08)' }}>
                          <button className="adm-dropdown-item" onClick={() => { setPwModal(u); setOpenMenu(null); }}>✏️ Cambiar contraseña</button>
                          <button className="adm-dropdown-item" onClick={() => { setPlanModal(u); setOpenMenu(null); }}>➕ Agregar plan</button>
                          <button className="adm-dropdown-item" onClick={() => { handlePause(u); setOpenMenu(null); }}>{u.status === 'ACTIVE' ? '⏸️ Pausar' : '▶️ Reanudar'}</button>
                          <button className="adm-dropdown-item" onClick={() => { setDevicesModal(u); setOpenMenu(null); }}>📱 Dispositivos</button>
                          <button className="adm-dropdown-item" style={{ color: '#f87171' }} onClick={() => { handleDelete(u); setOpenMenu(null); }}>🗑️ Eliminar</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <button className="adm-btn adm-btn--ghost" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></button>
            <span style={{ fontSize: '.85rem' }}>{page} / {totalPages}</span>
            <button className="adm-btn adm-btn--ghost" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      {planModal && <AddPlanModal account={planModal} onClose={() => setPlanModal(null)} onSuccess={() => { setPlanModal(null); onRefresh(); }} fetchFn={fetchFn} />}
      {devicesModal && <DevicesModal account={devicesModal} onClose={() => setDevicesModal(null)} onRefresh={onRefresh} fetchFn={fetchFn} />}
      {pwModal && <ChangePasswordModal account={pwModal} onClose={() => setPwModal(null)} onSuccess={() => { setPwModal(null); onRefresh(); }} fetchFn={fetchFn} />}
    </>
  );
}
