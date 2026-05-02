'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Gift, Clock, Zap } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { SubscriptionPlan } from '@/types/reseller.types';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    durationDays: 30,
    creditCost: 1,
    isDemo: false,
    demoHours: 24,
    isPromo: false,
    bonusDays: 0,
    maxDevices: 1,
    sortOrder: 0,
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.ALL);
      const json = await res.json();
      if (json.success) setPlans(json.data);
    } catch (err) { console.error('Error fetching plans:', err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  const resetForm = () => {
    setForm({ name: '', description: '', durationDays: 30, creditCost: 1, isDemo: false, demoHours: 24, isPromo: false, bonusDays: 0, maxDevices: 1, sortOrder: 0 });
    setEditingPlan(null);
  };

  const openCreate = () => { resetForm(); setShowModal(true); };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? '',
      durationDays: plan.durationDays,
      creditCost: plan.creditCost,
      isDemo: plan.isDemo,
      demoHours: plan.demoHours ?? 24,
      isPromo: plan.isPromo,
      bonusDays: plan.bonusDays,
      maxDevices: plan.maxDevices,
      sortOrder: plan.sortOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPlan ? API_ROUTES.SUBSCRIPTION_PLANS.BY_ID(editingPlan.id) : API_ROUTES.SUBSCRIPTION_PLANS.BASE;
    const method = editingPlan ? 'PATCH' : 'POST';

    try {
      const res = await adminFetch(url, { method, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { setShowModal(false); resetForm(); fetchPlans(); }
      else alert(json.error || 'Error');
    } catch (err) { console.error(err); }
  };

  const handleToggle = async (id: string) => {
    try {
      await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.TOGGLE(id), { method: 'PATCH' });
      fetchPlans();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar el plan "${name}"?`)) return;
    try {
      const res = await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.BY_ID(id), { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchPlans();
      else alert(json.error || 'Error al eliminar');
    } catch (err) { console.error(err); }
  };

  const getBadge = (plan: SubscriptionPlan) => {
    if (plan.isDemo) return { label: 'DEMO', cls: 'adm-badge--yellow' };
    if (plan.isPromo) return { label: 'PROMO', cls: 'adm-badge--purple' };
    return { label: 'NORMAL', cls: 'adm-badge--blue' };
  };

  if (loading) return <div className="adm-page"><p>Cargando planes...</p></div>;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Planes de Suscripción</h1>
          <p className="adm-page-subtitle">Gestiona los planes que los revendedores usan para activar cuentas</p>
        </div>
        <div className="adm-header-actions">
          <button className="adm-btn adm-btn--primary" onClick={openCreate}>
            <Plus size={16} /> Nuevo Plan
          </button>
        </div>
      </div>

      <div className="adm-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {plans.map(plan => {
          const badge = getBadge(plan);
          return (
            <div key={plan.id} className="adm-table-card" style={{ padding: '1.25rem', opacity: plan.isActive ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{plan.name}</h3>
                  {plan.description && <p className="adm-table-muted" style={{ margin: '.25rem 0 0', fontSize: '.8rem' }}>{plan.description}</p>}
                </div>
                <span className={`adm-badge ${badge.cls}`}>{badge.label}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', marginBottom: '1rem', fontSize: '.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Calendar size={14} style={{ opacity: .6 }} />
                  {plan.isDemo ? `${plan.demoHours}h (Demo)` : `${plan.durationDays} días`}
                  {plan.bonusDays && plan.bonusDays > 0 ? ` (+${plan.bonusDays} bonus)` : ''}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Zap size={14} style={{ opacity: .6 }} />
                  {plan.isDemo ? 'GRATIS (Demo)' : `${plan.creditCost} crédito${plan.creditCost !== 1 ? 's' : ''}`}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <Gift size={14} style={{ opacity: .6 }} />
                  {plan.maxDevices} dispositivo{plan.maxDevices !== 1 ? 's' : ''}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '.75rem' }}>
                <button className="adm-btn adm-btn--ghost" style={{ flex: 1, fontSize: '.78rem', padding: '.35rem' }} onClick={() => handleToggle(plan.id)} title={plan.isActive ? 'Desactivar' : 'Activar'}>
                  {plan.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  {plan.isActive ? 'Activo' : 'Inactivo'}
                </button>
                <button className="adm-btn adm-btn--ghost" style={{ padding: '.35rem .5rem' }} onClick={() => openEdit(plan)}>
                  <Pencil size={14} />
                </button>
                <button className="adm-btn adm-btn--ghost" style={{ padding: '.35rem .5rem', color: '#f87171' }} onClick={() => handleDelete(plan.id, plan.name)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {plans.length === 0 && (
          <div className="adm-table-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
            <Clock size={32} style={{ opacity: .3, marginBottom: '.5rem' }} />
            <p className="adm-table-muted">No hay planes creados aún</p>
            <button className="adm-btn adm-btn--primary" style={{ marginTop: '.75rem' }} onClick={openCreate}>
              <Plus size={16} /> Crear primer plan
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="adm-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field">
                <label className="adm-label">Nombre</label>
                <input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <div className="adm-field">
                <label className="adm-label">Descripción (opcional)</label>
                <input className="adm-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.85rem' }}>
                  <input type="checkbox" checked={form.isDemo} onChange={e => setForm(f => ({ ...f, isDemo: e.target.checked, creditCost: e.target.checked ? 0 : f.creditCost }))} />
                  Es Demo
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.85rem' }}>
                  <input type="checkbox" checked={form.isPromo} onChange={e => setForm(f => ({ ...f, isPromo: e.target.checked }))} />
                  Es Promo
                </label>
              </div>

              {form.isDemo ? (
                <div className="adm-field">
                  <label className="adm-label">Horas de acceso (Demo)</label>
                  <input className="adm-input" type="number" min={1} value={form.demoHours} onChange={e => setForm(f => ({ ...f, demoHours: parseInt(e.target.value) || 1 }))} />
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                    <div className="adm-field">
                      <label className="adm-label">Duración (días)</label>
                      <input className="adm-input" type="number" min={1} value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 1 }))} />
                    </div>
                    <div className="adm-field">
                      <label className="adm-label">Costo (créditos)</label>
                      <input className="adm-input" type="number" min={0} value={form.creditCost} onChange={e => setForm(f => ({ ...f, creditCost: parseInt(e.target.value) || 0 }))} />
                    </div>
                  </div>
                  {form.isPromo && (
                    <div className="adm-field">
                      <label className="adm-label">Días bonus</label>
                      <input className="adm-input" type="number" min={0} value={form.bonusDays} onChange={e => setForm(f => ({ ...f, bonusDays: parseInt(e.target.value) || 0 }))} />
                    </div>
                  )}
                </>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div className="adm-field">
                  <label className="adm-label">Máx. dispositivos</label>
                  <input className="adm-input" type="number" min={1} value={form.maxDevices} onChange={e => setForm(f => ({ ...f, maxDevices: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="adm-field">
                  <label className="adm-label">Orden</label>
                  <input className="adm-input" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary">{editingPlan ? 'Guardar' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
