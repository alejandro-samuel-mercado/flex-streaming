'use client';

import { useState, useEffect } from 'react';
import { Search, Copy, Eye, EyeOff, MoreVertical, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
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
 
    useEffect(() => {
        if (!openMenu) return;
        const handleOutsideClick = () => setOpenMenu(null);
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [openMenu]);

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
                <div className="adm-table-card-header">
                    <div className="adm-toolbar" style={{ width: '100%' }}>
                        <div className="adm-search-wrap" style={{ maxWidth: 360 }}>
                            <Search className="adm-search-icon" size={15} />
                            <input className="adm-search-input" placeholder="Buscar por usuario o email..." value={search} onChange={e => onSearchChange(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>Usuario</th>
                                <th style={{ textAlign: 'center' }}>Contraseña</th>
                                <th style={{ textAlign: 'center' }}>Revendedor</th>
                                <th style={{ textAlign: 'center' }}>Vencimiento</th>
                                <th style={{ textAlign: 'center' }}>Estado</th>
                                <th style={{ textAlign: 'center' }}>Tipo / Plan</th>
                                <th style={{ textAlign: 'center' }}>Disp.</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="adm-table-empty"><div className="animate-spin mb-4"><Zap size={24} /></div><p>Cargando clientes...</p></td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={8} className="adm-table-empty"><Search size={32} /><p>No se encontraron clientes</p></td></tr>
                            ) : (
                                users.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="adm-table-user justify-center">
                                                <div className="adm-table-avatar" style={{ background: u.type === 'DEMO' ? 'linear-gradient(135deg, #facc1522, #f59e0b44)' : undefined, color: u.type === 'DEMO' ? '#facc15' : undefined }}>
                                                    {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                                                </div>
                                                <div className="adm-table-user-info text-center">
                                                    <span className="adm-table-user-name">{u.username}</span>
                                                    <button className="adm-link text-[10px] opacity-40 hover:opacity-100 flex items-center justify-center gap-1 w-full" onClick={() => copyText(u.username)}><Copy size={10} /> Copiar</button>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="font-mono text-[13px] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                                    {visiblePw.has(u.id) ? u.password : '••••••••'}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                    <button className="adm-icon-btn" title="Ver/Ocultar" onClick={() => togglePw(u.id)}>{visiblePw.has(u.id) ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                                                    <button className="adm-icon-btn" title="Copiar contraseña" onClick={() => copyText(u.password)}><Copy size={14} /></button>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex flex-col items-center justify-center">
                                                <span className="font-medium">@{u.managedBy?.username || u.managedBy?.name || '—'}</span>
                                                {u.managedBy?.parent && (
                                                    <span className="text-[10px] text-purple-400/80 mt-0.5">
                                                        Super: @{u.managedBy.parent.username || u.managedBy.parent.name}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{expiryBadge(u)}</td>
                                        <td style={{ textAlign: 'center' }}><span className={`adm-badge adm-badge--${STATUS_COLORS[u.status] || 'gray'}`}>{u.status}</span></td>
                                        <td>
                                            <div className="flex flex-col items-center justify-center">
                                                <span className={`adm-badge adm-badge--${TYPE_COLORS[u.type] || 'gray'} mb-1`}>{u.type}</span>
                                                {u.plan && <span className="text-[10px] text-purple-400/70 font-bold">{u.plan.name}</span>}
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button className="adm-badge adm-badge--gray cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setDevicesModal(u)}>
                                                <DeviceIcons count={u.connectedDevicesCount} max={u.maxDevices} />
                                            </button>
                                        </td>
                                        <td>
                                            <div className="adm-table-actions justify-center">
                                                <button className="adm-icon-btn" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}><MoreVertical size={16} /></button>
                                                {openMenu === u.id && (
                                                    <div className="adm-dropdown" style={{ position: 'absolute', right: 20, zIndex: 100, minWidth: 180, background: '#0a0f25', border: '1px solid var(--adm-border)', borderRadius: 12, padding: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                                        <button className="adm-dropdown-item" onClick={() => { setPwModal(u); setOpenMenu(null); }}>Cambiar contraseña</button>
                                                        <button className="adm-dropdown-item" onClick={() => { setPlanModal(u); setOpenMenu(null); }}>Agregar plan</button>
                                                        <button className="adm-dropdown-item" onClick={() => { handlePause(u); setOpenMenu(null); }}>{u.status === 'ACTIVE' ? 'Pausar' : 'Reanudar'}</button>
                                                        <button className="adm-dropdown-item" onClick={() => { setDevicesModal(u); setOpenMenu(null); }}>Dispositivos</button>
                                                        <div style={{ height: 1, background: 'var(--adm-border)', margin: '4px 0' }} />
                                                        <button className="adm-dropdown-item text-red-400" onClick={() => { handleDelete(u); setOpenMenu(null); }}>Eliminar cuenta</button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="adm-table-footer">
                    <span>Mostrando clientes ({users.length})</span>
                    {totalPages > 1 && (
                        <div className="adm-pagination">
                            <button className="adm-page-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={14} /></button>
                            <div className="adm-page-btn adm-page-btn--active">{page}</div>
                            <button className="adm-page-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight size={14} /></button>
                        </div>
                    )}
                </div>
            </div>

            {planModal && <AddPlanModal account={planModal} onClose={() => setPlanModal(null)} onSuccess={() => { setPlanModal(null); onRefresh(); }} fetchFn={fetchFn} />}
            {devicesModal && <DevicesModal account={devicesModal} onClose={() => setDevicesModal(null)} onRefresh={onRefresh} fetchFn={fetchFn} />}
            {pwModal && <ChangePasswordModal account={pwModal} onClose={() => setPwModal(null)} onSuccess={() => { setPwModal(null); onRefresh(); }} fetchFn={fetchFn} />}
        </>
    );
}
