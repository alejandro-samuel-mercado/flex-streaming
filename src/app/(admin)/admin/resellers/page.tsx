'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Coins, UserPlus, ToggleLeft, ToggleRight, Trash2, Send, Package, Calendar, CheckCircle } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { ResellerVendor, CreditPackage, SubscriptionPlan } from '@/types/reseller.types';

export default function ResellersPage() {
  const [vendors, setVendors] = useState<ResellerVendor[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'super' | 'regular'>('super');
  
  const [showCreditsModal, setShowCreditsModal] = useState<string | null>(null);
  const [selectedPkgId, setSelectedPkgId] = useState<string>('');
  
  const [showPlanModal, setShowPlanModal] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const [form, setForm] = useState({ phone: '', username: '', name: '', password: '', credits: 0, planId: '' });

  const fetchData = useCallback(async () => {
    try {
      const [vRes, pRes, sRes] = await Promise.all([
        adminFetch(API_ROUTES.RESELLER.LIST),
        adminFetch(API_ROUTES.CREDIT_PACKAGES.ALL),
        adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.ALL),
      ]);
      const vJson = await vRes.json();
      const pJson = await pRes.json();
      const sJson = await sRes.json();

      if (vJson.success) setVendors(vJson.data);
      if (pJson.success) {
        const sortedPkgs = pJson.data.sort((a: CreditPackage, b: CreditPackage) => (a.baseCredits + a.bonusCredits) - (b.baseCredits + b.bonusCredits));
        setPackages(sortedPkgs);
      }
      if (sJson.success) {
        const sortedPlans = sJson.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.durationDays - b.durationDays);
        setPlans(sortedPlans);
      }
    } catch (err) { console.error('Fetch error:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = createType === 'super' ? API_ROUTES.RESELLER.SUPER_VENDORS : API_ROUTES.RESELLER.VENDORS;
    try {
      const res = await adminFetch(url, { method: 'POST', body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { 
        setShowCreateModal(false); 
        setForm({ phone: '', username: '', name: '', password: '', credits: 0, planId: '' }); 
        fetchData(); 
      }
      else alert(json.error);
    } catch (err) { console.error(err); }
  };

  const handleToggleStatus = async (id: string, currentActive: boolean) => {
    await adminFetch(API_ROUTES.RESELLER.STATUS(id), { method: 'PATCH', body: JSON.stringify({ isActive: !currentActive }) });
    fetchData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar revendedor "${name}"?`)) return;
    const r = await adminFetch(API_ROUTES.RESELLER.BY_ID(id), { method: 'DELETE' });
    const j = await r.json();
    if (j.success) fetchData(); else alert(j.error);
  };

  const handleApplyPackage = async () => {
    if (!showCreditsModal || !selectedPkgId) return;
    const r = await adminFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(selectedPkgId), { 
      method: 'POST', 
      body: JSON.stringify({ targetUserId: showCreditsModal }) 
    });
    const j = await r.json();
    if (j.success) { setShowCreditsModal(null); setSelectedPkgId(''); fetchData(); } else alert(j.error);
  };

  const handleAssignPlan = async () => {
    if (!showPlanModal || !selectedPlanId) return;
    const r = await adminFetch(`${API_ROUTES.RESELLER.BY_ID(showPlanModal)}/plan`, { 
      method: 'POST', 
      body: JSON.stringify({ planId: selectedPlanId }) 
    });
    const j = await r.json();
    if (j.success) { setShowPlanModal(null); setSelectedPlanId(''); fetchData(); } else alert(j.error);
  };

  const roleBadge = (role: string) => {
    if (role === 'SUPER_VENDOR') return <span className="adm-badge adm-badge--purple">SUPER VENDEDOR</span>;
    return <span className="adm-badge adm-badge--blue">VENDEDOR</span>;
  };

  if (loading) return <div className="adm-page"><p>Cargando revendedores...</p></div>;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Revendedores</h1><p className="adm-page-subtitle">Gestión de jerarquía y balance de créditos</p></div>
        <div className="adm-header-actions" style={{ display: 'flex', gap: '.5rem' }}>
          <button className="adm-btn adm-btn--ghost" onClick={() => { setCreateType('regular'); setShowCreateModal(true); }}><UserPlus size={16} /> Vendedor</button>
          <button className="adm-btn adm-btn--primary" onClick={() => { setCreateType('super'); setShowCreateModal(true); }}><Plus size={16} /> Super Vendedor</button>
        </div>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead><tr><th>Nombre</th><th>Usuario</th><th>Nº de Teléfono</th><th>Rol</th><th>Créditos</th><th>Vendedores</th><th>Clientes</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td style={{ fontWeight: 500 }}>{v.name}</td>
                <td style={{ fontSize: '.85rem' }}>{v.username || '-'}</td>
                <td className="adm-table-muted" style={{ fontSize: '.85rem' }}>{v.phone}</td>
                <td>{roleBadge(v.role)}</td>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontWeight: 600, color: '#facc15' }}>
                    <Coins size={14} /> {v.credits}
                  </span>
                </td>
                <td>{v._count.children}</td>
                <td>{v._count.managedEndUsers}</td>
                <td><span className={`adm-badge ${v.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>{v.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '.3rem' }}>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => setShowCreditsModal(v.id)} title="Cargar Paquete de Créditos">
                      <Package size={14} />
                    </button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem', color: '#a78bfa' }} onClick={() => setShowPlanModal(v.id)} title="Asignar Plan de Suscripción">
                      <Calendar size={14} /> <span style={{ fontSize: '.75rem', fontWeight: 600 }}>Plan</span>
                    </button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem' }} onClick={() => handleToggleStatus(v.id, v.isActive)} title={v.isActive ? 'Desactivar' : 'Activar'}>{v.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                    <button className="adm-btn adm-btn--ghost" style={{ padding: '.3rem .5rem', color: '#f87171' }} onClick={() => handleDelete(v.id, v.name || '')} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {vendors.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}><Users size={32} style={{ opacity: .2, marginBottom: '.5rem' }} /><p className="adm-table-muted">No se encontraron revendedores</p></td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="adm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Nuevo {createType === 'super' ? 'Super Vendedor' : 'Vendedor'}</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field"><label className="adm-label">Nombre</label><input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nombre completo" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="adm-field"><label className="adm-label">Usuario</label><input className="adm-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required placeholder="Nombre de usuario" /></div>
                <div className="adm-field"><label className="adm-label">Nº de Teléfono</label><input className="adm-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required placeholder="Ej: 1122334455" /></div>
              </div>
              <div className="adm-field"><label className="adm-label">Contraseña</label><input className="adm-input" type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} placeholder="Mínimo 6 caracteres" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="adm-field"><label className="adm-label">Créditos iniciales</label><input className="adm-input" type="number" min={0} value={form.credits} onChange={e => setForm(f => ({ ...f, credits: parseInt(e.target.value) || 0 }))} /></div>
                <div className="adm-field">
                  <label className="adm-label">Plan inicial (opcional)</label>
                  <select className="adm-input" value={form.planId} onChange={e => setForm(f => ({ ...f, planId: e.target.value }))}>
                    <option value="">Ninguno</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Summary */}
              {form.planId && plans.find(p => p.id === form.planId) && (
                (() => {
                  const p = plans.find(p => p.id === form.planId)!;
                  return (
                    <div style={{ padding: '.75rem', background: 'rgba(167,139,250,0.05)', borderRadius: '10px', fontSize: '.82rem', border: '1px solid rgba(167,139,250,0.2)' }}>
                      <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#a78bfa', textTransform: 'uppercase', fontSize: '.75rem', letterSpacing: '0.05em' }}>Resumen del Plan</div>
                      <div style={{ marginBottom: '.2rem' }}>Plan: <strong style={{ color: 'white' }}>{p.name}</strong></div>
                      <div style={{ marginBottom: '.2rem' }}>Duración: <strong style={{ color: 'white' }}>{p.durationDays} días</strong></div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Dispositivos: <strong style={{ color: '#fbbf24', fontSize: '.88rem' }}>{p.maxDevices} {p.maxDevices === 1 ? 'dispositivo' : 'dispositivos'}</strong>
                      </div>
                    </div>
                  );
                })()
              )}
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary">Crear Revendedor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Package Modal */}
      {showCreditsModal && (
        <div className="adm-modal-overlay" onClick={() => setShowCreditsModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', color: '#facc15' }}>
              <Package size={20} />
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Cargar Paquete de Créditos</h2>
            </div>
            <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.25rem' }}>
              Selecciona un paquete para asignar créditos al revendedor. Los créditos se sumarán a su balance actual.
            </p>
            <div className="adm-field">
              <label className="adm-label">Paquete Disponibles</label>
              <select className="adm-input" value={selectedPkgId} onChange={e => setSelectedPkgId(e.target.value)}>
                <option value="">Seleccionar paquete...</option>
                {packages.map(pkg => (
                  <option key={pkg.id} value={pkg.id}>{pkg.name} — ({pkg.baseCredits + pkg.bonusCredits} créditos)</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowCreditsModal(null)}>Cancelar</button>
              <button className="adm-btn adm-btn--primary" onClick={handleApplyPackage} disabled={!selectedPkgId}><CheckCircle size={16} /> Aplicar Paquete</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Plan Modal */}
      {showPlanModal && (
        <div className="adm-modal-overlay" onClick={() => setShowPlanModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem', color: '#a78bfa' }}>
              <Calendar size={20} />
              <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Asignar Plan de Suscripción</h2>
            </div>
            <p style={{ fontSize: '.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1.25rem' }}>
              Esto activará una cuenta de visualización para el revendedor con el plan seleccionado.
            </p>
            <div className="adm-field">
              <label className="adm-label">Planes de Suscripción</label>
              <select className="adm-input" value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)}>
                <option value="">Seleccionar plan...</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.name} — ({plan.durationDays} días)</option>
                ))}
              </select>
            </div>

            {/* Summary */}
            {selectedPlanId && plans.find(p => p.id === selectedPlanId) && (
              (() => {
                const p = plans.find(p => p.id === selectedPlanId)!;
                return (
                  <div style={{ padding: '.75rem', marginTop: '1rem', background: 'rgba(167,139,250,0.05)', borderRadius: '10px', fontSize: '.82rem', border: '1px solid rgba(167,139,250,0.2)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#a78bfa', textTransform: 'uppercase', fontSize: '.75rem', letterSpacing: '0.05em' }}>Resumen</div>
                    <div style={{ marginBottom: '.2rem' }}>Plan: <strong style={{ color: 'white' }}>{p.name}</strong></div>
                    <div style={{ marginBottom: '.2rem' }}>Duración: <strong style={{ color: 'white' }}>{p.durationDays} días</strong></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Dispositivos: <strong style={{ color: '#fbbf24', fontSize: '.88rem' }}>{p.maxDevices} {p.maxDevices === 1 ? 'dispositivo' : 'dispositivos'}</strong>
                    </div>
                  </div>
                );
              })()
            )}
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button className="adm-btn adm-btn--ghost" onClick={() => setShowPlanModal(null)}>Cancelar</button>
              <button className="adm-btn adm-btn--primary" onClick={handleAssignPlan} disabled={!selectedPlanId}><CheckCircle size={16} /> Asignar Plan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

