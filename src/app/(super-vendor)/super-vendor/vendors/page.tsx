'use client';

import { useState, useEffect, useCallback } from 'react';
import { Coins, Send, ToggleLeft, ToggleRight, UserPlus, Trash2 } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { ResellerVendor } from '@/types/reseller.types';

export default function SuperVendorVendorsPage() {
  const [vendors, setVendors] = useState<ResellerVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCredits, setShowCredits] = useState<string | null>(null);
  const [creditsAmt, setCreditsAmt] = useState(10);
  const [form, setForm] = useState({ email: '', name: '', password: '', credits: 0 });

  const fetchVendors = useCallback(async () => {
    try { const r = await resellerFetch(API_ROUTES.RESELLER.LIST); const j = await r.json(); if (j.success) setVendors(j.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await resellerFetch(API_ROUTES.RESELLER.VENDORS, { method: 'POST', body: JSON.stringify(form) });
    const j = await r.json();
    if (j.success) { setShowCreate(false); setForm({ email: '', name: '', password: '', credits: 0 }); fetchVendors(); } else alert(j.error);
  };

  const handleCredits = async () => {
    if (!showCredits) return;
    const r = await resellerFetch(API_ROUTES.RESELLER.ASSIGN_CREDITS(showCredits), { method: 'POST', body: JSON.stringify({ amount: creditsAmt }) });
    const j = await r.json();
    if (j.success) { setShowCredits(null); fetchVendors(); } else alert(j.error);
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
        <table className="adm-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Créditos</th><th>Clientes</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 500 }}>{v.name}</td>
                <td className="adm-table-muted">{v.email}</td>
                <td><Coins size={14} style={{ color: '#facc15' }} /> {v.credits}</td>
                <td>{v._count.managedEndUsers}</td>
                <td><span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => { setShowCredits(v.id); setCreditsAmt(10); }} title="Asignar Créditos"><Send size={14} /></button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => handleToggle(v.id, v.isActive)} title={v.isActive ? 'Desactivar' : 'Activar'}>{v.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem', color: '#ef4444' }} onClick={() => handleDelete(v.id, v.name)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }} className="adm-table-muted">Sin vendedores</td></tr>}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="adm-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Nuevo Vendedor</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field"><label className="adm-label">Nombre</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="adm-field"><label className="adm-label">Email</label><input className="adm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div className="adm-field"><label className="adm-label">Contraseña</label><input className="adm-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
              <div className="adm-field"><label className="adm-label">Créditos iniciales</label><input className="adm-input" type="number" min={0} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} /></div>
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
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Asignar Créditos</h2>
            <div className="adm-field"><label className="adm-label">Cantidad</label><input className="adm-input" type="number" min={1} value={creditsAmt} onChange={e => setCreditsAmt(parseInt(e.target.value) || 1)} /></div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowCredits(null)}>Cancelar</button>
              <button className="adm-btn adm-btn--primary" onClick={handleCredits}>Asignar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
