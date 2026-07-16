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
    if (user.deletedAt) return <span className="adm-badge adm-badge--red">Eliminado</span>;
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
            <style dangerouslySetInnerHTML={{ __html: `
                .vendor-cards-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 20px;
                    padding: 10px 0;
                }
                .vendor-user-card {
                    background: rgba(15, 20, 35, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .vendor-user-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .vendor-uc-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }
                .vendor-uc-avatar-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }
                .vendor-uc-avatar {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.15));
                    color: #a78bfa;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: 700;
                    box-shadow: inset 0 0 0 1px rgba(167, 139, 250, 0.2);
                }
                .vendor-uc-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .vendor-uc-name {
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: white;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    letter-spacing: -0.3px;
                }
                .vendor-uc-password {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 0.85rem;
                    color: #94a3b8;
                    background: rgba(0,0,0,0.4);
                    padding: 3px 8px;
                    border-radius: 6px;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    width: fit-content;
                }
                .vendor-uc-status {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .vendor-uc-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 12px;
                    background: rgba(0, 0, 0, 0.3);
                    padding: 14px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.02);
                }
                .vendor-uc-stat {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .vendor-uc-stat-label {
                    font-size: 0.7rem;
                    color: #64748b;
                    text-transform: uppercase;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }
                .vendor-uc-stat-value {
                    font-size: 0.9rem;
                    color: #e2e8f0;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .vendor-uc-actions {
                    display: flex;
                    gap: 8px;
                    margin-top: auto;
                    padding-top: 4px;
                }
                .vendor-uc-btn {
                    flex: 1;
                    height: 42px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: #e2e8f0;
                    font-size: 0.85rem;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .vendor-uc-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                .vendor-uc-btn-primary {
                    background: rgba(167, 139, 250, 0.15);
                    color: #a78bfa;
                    border-color: rgba(167, 139, 250, 0.3);
                }
                .vendor-uc-btn-primary:hover {
                    background: rgba(167, 139, 250, 0.25);
                    color: #c4b5fd;
                }
                .vendor-copy-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .vendor-copy-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                .vendor-uc-btn-icon {
                    flex: 0 0 42px;
                    width: 42px;
                    height: 42px;
                    padding: 0;
                }
                @media (max-width: 600px) {
                    .vendor-cards-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}} />
            <div className="adm-table-card">
                <div className="adm-table-card-header">
                    <div className="adm-toolbar" style={{ width: '100%' }}>
                        <div className="adm-search-wrap" style={{ maxWidth: 360 }}>
                            <Search className="adm-search-icon" size={15} />
                            <input className="adm-search-input" placeholder="Buscar por usuario o email..." value={search} onChange={e => onSearchChange(e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="vendor-cards-grid">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-muted)', gridColumn: '1 / -1' }}><div className="animate-spin mb-4 flex justify-center"><Zap size={28} /></div><p>Cargando clientes...</p></div>
                    ) : users.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-muted)', gridColumn: '1 / -1' }}><Search size={36} className="mx-auto mb-3 opacity-50" /><p>No se encontraron clientes</p></div>
                    ) : (
                        users.map(u => (
                            <div key={u.id} className="vendor-user-card">
                                <div className="vendor-uc-header">
                                    <div className="vendor-uc-avatar-wrapper">
                                        <div className="vendor-uc-avatar" style={{ background: u.type === 'DEMO' ? 'linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(245, 158, 11, 0.15))' : undefined, color: u.type === 'DEMO' ? '#facc15' : undefined, boxShadow: u.type === 'DEMO' ? 'inset 0 0 0 1px rgba(250, 204, 21, 0.2)' : undefined }}>
                                            {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'white', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{u.username}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ID: {u.id.substring(0,6)}...</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <span className={`vendor-uc-status adm-badge--${STATUS_COLORS[u.status] || 'gray'}`}>{u.status}</span>
                                        {expiryBadge(u)}
                                    </div>
                                </div>

                                {/* Credentials Box */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Usuario</span>
                                            <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>{u.username}</span>
                                        </div>
                                        <button onClick={() => copyText(u.username)} className="vendor-copy-btn">
                                            <Copy size={14} /> Copiar
                                        </button>
                                    </div>
                                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Contraseña</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontFamily: 'monospace', color: '#a78bfa', fontSize: '1.05rem', fontWeight: 600 }}>
                                                    {visiblePw.has(u.id) ? u.password : '••••••••'}
                                                </span>
                                                <button onClick={() => togglePw(u.id)} style={{ border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }} onMouseOver={e => e.currentTarget.style.background='rgba(255,255,255,0.05)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                                                    {visiblePw.has(u.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <button onClick={() => copyText(u.password)} className="vendor-copy-btn">
                                            <Copy size={14} /> Copiar
                                        </button>
                                    </div>
                                </div>

                                <div className="vendor-uc-stats">
                                    <div className="vendor-uc-stat">
                                        <span className="vendor-uc-stat-label">Tipo / Plan</span>
                                        <span className="vendor-uc-stat-value">
                                            <span className={`adm-badge adm-badge--${TYPE_COLORS[u.type] || 'gray'}`} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{u.type}</span>
                                            {u.plan && <span style={{ color: '#a78bfa' }}>{u.plan.name}</span>}
                                        </span>
                                    </div>
                                    <div className="vendor-uc-stat">
                                        <span className="vendor-uc-stat-label">Dispositivos</span>
                                        <span className="vendor-uc-stat-value">
                                            <button className="adm-badge adm-badge--gray cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setDevicesModal(u)} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                                                <DeviceIcons count={u.connectedDevicesCount} max={u.maxDevices} />
                                            </button>
                                        </span>
                                    </div>
                                </div>

                                <div className="vendor-uc-actions">
                                    {u.deletedAt ? (
                                        <div style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textAlign: 'center', borderRadius: 12, fontSize: '0.9rem', fontWeight: 600 }}>Usuario Eliminado</div>
                                    ) : (
                                        <>
                                            <button className="vendor-uc-btn vendor-uc-btn-primary" onClick={() => setPlanModal(u)}>+ Plan</button>
                                            <button className="vendor-uc-btn" onClick={() => handlePause(u)}>{u.status === 'ACTIVE' ? 'Pausar' : 'Activar'}</button>
                                            
                                            <div style={{ position: 'relative' }}>
                                                <button className="vendor-uc-btn vendor-uc-btn-icon" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === u.id ? null : u.id); }}><MoreVertical size={18} /></button>
                                                {openMenu === u.id && (
                                                    <div className="adm-dropdown" style={{ position: 'absolute', right: 0, bottom: '110%', zIndex: 100, minWidth: 200, background: '#0a0f25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                                        <button className="adm-dropdown-item" onClick={() => { setPwModal(u); setOpenMenu(null); }}>Cambiar contraseña</button>
                                                        <button className="adm-dropdown-item" onClick={() => { setDevicesModal(u); setOpenMenu(null); }}>Gestionar dispositivos</button>
                                                        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                                                        <button className="adm-dropdown-item text-red-400" onClick={() => { handleDelete(u); setOpenMenu(null); }}>Eliminar cuenta</button>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
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
