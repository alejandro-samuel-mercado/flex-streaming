'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Zap } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import EndUsersTable from '@/components/reseller/EndUsersTable';
import type { EndUserAccount, SubscriptionPlan } from '@/types/reseller.types';

export default function VendorEndUsersPage() {
    const [users, setUsers] = useState<EndUserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', planId: '' });
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [myCredits, setMyCredits] = useState<number | null>(null);
    const [creating, setCreating] = useState(false);
    const [planFilter, setPlanFilter] = useState<'normal' | 'promo' | 'demo'>('normal');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page), limit: '20' });
        if (search) params.set('search', search);
        const r = await resellerFetch(`${API_ROUTES.END_USERS.BASE}?${params}`);
        const j = await r.json();
        if (j.success) { setUsers(j.data.users); setTotalPages(j.data.totalPages); }
        setLoading(false);
    }, [page, search]);

    const fetchPlans = useCallback(async () => {
        const r = await resellerFetch(API_ROUTES.SUBSCRIPTION_PLANS.BASE);
        const j = await r.json();
        if (j.success) setPlans(j.data);
    }, []);

    const fetchCredits = useCallback(async () => {
        const r = await resellerFetch(API_ROUTES.AUTH.ME);
        const j = await r.json();
        if (j.success) setMyCredits(j.data?.credits ?? j.user?.credits ?? null);
    }, []);

    useEffect(() => { fetchUsers(); fetchCredits(); }, [fetchUsers, fetchCredits]);

    const openCreateModal = async () => {
        setForm({ username: '', password: '', planId: '' });
        setPlanFilter('normal');
        setShowCreate(true);
        await Promise.all([fetchPlans(), fetchCredits()]);
    };

    const filteredPlans = plans.filter(p => {
        if (planFilter === 'demo') return p.isDemo;
        if (planFilter === 'promo') return p.isPromo && !p.isDemo;
        return !p.isDemo && !p.isPromo;
    });

    const selectedPlan = plans.find(p => p.id === form.planId);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.planId) { alert('Debes seleccionar un plan'); return; }
        setCreating(true);
        try {
            const r = await resellerFetch(API_ROUTES.END_USERS.BASE, {
                method: 'POST',
                body: JSON.stringify(form),
            });
            const j = await r.json();
            if (j.success) {
                setShowCreate(false);
                setForm({ username: '', password: '', planId: '' });
                fetchUsers();
                fetchCredits();
            } else {
                alert(j.error || 'Error al crear cuenta');
            }
        } catch (err) { console.error(err); }
        finally { setCreating(false); }
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div><h1 className="adm-page-title">Mis Clientes</h1><p className="adm-page-subtitle">Cuentas de clientes finales</p></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    <button
                        className="adm-btn adm-btn--primary"
                        onClick={openCreateModal}
                        disabled={myCredits === 0}
                        style={myCredits === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                    >
                        <Plus size={16} /> Nueva Cuenta
                    </button>
                    {myCredits === 0 && (
                        <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>
                            No tienes créditos. Debes recargar.
                        </span>
                    )}
                </div>
            </div>
            <EndUsersTable users={users} loading={loading} search={search} onSearchChange={setSearch} page={page} totalPages={totalPages} onPageChange={setPage} onRefresh={fetchUsers} fetchFn={resellerFetch} />

            {showCreate && (
                <div className="adm-modal-overlay" onClick={() => setShowCreate(false)}>
                    <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '85vh', overflow: 'auto' }}>
                        <h2 style={{ margin: '0 0 .75rem', fontSize: '1.1rem' }}>Nueva Cuenta Final</h2>

                        {myCredits !== null && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(250,204,21,0.08)', borderRadius: '8px', fontSize: '.85rem' }}>
                                <Zap size={14} style={{ color: '#facc15' }} />
                                <span>Tu saldo: <strong style={{ color: '#facc15' }}>{myCredits} créditos</strong></span>
                            </div>
                        )}

                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                            <div className="adm-field">
                                <label className="adm-label">Usuario</label>
                                <input className="adm-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required minLength={3} placeholder="Nombre de usuario" />
                            </div>
                            <div className="adm-field">
                                <label className="adm-label">Contraseña</label>
                                <input className="adm-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={4} placeholder="Contraseña" />
                            </div>

                            {/* Plan Type Selector */}
                            <div className="adm-field">
                                <label className="adm-label">Tipo de Plan</label>
                                <div style={{ display: 'flex', gap: '.5rem' }}>
                                    <button type="button" className={`adm-btn ${planFilter === 'normal' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }} onClick={() => { setPlanFilter('normal'); setForm(f => ({ ...f, planId: '' })); }}>
                                        Normal
                                    </button>
                                    {plans.some(p => p.isPromo && !p.isDemo) && (
                                        <button type="button" className={`adm-btn ${planFilter === 'promo' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem', borderColor: planFilter === 'promo' ? undefined : '#a78bfa', color: planFilter === 'promo' ? undefined : '#a78bfa' }} onClick={() => { setPlanFilter('promo'); setForm(f => ({ ...f, planId: '' })); }}>
                                            🎉 Promo
                                        </button>
                                    )}
                                    {plans.some(p => p.isDemo) && (
                                        <button type="button" className={`adm-btn ${planFilter === 'demo' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem', borderColor: planFilter === 'demo' ? undefined : '#facc15', color: planFilter === 'demo' ? undefined : '#facc15' }} onClick={() => { setPlanFilter('demo'); setForm(f => ({ ...f, planId: '' })); }}>
                                            🎁 Demo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Plan Selector */}
                            <div className="adm-field">
                                <label className="adm-label">Seleccionar Plan</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                                    {filteredPlans.length === 0 && <p className="adm-table-muted" style={{ fontSize: '.82rem', textAlign: 'center', padding: '.5rem' }}>No hay planes disponibles</p>}
                                    {filteredPlans.map(p => (
                                        <button key={p.id} type="button" onClick={() => setForm(f => ({ ...f, planId: p.id }))}
                                            style={{
                                                padding: '.6rem .8rem', cursor: 'pointer', textAlign: 'left',
                                                border: form.planId === p.id ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,.08)',
                                                borderRadius: '10px', background: form.planId === p.id ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                                                transition: 'all .2s',
                                            }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <strong style={{ fontSize: '.88rem', color: 'white' }}>{p.name}</strong>
                                                <span style={{ fontSize: '.8rem', fontWeight: 600, color: p.isDemo ? '#4ade80' : '#60a5fa' }}>
                                                    {p.isDemo ? 'GRATIS' : `${p.creditCost} crédito${p.creditCost !== 1 ? 's' : ''}`}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.5)', marginTop: '.15rem' }}>
                                                {p.isDemo ? `${p.demoHours}h de acceso` : `${p.durationDays} días`}
                                                {p.bonusDays && p.bonusDays > 0 ? ` (+${p.bonusDays} bonus)` : ''}
                                                {' · '}{p.maxDevices} disp.
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Summary */}
                            {selectedPlan && (
                                <div style={{ padding: '.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', fontSize: '.85rem', border: '1px solid rgba(255,255,255,.06)' }}>
                                    <div style={{ fontWeight: 600, marginBottom: '.3rem' }}>Resumen</div>
                                    <div>Plan: <strong>{selectedPlan.name}</strong></div>
                                    <div>Duración: <strong>{selectedPlan.isDemo ? `${selectedPlan.demoHours}h` : `${selectedPlan.durationDays} días`}{selectedPlan.bonusDays ? ` (+${selectedPlan.bonusDays} bonus)` : ''}</strong></div>
                                    <div>Dispositivos: <strong>{selectedPlan.maxDevices} {selectedPlan.maxDevices === 1 ? 'dispositivo' : 'dispositivos'}</strong></div>
                                    <div>Costo: <strong style={{ color: selectedPlan.isDemo ? '#4ade80' : '#facc15' }}>{selectedPlan.isDemo ? 'Gratis' : `${selectedPlan.creditCost} crédito(s)`}</strong></div>
                                    {!selectedPlan.isDemo && myCredits !== null && (
                                        <div style={{ marginTop: '.3rem', color: myCredits >= selectedPlan.creditCost ? '#4ade80' : '#f87171' }}>
                                            Saldo después: {myCredits - selectedPlan.creditCost} créditos
                                        </div>
                                    )}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={creating || !form.planId}>
                                    {creating ? 'Creando...' : 'Crear Cuenta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
