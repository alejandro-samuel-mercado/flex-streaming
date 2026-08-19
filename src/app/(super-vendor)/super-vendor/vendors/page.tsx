'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Send, ToggleLeft, ToggleRight, UserPlus, Trash2, Key, Users, UserCheck, Edit3, Copy, MoreVertical } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { ResellerVendor } from '@/types/reseller.types';
import { useModal } from '@/components/ui/ModalProvider';
import CustomSelect from '@/components/ui/CustomSelect';

export default function SuperVendorVendorsPage() {
    const { showModal } = useModal();
    const [vendors, setVendors] = useState<ResellerVendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showCredits, setShowCredits] = useState<string | null>(null);
    const [showResetPwd, setShowResetPwd] = useState<{ id: string, name: string } | null>(null);
    const [newPwd, setNewPwd] = useState('');

    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [myCredits, setMyCredits] = useState<number | null>(null);
    const [form, setForm] = useState({ phone: '', username: '', name: '', password: '', packageId: '' });

    // Package Tab State
    const [pkgTab, setPkgTab] = useState<'NORMAL' | 'PROMO'>('NORMAL');

    // Menu State
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    // Edit Vendor State
    const [showEdit, setShowEdit] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ name: '', username: '', phone: '', password: '' });
    const [isEditing, setIsEditing] = useState(false);

    const fetchVendors = useCallback(async () => {
        try { const r = await resellerFetch(API_ROUTES.RESELLER.LIST); const j = await r.json(); if (j.success) setVendors(j.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    const fetchPackages = useCallback(async () => {
        try {
            const r = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.BASE);
            const j = await r.json();
            if (j.success) setPackages(j.data);
        } catch (e) { console.error(e); }
    }, []);

    const fetchCredits = useCallback(async () => {
        try {
            const r = await resellerFetch(API_ROUTES.AUTH.ME);
            const j = await r.json();
            if (j.success) setMyCredits(j.data.credits ?? 0);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchVendors(); fetchPackages(); fetchCredits(); }, [fetchVendors, fetchPackages, fetchCredits]);

    useEffect(() => {
        if (!openMenu) return;
        const handleOutsideClick = () => setOpenMenu(null);
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [openMenu]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.packageId) { alert('Debes seleccionar un paquete'); return; }

        const r = await resellerFetch(API_ROUTES.RESELLER.VENDORS, { method: 'POST', body: JSON.stringify({ phone: form.phone, username: form.username, name: form.name, password: form.password, credits: 0 }) });
        const j = await r.json();
        if (j.success) {
            const vendorId = j.data.id;
            const pRes = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(form.packageId), { method: 'POST', body: JSON.stringify({ targetUserId: vendorId }) });
            const pJson = await pRes.json();
            if (!pJson.success) alert('Vendedor creado pero hubo un error al asignar el paquete: ' + pJson.error);

            setShowCreate(false); setForm({ phone: '', username: '', name: '', password: '', packageId: '' }); fetchVendors(); fetchCredits();
        } else alert(j.error);
    };

    const handleCredits = async () => {
        if (!showCredits || !selectedPackageId) return;
        const r = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(selectedPackageId), { method: 'POST', body: JSON.stringify({ targetUserId: showCredits }) });
        const j = await r.json();
        if (j.success) { setShowCredits(null); setSelectedPackageId(''); fetchVendors(); fetchCredits(); } else alert(j.error);
    };

    const handleResetPwd = async () => {
        if (!showResetPwd || !newPwd) return;
        const r = await resellerFetch(`${API_ROUTES.RESELLER.LIST}/${showResetPwd.id}/password`, {
            method: 'PATCH',
            body: JSON.stringify({ password: newPwd })
        });
        const j = await r.json();
        if (j.success) { setShowResetPwd(null); setNewPwd(''); alert('Contraseña actualizada correctamente'); }
        else alert(j.error || 'Error al actualizar contraseña');
    };

    const handleToggle = async (id: string, active: boolean) => {
        await resellerFetch(API_ROUTES.RESELLER.STATUS(id), { method: 'PATCH', body: JSON.stringify({ isActive: !active }) });
        fetchVendors();
    };

    const handleEditVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEdit) return;
        setIsEditing(true);
        try {
            const payload: any = {
                name: editForm.name,
                username: editForm.username,
                phone: editForm.phone
            };
            if (editForm.password.trim().length >= 6) {
                payload.password = editForm.password;
            }

            const r = await resellerFetch(`${API_ROUTES.RESELLER.LIST}/${showEdit.id}`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });
            const j = await r.json();

            if (j.success || r.ok) {
                setShowEdit(null);
                fetchVendors();
            } else {
                alert(j.error || 'Error al actualizar vendedor');
            }
        } catch (err: any) {
            alert('Error de conexión: ' + err.message);
        } finally {
            setIsEditing(false);
        }
    };
    const handleDelete = async (id: string, name: string) => {
        showModal({
            title: '¿Eliminar vendedor?',
            message: `¿Estás seguro de eliminar al vendedor "${name}"? Esta acción no se puede deshacer y el vendedor no debe tener clientes activos.`,
            type: 'confirm',
            confirmText: 'Sí, eliminar',
            onConfirm: async () => {
                const r = await resellerFetch(`${API_ROUTES.RESELLER.LIST}/${id}`, { method: 'DELETE' });
                const j = await r.json();
                if (j.success || r.ok) {
                    fetchVendors();
                } else {
                    showModal({ title: 'Error', message: j.error || 'No se pudo eliminar', type: 'error' });
                }
            }
        });
    };

    if (loading) return <div className="adm-page"><p>Cargando...</p></div>;

    const selectedPkg = packages.find(p => p.id === form.packageId);

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div><h1 className="adm-page-title">Mis Vendedores</h1><p className="adm-page-subtitle">Gestiona tus vendedores y sus créditos</p></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <button
                        className="adm-btn adm-btn--primary"
                        onClick={() => setShowCreate(true)}
                        disabled={myCredits === 0}
                        style={myCredits === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <UserPlus size={16} /> Nuevo Vendedor
                    </button>
                    {myCredits === 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                            No tienes créditos. Debes recargar.
                        </span>
                    )}
                </div>
            </div>

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
                    background: linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(245, 158, 11, 0.15));
                    color: #facc15;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.2rem;
                    font-weight: 700;
                    box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.2);
                }
                .vendor-uc-status {
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 0.75rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
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
                    background: rgba(250, 204, 21, 0.15);
                    color: #facc15;
                    border-color: rgba(250, 204, 21, 0.3);
                }
                .vendor-uc-btn-primary:hover {
                    background: rgba(250, 204, 21, 0.25);
                    color: #fde047;
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
                    <div className="flex items-center !gap-3">
                        <div className="adm-card-icon"><Users size={18} /></div>
                        <h2 className="adm-table-card-title">Vendedores Gestionados</h2>
                    </div>
                    <div className="adm-badge adm-badge--gray">{vendors.length} Total</div>
                </div>
                <div className="vendor-cards-grid">
                    {vendors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-muted)', gridColumn: '1 / -1' }}>
                            <Users size={36} className="mx-auto mb-3 opacity-50" />
                            <p>No hay vendedores registrados todavía</p>
                        </div>
                    ) : (
                        vendors.map(v => (
                            <div key={v.id} className="vendor-user-card">
                                <div className="vendor-uc-header">
                                    <div className="vendor-uc-avatar-wrapper">
                                        <div className="vendor-uc-avatar">
                                            {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'white', letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>{v.name}</span>
                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ID: {v.id.substring(0,6)}...</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                        <span className={`vendor-uc-status adm-badge--${v.isActive ? 'green' : 'red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span>
                                    </div>
                                </div>

                                {/* Credentials Box */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.03)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Usuario</span>
                                            <span style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>{v.username || '-'}</span>
                                        </div>
                                        <button onClick={() => { if(v.username) navigator.clipboard.writeText(v.username) }} className="vendor-copy-btn">
                                            <Copy size={14} /> Copiar
                                        </button>
                                    </div>
                                </div>

                                <div className="vendor-uc-stats">
                                    <div className="vendor-uc-stat">
                                        <span className="vendor-uc-stat-label">Créditos</span>
                                        <span className="vendor-uc-stat-value" style={{ color: '#facc15' }}>
                                            <Coins size={14} /> {v.credits}
                                        </span>
                                    </div>
                                    <div className="vendor-uc-stat">
                                        <span className="vendor-uc-stat-label">Clientes</span>
                                        <span className="vendor-uc-stat-value">
                                            <UserCheck size={14} className="opacity-40" /> {v._count?.managedEndUsers || 0}
                                        </span>
                                    </div>
                                    {v.phone && (
                                        <div className="vendor-uc-stat" style={{ gridColumn: '1 / -1' }}>
                                            <span className="vendor-uc-stat-label">Teléfono</span>
                                            <span className="vendor-uc-stat-value" style={{ fontSize: '0.8rem' }}>{v.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="vendor-uc-actions">
                                    <button className="vendor-uc-btn vendor-uc-btn-primary" onClick={() => { setShowCredits(v.id); setSelectedPackageId(''); setPkgTab('NORMAL'); }}>
                                        <Send size={16} /> Enviar Créditos
                                    </button>
                                    <button className="vendor-uc-btn" onClick={() => handleToggle(v.id, v.isActive)}>
                                        {v.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    
                                    <div style={{ position: 'relative' }}>
                                        <button className="vendor-uc-btn vendor-uc-btn-icon" onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === v.id ? null : v.id); }}><MoreVertical size={18} /></button>
                                        {openMenu === v.id && (
                                            <div className="adm-dropdown" style={{ position: 'absolute', right: 0, bottom: '110%', zIndex: 100, minWidth: 200, background: '#0a0f25', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 8, boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                                <button className="adm-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowEdit(v); setEditForm({ name: v.name || '', username: v.username || '', phone: v.phone || '', password: '' }); setOpenMenu(null); }}>Editar Datos</button>
                                                <button className="adm-dropdown-item" onClick={(e) => { e.stopPropagation(); setShowResetPwd({ id: v.id, name: v.name }); setNewPwd(''); setOpenMenu(null); }}>Cambiar Contraseña</button>
                                                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '6px 0' }} />
                                                <button className="adm-dropdown-item text-red-400" onClick={(e) => { e.stopPropagation(); handleDelete(v.id, v.name); setOpenMenu(null); }}>Eliminar Vendedor</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Modal: Crear Vendedor ── */}
            {showCreate && (
                <div className="adm-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, maxHeight: '88vh', overflowY: 'auto' }}>
                        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem' }}>Nuevo Vendedor</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                            {/* Datos básicos */}
                            <div className="adm-field">
                                <label className="adm-label">Nombre</label>
                                <input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nombre completo" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                                <div className="adm-field">
                                    <label className="adm-label">Usuario</label>
                                    <input className="adm-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required placeholder="Nombre de usuario" />
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Nº de teléfono</label>
                                    <input className="adm-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="Ej: 1122334455" />
                                </div>
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Contraseña</label>
                                <input className="adm-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" />
                            </div>

                            {/* Selector de paquete — cards con Tabs */}
                            <div className="adm-field">
                                <label className="adm-label">Paquete Inicial de Créditos</label>

                                {/* Visual Tabs */}
                                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', marginBottom: '10px' }}>
                                    <button type="button" onClick={() => setPkgTab('NORMAL')} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, background: pkgTab === 'NORMAL' ? 'rgba(255, 215, 0,0.2)' : 'transparent', color: pkgTab === 'NORMAL' ? '#FFD700' : 'var(--adm-muted)' }}>
                                        Normal
                                    </button>
                                    <button type="button" onClick={() => setPkgTab('PROMO')} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, background: pkgTab === 'PROMO' ? 'rgba(234,179,8,0.2)' : 'transparent', color: pkgTab === 'PROMO' ? '#facc15' : 'var(--adm-muted)' }}>
                                        Promoción
                                    </button>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 220, overflowY: 'auto', paddingRight: '.25rem' }}>
                                    {packages.filter(p => pkgTab === 'PROMO' ? p.isPromo : !p.isPromo).length === 0 && (
                                        <p className="adm-table-muted" style={{ fontSize: '.82rem', textAlign: 'center', padding: '1rem' }}>No hay paquetes en esta categoría</p>
                                    )}
                                    {packages.filter(p => pkgTab === 'PROMO' ? p.isPromo : !p.isPromo).map((pkg: any) => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, packageId: pkg.id }))}
                                            style={{
                                                padding: '.6rem .85rem',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                border: form.packageId === pkg.id ? '2px solid #FFD700' : '1px solid rgba(255,255,255,.08)',
                                                borderRadius: '10px',
                                                background: form.packageId === pkg.id ? 'rgba(255, 215, 0,0.08)' : 'rgba(255,255,255,0.02)',
                                                transition: 'all .2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <strong style={{ fontSize: '.88rem', color: 'white' }}>{pkg.name}</strong>
                                                    {pkg.isPromo && <span style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.2)', color: '#facc15', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>PROMO</span>}
                                                </div>
                                                <span style={{ fontSize: '.82rem', fontWeight: 700, color: pkg.isPromo ? '#facc15' : '#FFD700' }}>
                                                    {pkg.baseCredits + (pkg.bonusCredits || 0)} créditos
                                                </span>
                                            </div>
                                            {pkg.bonusCredits > 0 && (
                                                <div style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.4)', marginTop: '.15rem' }}>
                                                    {pkg.baseCredits} base + {pkg.bonusCredits} bonus
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen */}
                            {selectedPkg && (
                                <div style={{ padding: '.75rem', background: 'rgba(250,204,21,0.04)', borderRadius: '10px', fontSize: '.85rem', border: '1px solid rgba(250,204,21,0.15)' }}>
                                    <div style={{ fontWeight: 700, marginBottom: '.3rem', color: '#facc15', fontSize: '.75rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Resumen del Paquete</div>
                                    <div>Paquete: <strong>{selectedPkg.name}</strong></div>
                                    <div>Créditos a asignar: <strong style={{ color: '#facc15' }}>{selectedPkg.baseCredits + (selectedPkg.bonusCredits || 0)}</strong></div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.25rem' }}>
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={!form.packageId}>Crear Vendedor</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal: Asignar Créditos ── */}
            {showCredits && (
                <div className="adm-modal-overlay" onClick={() => setShowCredits(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Asignar Paquete</h2>

                        <div className="adm-field">
                            <label className="adm-label">Seleccionar Paquete</label>

                            {/* Visual Tabs */}
                            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '10px', marginBottom: '10px' }}>
                                <button type="button" onClick={() => setPkgTab('NORMAL')} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, background: pkgTab === 'NORMAL' ? 'rgba(255, 215, 0,0.2)' : 'transparent', color: pkgTab === 'NORMAL' ? '#FFD700' : 'var(--adm-muted)' }}>
                                    Normal
                                </button>
                                <button type="button" onClick={() => setPkgTab('PROMO')} style={{ flex: 1, padding: '6px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '.75rem', fontWeight: 600, background: pkgTab === 'PROMO' ? 'rgba(234,179,8,0.2)' : 'transparent', color: pkgTab === 'PROMO' ? '#facc15' : 'var(--adm-muted)' }}>
                                    Promoción
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 220, overflowY: 'auto', paddingRight: '.25rem' }}>
                                {packages.filter(p => pkgTab === 'PROMO' ? p.isPromo : !p.isPromo).length === 0 && (
                                    <p className="adm-table-muted" style={{ fontSize: '.82rem', textAlign: 'center', padding: '1rem' }}>No hay paquetes en esta categoría</p>
                                )}
                                {packages.filter(p => pkgTab === 'PROMO' ? p.isPromo : !p.isPromo).map((pkg: any) => (
                                    <button
                                        key={pkg.id}
                                        type="button"
                                        onClick={() => setSelectedPackageId(pkg.id)}
                                        style={{
                                            padding: '.6rem .85rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            border: selectedPackageId === pkg.id ? '2px solid #FFD700' : '1px solid rgba(255,255,255,.08)',
                                            borderRadius: '10px',
                                            background: selectedPackageId === pkg.id ? 'rgba(255, 215, 0,0.08)' : 'rgba(255,255,255,0.02)',
                                            transition: 'all .2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <strong style={{ fontSize: '.88rem', color: 'white' }}>{pkg.name}</strong>
                                                {pkg.isPromo && <span style={{ fontSize: '0.65rem', background: 'rgba(234,179,8,0.2)', color: '#facc15', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>PROMO</span>}
                                            </div>
                                            <span style={{ fontSize: '.82rem', fontWeight: 700, color: pkg.isPromo ? '#facc15' : '#FFD700' }}>
                                                {pkg.baseCredits + (pkg.bonusCredits || 0)} créditos
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="adm-btn adm-btn--ghost" onClick={() => setShowCredits(null)}>Cancelar</button>
                            <button className="adm-btn adm-btn--primary" onClick={handleCredits} disabled={!selectedPackageId}>Asignar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal: Editar Vendedor ── */}
            {showEdit && (
                <div className="adm-modal-overlay" onClick={() => setShowEdit(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
                        <div className="adm-modal-header" style={{ padding: 0, border: 'none', marginBottom: '1.25rem' }}>
                            <h2 className="adm-modal-title" style={{ fontSize: '1.1rem' }}>Editar Vendedor</h2>
                        </div>
                        <form onSubmit={handleEditVendor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="adm-field">
                                <label className="adm-label">Nombre</label>
                                <input className="adm-input" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nombre completo" />
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Usuario</label>
                                <input className="adm-input" value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} required placeholder="Nombre de usuario" />
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Nº de teléfono</label>
                                <input className="adm-input" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} required placeholder="Ej: 1122334455" />
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Nueva Contraseña (opcional)</label>
                                <input className="adm-input" type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Dejar en blanco para no cambiar" minLength={6} />
                            </div>
                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowEdit(null)}>Cancelar</button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isEditing}>
                                    {isEditing ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Modal: Cambiar Contraseña ── */}
            {showResetPwd && (
                <div className="adm-modal-overlay" onClick={() => setShowResetPwd(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Cambiar Clave: {showResetPwd.name}</h2>
                        <div className="adm-field">
                            <label className="adm-label">Nueva Contraseña</label>
                            <input className="adm-input" type="text" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="adm-btn adm-btn--ghost" onClick={() => setShowResetPwd(null)}>Cancelar</button>
                            <button className="adm-btn adm-btn--primary" onClick={handleResetPwd} disabled={newPwd.length < 6}>Guardar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
