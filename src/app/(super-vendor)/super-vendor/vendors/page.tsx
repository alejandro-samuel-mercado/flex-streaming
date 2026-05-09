'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Send, ToggleLeft, ToggleRight, UserPlus, Trash2, Key, Users, UserCheck } from 'lucide-react';
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

    const fetchVendors = useCallback(async () => {
        try { const r = await resellerFetch(API_ROUTES.RESELLER.LIST); const j = await r.json(); if (j.success) setVendors(j.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    const fetchPackages = useCallback(async () => {
        try {
            const r = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.ALL);
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

            <div className="adm-table-card">
                <div className="adm-table-card-header">
                    <div className="flex items-center gap-3">
                        <div className="adm-card-icon"><Users size={18} /></div>
                        <h2 className="adm-table-card-title">Vendedores Gestionados</h2>
                    </div>
                    <div className="adm-badge adm-badge--gray">{vendors.length} Total</div>
                </div>
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'center' }}>Nombre</th>
                                <th style={{ textAlign: 'center' }}>Usuario</th>
                                <th style={{ textAlign: 'center' }}>Nº de teléfono</th>
                                <th style={{ textAlign: 'center' }}>Créditos</th>
                                <th style={{ textAlign: 'center' }}>Clientes</th>
                                <th style={{ textAlign: 'center' }}>Estados</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendors.map(v => (
                                <tr key={v.id}>
                                    <td>
                                        <div className="adm-table-user justify-center">
                                            <div className="adm-table-avatar" style={{ background: `linear-gradient(135deg, #7c3aed22, #3b82f644)` }}>
                                                {v.name ? v.name.charAt(0).toUpperCase() : 'V'}
                                            </div>
                                            <div className="adm-table-user-info">
                                                <span className="adm-table-user-name">{v.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="adm-table-user-email">{v.username || '-'}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className="adm-table-user-email">{v.phone || '-'}</span>
                                    </td>
                                    <td>
                                        <div className="adm-table-credits justify-center">
                                            <Coins size={14} /> <span>{v.credits}</span>
                                        </div>
                                    </td>
                                    <td className="adm-table-muted">
                                        <div className="flex items-center justify-center gap-2">
                                            <UserCheck size={14} className="opacity-40" />
                                            {v._count.managedEndUsers}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span>
                                    </td>
                                    <td>
                                        <div className="adm-table-actions justify-center">
                                            <button className="adm-icon-btn" onClick={() => { setShowCredits(v.id); setSelectedPackageId(packages[0]?.id || ''); }} title="Asignar Paquete"><Send size={14} /></button>
                                            <button className="adm-icon-btn" onClick={() => { setShowResetPwd({ id: v.id, name: v.name }); setNewPwd(''); }} title="Cambiar Contraseña"><Key size={14} /></button>
                                            <button className="adm-icon-btn" onClick={() => handleToggle(v.id, v.isActive)} title={v.isActive ? 'Desactivar' : 'Activar'}>{v.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                                            <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => handleDelete(v.id, v.name)} title="Eliminar"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && <tr><td colSpan={7} className="adm-table-empty"><Users size={32} style={{ margin: '0 auto' }} /><p>No hay vendedores registrados todavía</p></td></tr>}
                        </tbody>
                    </table>
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

                            {/* Selector de paquete — cards */}
                            <div className="adm-field">
                                <label className="adm-label">Paquete Inicial de Créditos</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', maxHeight: 220, overflowY: 'auto', paddingRight: '.25rem' }}>
                                    {packages.length === 0 && (
                                        <p className="adm-table-muted" style={{ fontSize: '.82rem', textAlign: 'center', padding: '.5rem' }}>No hay paquetes disponibles</p>
                                    )}
                                    {packages.map((pkg: any) => (
                                        <button
                                            key={pkg.id}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, packageId: pkg.id }))}
                                            style={{
                                                padding: '.6rem .85rem',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                border: form.packageId === pkg.id ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,.08)',
                                                borderRadius: '10px',
                                                background: form.packageId === pkg.id ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                                                transition: 'all .2s',
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '.88rem', color: 'white' }}>{pkg.name}</strong>
                                                <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#facc15' }}>
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
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Asignar Paquete</h2>
                        <div className="adm-field">
                            <label className="adm-label">Seleccionar Paquete</label>
                            <CustomSelect
                                options={packages.map(pkg => ({ id: pkg.id, name: `${pkg.name} (${pkg.baseCredits} cr.)` }))}
                                value={selectedPackageId}
                                onChange={val => setSelectedPackageId(val as string)}
                                placeholder="Elegir paquete de créditos..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="adm-btn adm-btn--ghost" onClick={() => setShowCredits(null)}>Cancelar</button>
                            <button className="adm-btn adm-btn--primary" onClick={handleCredits} disabled={!selectedPackageId}>Asignar</button>
                        </div>
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
