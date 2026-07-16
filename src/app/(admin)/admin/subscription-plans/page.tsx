'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Gift, Clock, Zap, Package } from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import type { SubscriptionPlan, CreditPackage } from '@/types/reseller.types';

export default function SubscriptionPlansPage() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [packages, setPackages] = useState<CreditPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [activeTab, setActiveTab] = useState<'NORMAL' | 'PROMO' | 'DISABLED'>('NORMAL');

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
        baseCredits: 0,
    });


    const fetchData = useCallback(async () => {
        try {
            const [pRes, pkgRes] = await Promise.all([
                adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.ALL),
                adminFetch(API_ROUTES.CREDIT_PACKAGES.ALL),
            ]);
            const pJson = await pRes.json();
            const pkgJson = await pkgRes.json();

            if (pJson.success) {
                const sortedPlans = pJson.data.sort((a: SubscriptionPlan, b: SubscriptionPlan) => a.durationDays - b.durationDays);
                setPlans(sortedPlans);
            }
            if (pkgJson.success) {
                const sortedPkgs = pkgJson.data.sort((a: CreditPackage, b: CreditPackage) => (a.baseCredits + a.bonusCredits) - (b.baseCredits + b.bonusCredits));
                setPackages(sortedPkgs);
            }
        } catch (err) { console.error('Error fetching data:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const resetForm = () => {
        setForm({ name: '', description: '', durationDays: 30, creditCost: 1, isDemo: false, demoHours: 24, isPromo: false, bonusDays: 0, maxDevices: 1, sortOrder: 0, baseCredits: 0 });
        setEditingPlan(null);
    };

    const openCreate = () => {
        resetForm();
        if (activeTab === 'PROMO') {
            setForm(f => ({ ...f, isPromo: true }));
        }
        setShowModal(true);
    };

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
            baseCredits: plan.baseCredits ?? 0,
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
            if (json.success) { setShowModal(false); resetForm(); fetchData(); }
            else alert(json.error || 'Error');
        } catch (err) { console.error(err); }
    };

    const handleToggle = async (id: string) => {
        try {
            await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.TOGGLE(id), { method: 'PATCH' });
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`¿Eliminar el plan "${name}"?`)) return;
        try {
            const res = await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.BY_ID(id), { method: 'DELETE' });
            const json = await res.json();
            if (json.success) fetchData();
            else alert(json.error || 'Error al eliminar');
        } catch (err) { console.error(err); }
    };

    const handlePackageSelect = (pkgId: string) => {
        const pkg = packages.find(p => p.id === pkgId);
        if (pkg) {
            setForm(f => ({ ...f, creditCost: pkg.baseCredits, baseCredits: pkg.baseCredits }));
        }
    };


    const getBadge = (plan: SubscriptionPlan) => {
        if (plan.isDemo) return { label: 'DEMO', cls: 'adm-badge--yellow' };
        if (plan.isPromo) return { label: 'PROMO', cls: 'adm-badge--purple' };
        return null;
    };

    const filteredPlans = plans.filter(p => {
        if (activeTab === 'DISABLED') return !p.isActive;
        if (!p.isActive) return false; // In other tabs, only show active ones
        
        const isPromoOrDemo = p.isPromo || p.isDemo;
        if (activeTab === 'NORMAL') return !isPromoOrDemo;
        return isPromoOrDemo;
    });

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

            {/* Tabs for Normal vs Promo vs Disabled */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16, flexWrap: 'wrap' }}>
                <button
                    className={`adm-btn ${activeTab === 'NORMAL' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => setActiveTab('NORMAL')}
                >
                    <Zap size={16} /> Planes Activos
                </button>
                <button
                    className={`adm-btn ${activeTab === 'PROMO' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => setActiveTab('PROMO')}
                >
                    <Gift size={16} /> Promos Activas
                </button>
                <button
                    className={`adm-btn ${activeTab === 'DISABLED' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => setActiveTab('DISABLED')}
                    style={{ marginLeft: 'auto' }}
                >
                    <ToggleLeft size={16} style={{ color: '#f87171' }} /> Desactivados
                </button>
            </div>

            <div className="adm-cards-grid">
                {filteredPlans.map(plan => {
                    const badge = getBadge(plan);
                    return (
                        <div key={plan.id} className="adm-table-card" style={{ 
                            padding: '1.25rem', 
                            opacity: plan.isActive ? 1 : 0.8,
                            background: plan.isActive ? undefined : 'rgba(148, 163, 184, 0.04)',
                            filter: plan.isActive ? 'none' : 'grayscale(0.3)',
                            borderColor: plan.isActive ? undefined : 'rgba(255, 255, 255, 0.06)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{plan.name}</h3>
                                    {plan.description && <p className="adm-table-muted" style={{ margin: '.25rem 0 0', fontSize: '.8rem' }}>{plan.description}</p>}
                                </div>
                                {badge && <span className={`adm-badge ${badge.cls}`}>{badge.label}</span>}
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
                            </div>
                        </div>
                    );
                })}
                {filteredPlans.length === 0 && (
                    <div className="adm-table-card" style={{ padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                        <Clock size={32} style={{ opacity: .3, marginBottom: '.5rem' }} />
                        <p className="adm-table-muted">
                            {activeTab === 'NORMAL' && 'No hay planes normales activos'}
                            {activeTab === 'PROMO' && 'No hay promociones ni planes demo activos'}
                            {activeTab === 'DISABLED' && 'No hay planes desactivados'}
                        </p>
                        {activeTab !== 'DISABLED' && (
                            <button className="adm-btn adm-btn--primary" style={{ marginTop: '.75rem' }} onClick={openCreate}>
                                <Plus size={16} /> Crear primer plan
                            </button>
                        )}
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
                                <label className="adm-label">Nombre del Plan</label>
                                <input className="adm-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Ej: 1 Mes Premium" />
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Descripción (opcional)</label>
                                <input className="adm-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ej: 30 días de acceso total" />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.03)', padding: '.75rem', borderRadius: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.85rem' }}>
                                    <input type="checkbox" checked={form.isDemo} onChange={e => setForm(f => ({ ...f, isDemo: e.target.checked, creditCost: e.target.checked ? 0 : f.creditCost }))} />
                                    ¿Es Plan Demo?
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '.4rem', cursor: 'pointer', fontSize: '.85rem' }}>
                                    <input type="checkbox" checked={form.isPromo} onChange={e => setForm(f => ({ ...f, isPromo: e.target.checked }))} />
                                    ¿Es Promoción?
                                </label>
                            </div>

                            {form.isDemo ? (
                                <div className="adm-field">
                                    <label className="adm-label">Horas de acceso (Demo)</label>
                                    <input className="adm-input" type="number" min={1} value={form.demoHours} onChange={e => setForm(f => ({ ...f, demoHours: parseInt(e.target.value) || 1 }))} />
                                </div>
                            ) : (
                                <>
                                    <div className="adm-field">
                                        <label className="adm-label">Costo (créditos)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Zap size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#facc15' }} />
                                            <input 
                                                className="adm-input" 
                                                type="number" 
                                                min={0} 
                                                style={{ paddingLeft: 34, color: '#facc15', fontWeight: 700 }}
                                                value={form.creditCost} 
                                                onChange={e => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setForm(f => ({ ...f, creditCost: val, baseCredits: val }));
                                                }} 
                                                required={!form.isDemo}
                                            />
                                        </div>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', marginTop: 4 }}>
                                            Cantidad de créditos que se descontarán al revendedor por activar este plan.
                                        </p>
                                    </div>

                                    <div className="adm-field">
                                        <label className="adm-label">Duración (días)</label>
                                        <input className="adm-input" type="number" min={1} value={form.durationDays} onChange={e => setForm(f => ({ ...f, durationDays: parseInt(e.target.value) || 1 }))} />
                                    </div>

                                    {form.isPromo && (
                                        <div className="adm-field">
                                            <label className="adm-label">Días bonus</label>
                                            <input className="adm-input" type="number" min={0} value={form.bonusDays} onChange={e => setForm(f => ({ ...f, bonusDays: parseInt(e.target.value) || 0 }))} />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="adm-grid-2" style={{ marginTop: '.75rem' }}>
                                <div className="adm-field">
                                    <label className="adm-label">Máx. dispositivos</label>
                                    <input className="adm-input" type="number" min={1} value={form.maxDevices} onChange={e => setForm(f => ({ ...f, maxDevices: parseInt(e.target.value) || 1 }))} />
                                </div>
                                <div className="adm-field">
                                    <label className="adm-label">Orden visual</label>
                                    <input className="adm-input" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.75rem' }}>
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="adm-btn adm-btn--primary">{editingPlan ? 'Guardar Cambios' : 'Crear Plan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

