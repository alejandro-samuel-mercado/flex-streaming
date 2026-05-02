'use client';

import { useState, useEffect } from 'react';
import { API_ROUTES } from '@/lib/api-routes';
import type { EndUserAccount, SubscriptionPlan } from '@/types/reseller.types';

interface Props {
  account: EndUserAccount;
  onClose: () => void;
  onSuccess: () => void;
  fetchFn: (url: string, options?: RequestInit) => Promise<Response>;
}

type Step = 'select-type' | 'select-plan' | 'confirm';

export default function AddPlanModal({ account, onClose, onSuccess, fetchFn }: Props) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [step, setStep] = useState<Step>('select-type');
  const [filter, setFilter] = useState<'normal' | 'promo' | 'demo'>('normal');
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetchFn(API_ROUTES.SUBSCRIPTION_PLANS.BASE);
      const json = await res.json();
      if (json.success) setPlans(json.data);
    })();
  }, [fetchFn]);

  const filteredPlans = plans.filter(p => {
    if (filter === 'demo') return p.isDemo;
    if (filter === 'promo') return p.isPromo && !p.isDemo;
    return !p.isDemo && !p.isPromo;
  });

  const hasDemoPlans = plans.some(p => p.isDemo);
  const hasPromoPlans = plans.some(p => p.isPromo && !p.isDemo);

  const calculateNewEndDate = () => {
    if (!selected) return null;
    if (selected.isDemo) {
      return new Date(Date.now() + (selected.demoHours ?? 24) * 60 * 60 * 1000);
    }
    const current = account.endDate ? new Date(account.endDate) : null;
    const base = current && current > new Date() ? current : new Date();
    return new Date(base.getTime() + selected.durationDays * 24 * 60 * 60 * 1000);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetchFn(API_ROUTES.END_USERS.ADD_PLAN(account.id), {
        method: 'POST',
        body: JSON.stringify({ planId: selected.id }),
      });
      const json = await res.json();
      if (json.success) onSuccess();
      else alert(json.error);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '80vh', overflow: 'auto' }}>
        <h2 style={{ margin: '0 0 .5rem', fontSize: '1.1rem' }}>Agregar Plan — {account.username}</h2>

        {step === 'select-type' && (
          <div>
            <p className="adm-table-muted" style={{ marginBottom: '1rem', fontSize: '.85rem' }}>Selecciona el tipo de plan:</p>
            <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
              <button className="adm-btn adm-btn--primary" style={{ flex: 1, minWidth: 120, padding: '.75rem' }} onClick={() => { setFilter('normal'); setStep('select-plan'); }}>
                📦 Plan Normal
              </button>
              {hasPromoPlans && <button className="adm-btn adm-btn--ghost" style={{ flex: 1, minWidth: 120, padding: '.75rem', borderColor: '#a78bfa', color: '#a78bfa' }} onClick={() => { setFilter('promo'); setStep('select-plan'); }}>
                🎉 Plan Promo
              </button>}
              {hasDemoPlans && <button className="adm-btn adm-btn--ghost" style={{ flex: 1, minWidth: 120, padding: '.75rem', borderColor: '#facc15', color: '#facc15' }} onClick={() => { setFilter('demo'); setStep('select-plan'); }}>
                🎁 Demo
              </button>}
            </div>
          </div>
        )}

        {step === 'select-plan' && (
          <div>
            <button className="adm-link" style={{ marginBottom: '.75rem', fontSize: '.82rem' }} onClick={() => setStep('select-type')}>← Volver</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {filteredPlans.map(p => (
                <button key={p.id} className="adm-table-card" onClick={() => { setSelected(p); setStep('confirm'); }}
                  style={{ padding: '.75rem 1rem', cursor: 'pointer', textAlign: 'left', border: '1px solid rgba(255,255,255,.08)', transition: 'border-color .2s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{p.name}</strong>
                    <span style={{ fontSize: '.82rem', color: p.isDemo ? '#4ade80' : '#60a5fa' }}>
                      {p.isDemo ? 'GRATIS' : `${p.creditCost} crédito${p.creditCost !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                  <div className="adm-table-muted" style={{ fontSize: '.8rem', marginTop: '.25rem' }}>
                    {p.isDemo ? `${p.demoHours}h de acceso` : `${p.durationDays} días`}
                    {p.bonusDays && p.bonusDays > 0 ? ` (+${p.bonusDays} bonus)` : ''}
                    {' · '}{p.maxDevices} disp.
                  </div>
                </button>
              ))}
              {filteredPlans.length === 0 && <p className="adm-table-muted" style={{ textAlign: 'center', padding: '1rem' }}>No hay planes disponibles</p>}
            </div>
          </div>
        )}

        {step === 'confirm' && selected && (
          <div>
            <button className="adm-link" style={{ marginBottom: '.75rem', fontSize: '.82rem' }} onClick={() => setStep('select-plan')}>← Volver</button>
            <div className="adm-table-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem', fontSize: '.88rem' }}>
                <div><strong>Plan:</strong> {selected.name}</div>
                <div><strong>Duración:</strong> {selected.isDemo ? `${selected.demoHours}h` : `${selected.durationDays} días`}</div>
                <div><strong>Costo:</strong> {selected.isDemo ? 'Gratis' : `${selected.creditCost} crédito(s)`}</div>
                <div><strong>Nueva expiración:</strong> {calculateNewEndDate()?.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) ?? '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
              <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cancelar</button>
              <button className="adm-btn adm-btn--primary" onClick={handleConfirm} disabled={submitting}>{submitting ? 'Aplicando...' : 'Confirmar'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
