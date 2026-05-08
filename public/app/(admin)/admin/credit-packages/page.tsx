'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Package, Gift, Coins } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { CreditPackage } from '@/types/reseller.types';

export default function CreditPackagesPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<CreditPackage | null>(null);
  const [form, setForm] = useState({ name: '', baseCredits: 10, bonusCredits: 0, isPromo: false, sortOrder: 0 });

  const fetchPkgs = useCallback(async () => {
    try {
      const res = await adminFetch(API_ROUTES.CREDIT_PACKAGES.ALL);
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPkgs(); }, [fetchPkgs]);

  const resetForm = () => { setForm({ name: '', baseCredits: 10, bonusCredits: 0, isPromo: false, sortOrder: 0 }); setEditingPkg(null); };
  const openCreate = () => { resetForm(); setShowModal(true); };
  const openEdit = (p: CreditPackage) => { setEditingPkg(p); setForm({ name: p.name, baseCredits: p.baseCredits, bonusCredits: p.bonusCredits, isPromo: p.isPromo, sortOrder: p.sortOrder }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPkg ? API_ROUTES.CREDIT_PACKAGES.BY_ID(editingPkg.id) : API_ROUTES.CREDIT_PACKAGES.BASE;
    try {
      const res = await adminFetch(url, { method: editingPkg ? 'PATCH' : 'POST', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setShowModal(false); resetForm(); fetchPkgs(); } else alert(json.error);
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string) => { await adminFetch(API_ROUTES.CREDIT_PACKAGES.TOGGLE(id), { method: 'PATCH' }); fetchPkgs(); };
  const handleDelete = async (id: string, name: string) => { if (!confirm(`¿Eliminar "${name}"?`)) return; const r = await adminFetch(API_ROUTES.CREDIT_PACKAGES.BY_ID(id), { method: 'DELETE' }); const j = await r.json(); if (j.success) fetchPkgs(); else alert(j.error); };

  if (loading) return <div className="adm-page"><p>Cargando...</p></div>;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Paquetes de Créditos</h1><p className="adm-page-subtitle">Paquetes que los revendedores pueden recibir</p></div>
        <div className="adm-header-actions"><button className="adm-btn adm-btn--primary" onClick={openCreate}><Plus size={16} /> Nuevo Paquete</button></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {packages.map(p => (
          <div key={p.id} className="adm-table-card" style={{ padding: '1.25rem', opacity: p.isActive ? 1 : 0.55 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{p.name}</h3>
              {p.isPromo && <span className="adm-badge adm-badge--purple">PROMO</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', marginBottom: '1rem', fontSize: '.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Coins size={14} style={{ opacity: .6 }} />{p.baseCredits} base</div>
              {p.bonusCredits > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Gift size={14} style={{ opacity: .6, color: '#a78bfa' }} />+{p.bonusCredits} bonus</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}><Package size={14} style={{ opacity: .6 }} />Total: {p.baseCredits + p.bonusCredits}</div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '.75rem' }}>
              <button className="adm-btn adm-btn--ghost" style={{ flex: 1, fontSize: '.78rem', padding: '.35rem' }} onClick={() => handleToggle(p.id)}>{p.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}{p.isActive ? 'Activo' : 'Inactivo'}</button>
              <button className="adm-btn adm-btn--ghost" style={{ padding: '.35rem .5rem' }} onClick={() => openEdit(p)}><Pencil size={14} /></button>
              <button className="adm-btn adm-btn--ghost" style={{ padding: '.35rem .5rem', color: '#f87171' }} onClick={() => handleDelete(p.id, p.name)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {packages.length === 0 && <div className="adm-table-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1/-1' }}><Package size={32} style={{ opacity: .3 }} /><p className="adm-table-muted">No hay paquetes</p><button className="adm-btn adm-btn--primary" onClick={openCreate}><Plus size={16} /> Crear</button></div>}
      </div>
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>{editingPkg ? 'Editar' : 'Nuevo'} Paquete</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field"><label className="adm-label">Nombre</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="adm-field"><label className="adm-label">Créditos base</label><input className="adm-input" type="number" min={1} value={form.baseCredits} onChange={e => setForm(f => ({ ...f, baseCredits: parseInt(e.target.value) || 1 }))} /></div>
                <div className="adm-field"><label className="adm-label">Bonus</label><input className="adm-input" type="number" min={0} value={form.bonusCredits} onChange={e => setForm(f => ({ ...f, bonusCredits: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem' }}><input type="checkbox" checked={form.isPromo} onChange={e => setForm(f => ({ ...f, isPromo: e.target.checked }))} /> ¿Promoción?</label>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary">{editingPkg ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
