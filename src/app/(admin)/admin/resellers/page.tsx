'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Coins, UserPlus, ToggleLeft, ToggleRight, Trash2, Send } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { ResellerVendor } from '@/types/reseller.types';

export default function ResellersPage() {
  const [vendors, setVendors] = useState<ResellerVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'super' | 'regular'>('super');
  const [showCreditsModal, setShowCreditsModal] = useState<string | null>(null);
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [form, setForm] = useState({ email: '', name: '', password: '', credits: 0 });

  const fetchVendors = useCallback(async () => {
    try {
      const res = await adminFetch(API_ROUTES.RESELLER.LIST);
      const json = await res.json();
      if (json.success) setVendors(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchVendors(); }, [fetchVendors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = createType === 'super' ? API_ROUTES.RESELLER.SUPER_VENDORS : API_ROUTES.RESELLER.VENDORS;
    try {
      const res = await adminFetch(url, { method: 'POST', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setShowCreateModal(false); setForm({ email: '', name: '', password: '', credits: 0 }); fetchVendors(); }
      else alert(json.error);
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    await adminFetch(API_ROUTES.RESELLER.STATUS(id), { method: 'PATCH', body: JSON.stringify({ isActive: !currentActive }) });
    fetchVendors();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar revendedor "${name}"?`)) return;
    const r = await adminFetch(API_ROUTES.RESELLER.BY_ID(id), { method: 'DELETE' });
    const j = await r.json();
    if (j.success) fetchVendors(); else alert(j.error);
  };

  const handleAssignCredits = async () => {
    if (!showCreditsModal || creditsAmount < 1) return;
    const r = await adminFetch(API_ROUTES.RESELLER.ASSIGN_CREDITS(showCreditsModal), { method: 'POST', body: JSON.stringify({ amount: creditsAmount }) });
    const j = await r.json();
    if (j.success) { setShowCreditsModal(null); setCreditsAmount(10); fetchVendors(); } else alert(j.error);
  };

  const roleBadge = (role: string) => {
    if (role === 'SUPER_VENDOR') return <span className="adm-badge adm-badge--purple">SUPER VENDEDOR</span>;
    return <span className="adm-badge adm-badge--blue">VENDEDOR</span>;
  };

  if (loading) return <div className="adm-page"><p>Cargando...</p></div>;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Revendedores</h1><p className="adm-page-subtitle">Super Vendedores y Vendedores del sistema</p></div>
        <div className="adm-header-actions" style={{ display: 'flex', gap: '.5rem' }}>
          <button className="adm-btn adm-btn--ghost" onClick={() => { setCreateType('regular'); setShowCreateModal(true); }}><UserPlus size={16} /> Vendedor</button>
          <button className="adm-btn adm-btn--primary" onClick={() => { setCreateType('super'); setShowCreateModal(true); }}><Plus size={16} /> Super Vendedor</button>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Créditos</th><th>Vendedores</th><th>Clientes</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 500 }}>{v.name}</td>
                <td className="adm-table-muted">{v.email}</td>
                <td>{roleBadge(v.role)}</td>
                <td><span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}><Coins size={14} style={{ color: '#facc15' }} />{v.credits}</span></td>
                <td>{v._count.children}</td>
                <td>{v._count.managedEndUsers}</td>
                <td><span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => { setShowCreditsModal(v.id); setCreditsAmount(10); }} title="Asignar créditos"><Send size={14} /></button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => handleToggleStatus(v.id, v.isActive)} title={v.isActive ? 'Desactivar' : 'Activar'}>{v.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem', color: '#f87171' }} onClick={() => handleDelete(v.id, v.name || '')} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}><Users size={28} style={{ opacity: .3 }} /><p className="adm-table-muted">Sin revendedores</p></td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="adm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Nuevo {createType === 'super' ? 'Super Vendedor' : 'Vendedor'}</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field"><label className="adm-label">Nombre</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div className="adm-field"><label className="adm-label">Email</label><input className="adm-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
              <div className="adm-field"><label className="adm-label">Contraseña</label><input className="adm-input" type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} /></div>
              <div className="adm-field"><label className="adm-label">Créditos iniciales</label><input className="adm-input" type="number" min={0} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} /></div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Credits Modal */}
      {showCreditsModal && (
        <div className="adm-modal-overlay" onClick={() => setShowCreditsModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Asignar Créditos</h2>
            <div className="adm-field"><label className="adm-label">Cantidad</label><input className="adm-input" type="number" min={1} value={creditsAmount} onChange={e => setCreditsAmount(parseInt(e.target.value) || 1)} /></div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowCreditsModal(null)}>Cancelar</button>
              <button className="adm-btn adm-btn--primary" onClick={handleAssignCredits}><Send size={14} /> Asignar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
