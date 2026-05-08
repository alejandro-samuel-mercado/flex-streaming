'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Send, ToggleLeft, ToggleRight, UserPlus, Trash2, Key, Users, UserCheck } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { ResellerVendor } from '@/types/reseller.types';

export default function SuperVendorVendorsPage() {
    const [vendors, setVendors] = useState<ResellerVendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showCredits, setShowCredits] = useState<string | null>(null);
    const [showResetPwd, setShowResetPwd] = useState<{ id: string, name: string } | null>(null);
    const [newPwd, setNewPwd] = useState('');

    const [packages, setPackages] = useState<any[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');
    const [form, setForm] = useState({ email: '', name: '', password: '', packageId: '' });

    const fetchVendors = useCallback(async () => {
        try { const r = await resellerFetch(API_ROUTES.RESELLER.LIST); const j = await r.json(); if (j.success) setVendors(j.data); }
        catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    const fetchPackages = useCallback(async () => {
        try { const r = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.BASE); const j = await r.json(); if (j.success) setPackages(j.data); }
        catch (e) { console.error(e); }
    }, []);

    useEffect(() => { fetchVendors(); fetchPackages(); }, [fetchVendors, fetchPackages]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.packageId) { alert('Debes seleccionar un paquete'); return; }

        // Create vendor with 0 credits
        const r = await resellerFetch(API_ROUTES.RESELLER.VENDORS, { method: 'POST', body: JSON.stringify({ email: form.email, name: form.name, password: form.password, credits: 0 }) });
        const j = await r.json();
        if (j.success) {
            const vendorId = j.data.id;
            // Apply package
            const pRes = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(form.packageId), { method: 'POST', body: JSON.stringify({ targetUserId: vendorId }) });
            const pJson = await pRes.json();
            if (!pJson.success) alert('Vendedor creado pero hubo un error al asignar el paquete: ' + pJson.error);

            setShowCreate(false); setForm({ email: '', name: '', password: '', packageId: '' }); fetchVendors();
        } else alert(j.error);
    };

    const handleCredits = async () => {
        if (!showCredits || !selectedPackageId) return;
        const r = await resellerFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(selectedPackageId), { method: 'POST', body: JSON.stringify({ targetUserId: showCredits }) });
        const j = await r.json();
        if (j.success) { setShowCredits(null); setSelectedPackageId(''); fetchVendors(); } else alert(j.error);
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
        if (!confirm(`¿Estás seguro de eliminar al vendedor "${name}"? No debe tener clientes activos.`)) return;
        const r = await resellerFetch(`${API_ROUTES.RESELLER.LIST}/${id}`, { method: 'DELETE' });
        const j = await r.json();
        if (j.success || r.ok) fetchVendors(); else alert(j.error || 'No se pudo eliminar');
    };

    if (loading) return <div className="adm-page"><p>Cargando...</p></div>;

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div><h1 className="adm-page-title">Mis Vendedores</h1><p className="adm-page-subtitle">Gestiona tus vendedores y sus créditos</p></div>
                <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}><UserPlus size={16} /> Nuevo Vendedor</button>
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
                        <thead><tr><th>Vendedor</th><th>Créditos</th><th>Clientes</th><th>Estado</th><th>Acciones</th></tr></thead>
                        <tbody>
                            {vendors.map(v => (
                                <tr key={v.id}>
                                    <td>
                                        <div className="adm-table-user">
                                            <div className="adm-table-avatar" style={{ background: `linear-gradient(135deg, #7c3aed22, #3b82f644)` }}>
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
                                        <div className="flex items-center gap-2">
                                            <UserCheck size={14} className="opacity-40" />
                                            {v._count.managedEndUsers}
                                        </div>
                                    </td>
                                    <td><span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span></td>
                                    <td>
                                        <div className="adm-table-actions">
                                            <button className="adm-icon-btn" onClick={() => { setShowCredits(v.id); setSelectedPackageId(packages[0]?.id || ''); }} title="Asignar Paquete"><Send size={14} /></button>
                                            <button className="adm-icon-btn" onClick={() => { setShowResetPwd({ id: v.id, name: v.name }); setNewPwd(''); }} title="Cambiar Contraseña"><Key size={14} /></button>
                                            <button className="adm-icon-btn" onClick={() => handleToggle(v.id, v.isActive)} title={v.isActive ? 'Desactivar' : 'Activar'}>{v.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                                            <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => handleDelete(v.id, v.name)} title="Eliminar"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vendors.length === 0 && <tr><td colSpan={5} className="adm-table-empty"><Users size={32} /><p>No hay vendedores registrados todavía</p></td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <div className="adm-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Nuevo Vendedor</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                            <div className="adm-field"><label className="adm-label">Nombre</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
                            <div className="adm-field"><label className="adm-label">Email</label><input className="adm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
                            <div className="adm-field"><label className="adm-label">Contraseña</label><input className="adm-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
                            <div className="adm-field">
                                <label className="adm-label">Paquete Inicial</label>
                                <select className="adm-input" value={form.packageId} onChange={e => setForm(f => ({ ...f, packageId: e.target.value }))} required>
                                    <option value="">-- Seleccionar paquete --</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>{pkg.name} (Cuesta {pkg.baseCredits} cr.)</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button type="submit" className="adm-btn adm-btn--primary">Crear</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCredits && (
                <div className="adm-modal-overlay" onClick={() => setShowCredits(null)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 340 }}>
                        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Asignar Paquete</h2>
                        <div className="adm-field">
                            <label className="adm-label">Seleccionar Paquete</label>
                            <select className="adm-input" value={selectedPackageId} onChange={e => setSelectedPackageId(e.target.value)} required>
                                <option value="">-- Seleccionar paquete --</option>
                                {packages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>{pkg.name} (Cuesta {pkg.baseCredits} cr.)</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <button className="adm-btn adm-btn--ghost" onClick={() => setShowCredits(null)}>Cancelar</button>
                            <button className="adm-btn adm-btn--primary" onClick={handleCredits} disabled={!selectedPackageId}>Asignar</button>
                        </div>
                    </div>
                </div>
            )}

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
