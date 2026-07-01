'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import { Users, Search, Loader2, User, Mail, Calendar, Shield, Crown, UserCheck, Coins, Monitor, Smartphone, Tv, Plus, Edit2, Trash2, X, Check, AlertCircle, Package, Zap } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/reseller.types';
import EndUsersTable from '@/components/reseller/EndUsersTable';

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState<'VENDOR' | 'ADMIN' | 'END_USER'>('VENDOR');

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleted, setShowDeleted] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        phone: '',
        password: '',
        role: 'VENDOR',
        isActive: true,
        credits: 0,
        planId: ''
    });

    const [packages, setPackages] = useState<any[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [showCreditsModal, setShowCreditsModal] = useState<string | null>(null);
    const [selectedPkgId, setSelectedPkgId] = useState<string>('');
    const [showPlanModal, setShowPlanModal] = useState<string | null>(null);
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');

    // End-User Create Modal State
    const [showEndUserCreate, setShowEndUserCreate] = useState(false);
    const [endUserForm, setEndUserForm] = useState({ username: '', password: '', planId: '' });
    const [endUserPlanFilter, setEndUserPlanFilter] = useState<'normal' | 'promo' | 'demo'>('normal');
    const [endUserCreating, setEndUserCreating] = useState(false);
    const [activePlans, setActivePlans] = useState<SubscriptionPlan[]>([]);

    // Delete Confirmation State
    const [userToDelete, setUserToDelete] = useState<any>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20', role: activeTab });
            if (searchQuery) params.append('search', searchQuery);
            if (activeTab === 'END_USER' && showDeleted) params.append('showDeleted', 'true');

            const res = await adminFetch(`${API_ROUTES.ADMIN.BASE}/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data.users || []);
                setTotalPages(Math.ceil((data.data.total || 0) / 20));
            }

            // Fetch packages and plans if we are in VENDOR tab or if needed
            if (activeTab === 'VENDOR') {
                const [pkgRes, sRes] = await Promise.all([
                    adminFetch(API_ROUTES.CREDIT_PACKAGES.ALL),
                    adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.ALL)
                ]);
                const pkgJson = await pkgRes.json();
                const sJson = await sRes.json();
                if (pkgJson.success) setPackages(pkgJson.data.sort((a: any, b: any) => (a.baseCredits + a.bonusCredits) - (b.baseCredits + b.bonusCredits)));
                if (sJson.success) setPlans(sJson.data.sort((a: any, b: any) => a.durationDays - b.durationDays));
            }

            // Fetch active plans for END_USER tab
            if (activeTab === 'END_USER') {
                const sRes = await adminFetch(API_ROUTES.SUBSCRIPTION_PLANS.ALL);
                const sJson = await sRes.json();
                if (sJson.success) setActivePlans(sJson.data.filter((p: any) => p.isActive).sort((a: any, b: any) => a.durationDays - b.durationDays));
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab, searchQuery, showDeleted]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const openCreateModal = () => {
        setModalMode('create');
        setCurrentUser(null);
        setFormData({
            name: '',
            username: '',
            phone: '',
            password: '',
            role: activeTab === 'ADMIN' ? 'ADMIN' : 'SUPER_VENDOR',
            isActive: true,
            credits: 0,
            planId: ''
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (user: any) => {
        setModalMode('edit');
        setCurrentUser(user);
        setFormData({
            name: user.name || '',
            username: user.username || '',
            phone: user.phone || '',
            password: '', // Password empty by default on edit
            role: user.role,
            isActive: user.isActive,
            credits: user.credits || 0,
            planId: user.planId || ''
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError('');

        try {
            let url = modalMode === 'create'
                ? `${API_ROUTES.ADMIN.BASE}/users`
                : `${API_ROUTES.ADMIN.BASE}/users/${currentUser.id}`;

            let method = modalMode === 'create' ? 'POST' : 'PUT';

            // Special handling for reseller creation to use their specific hierarchy endpoints
            if (modalMode === 'create') {
                if (formData.role === 'VENDOR') url = API_ROUTES.RESELLER.VENDORS;
                if (formData.role === 'SUPER_VENDOR') url = API_ROUTES.RESELLER.SUPER_VENDORS;
            }

            // On edit, only send password if it's not empty
            const bodyData = { ...formData };
            if (modalMode === 'edit' && !bodyData.password) {
                delete (bodyData as any).password;
            }

            const res = await adminFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });

            const data = await res.json();

            if (res.ok) {
                setIsModalOpen(false);
                fetchUsers();
            } else {
                setFormError(data.error || 'Ocurrió un error al guardar');
            }
        } catch (err) {
            setFormError('Error de conexión con el servidor');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            const res = await adminFetch(`${API_ROUTES.ADMIN.BASE}/users/${userToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setUserToDelete(null);
                fetchUsers();
            } else {
                const data = await res.json();
                if (data.code === 'HAS_ACTIVE_CLIENTS') {
                    alert('⚠️ Advertencia: No puedes eliminar a este revendedor porque tiene clientes activos. Debes eliminar o pausar sus clientes primero.');
                } else {
                    alert(data.error || 'No se pudo eliminar al usuario');
                }
            }
        } catch (err) {
            alert('Error de conexión');
        }
    };

    const handleApplyPackage = async () => {
        if (!showCreditsModal || !selectedPkgId) return;
        try {
            const r = await adminFetch(API_ROUTES.CREDIT_PACKAGES.APPLY(selectedPkgId), {
                method: 'POST',
                body: JSON.stringify({ targetUserId: showCreditsModal })
            });
            const j = await r.json();
            if (j.success) { setShowCreditsModal(null); setSelectedPkgId(''); fetchUsers(); } else alert(j.error);
        } catch (err) { console.error(err); }
    };

    const handleAssignPlan = async () => {
        if (!showPlanModal || !selectedPlanId) return;
        try {
            const r = await adminFetch(`${API_ROUTES.RESELLER.BY_ID(showPlanModal)}/plan`, {
                method: 'POST',
                body: JSON.stringify({ planId: selectedPlanId })
            });
            const j = await r.json();
            if (j.success) { setShowPlanModal(null); setSelectedPlanId(''); fetchUsers(); } else alert(j.error);
        } catch (err) { console.error(err); }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            'ADMIN': 'Administrador',
            'SUPER_VENDOR': 'Super Revendedor',
            'VENDOR': 'Revendedor',
            'MEMBER': 'Miembro',
            'REGISTERED': 'Registrado'
        };
        return labels[role] || role;
    };

    const getDeviceIcon = (type: string) => {
        if (type === 'TV') return <Tv size={14} />;
        if (type === 'MOBILE') return <Smartphone size={14} />;
        return <Monitor size={14} />;
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Gestión de Usuarios</h1>
                    <p className="adm-page-subtitle">Administra los roles, clientes y dispositivos de la plataforma</p>
                </div>
                {activeTab === 'END_USER' ? (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <button 
                            className={`adm-btn adm-btn--sm ${showDeleted ? 'adm-btn--red' : 'adm-btn--ghost'}`}
                            onClick={() => { setShowDeleted(!showDeleted); setPage(1); }}
                            title="Ver usuarios eliminados"
                            style={{ opacity: 0.5, border: 'none', background: 'transparent' }}
                        >
                            <Trash2 size={16} />
                        </button>
                        <button className="adm-btn adm-btn--primary" onClick={() => {
                            setEndUserForm({ username: '', password: '', planId: '' });
                            setEndUserPlanFilter('normal');
                            setShowEndUserCreate(true);
                        }}>
                            <Plus size={18} /> Nueva Cuenta Final
                        </button>
                    </div>
                ) : (
                    <button className="adm-btn adm-btn--primary" onClick={openCreateModal}>
                        <Plus size={18} /> Nuevo {activeTab === 'VENDOR' ? 'Super Revendedor' : 'Administrador'}
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                <button
                    className={`adm-btn ${activeTab === 'VENDOR' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('VENDOR'); setPage(1); }}
                >
                    <Crown size={16} /> Super Revendedores
                </button>
                <button
                    className={`adm-btn ${activeTab === 'ADMIN' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('ADMIN'); setPage(1); }}
                >
                    <Shield size={16} /> Administradores
                </button>

                <button
                    className={`adm-btn ${activeTab === 'END_USER' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('END_USER'); setPage(1); }}
                >
                    <UserCheck size={16} /> Clientes Finales
                </button>
            </div>

            {activeTab === 'END_USER' ? (
                <EndUsersTable
                    users={users}
                    loading={loading}
                    search={searchQuery}
                    onSearchChange={setSearchQuery}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                    onRefresh={fetchUsers}
                    fetchFn={adminFetch}
                />
            ) : (
                <div className="adm-table-card animate-fadeIn">
                    <div className="adm-table-filters" style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--adm-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre o teléfono..."
                                    className="adm-input"
                                    style={{ paddingLeft: 36 }}
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                        </form>
                    </div>

                    {loading ? (
                        <div style={{ padding: 40, textAlign: 'center', color: 'var(--adm-muted)' }}>
                            <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 16px' }} />
                            <p>Cargando usuarios...</p>
                        </div>
                    ) : (
                        <div className="adm-table-wrapper">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        {activeTab === 'VENDOR' ? (
                                            <>
                                                <th style={{ textAlign: 'center' }}>Nombre</th>
                                                <th style={{ textAlign: 'center' }}>Usuario</th>
                                                <th style={{ textAlign: 'center' }}>Nº de teléfono</th>
                                                <th style={{ textAlign: 'center' }}>Créditos</th>
                                                <th style={{ textAlign: 'center' }}>Clientes</th>
                                                <th style={{ textAlign: 'center' }}>Estados</th>
                                                <th style={{ textAlign: 'center' }}>Acciones</th>
                                            </>
                                        ) : (
                                            <>
                                                <th style={{ textAlign: 'center' }}>Usuario</th>
                                                <th style={{ textAlign: 'center' }}>Nº de teléfono</th>
                                                <th style={{ textAlign: 'center' }}>Rol</th>
                                                <th style={{ textAlign: 'center' }}>Estado</th>
                                                <th style={{ textAlign: 'center' }}>Perfiles</th>
                                                <th style={{ textAlign: 'center' }}>Registro</th>
                                                <th style={{ textAlign: 'center' }}>Acciones</th>
                                            </>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No se encontraron registros.</td></tr>
                                    ) : users.map(user => (
                                        <tr key={user.id}>
                                            {activeTab === 'VENDOR' ? (
                                                <>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--adm-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={20} color="var(--adm-muted)" />
                                                            </div>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>{user.name}</div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <div className="flex flex-col items-center justify-center">
                                                            <span style={{ color: '#a78bfa', fontWeight: 600 }}>{user.username || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '.85rem' }}>{user.phone || '-'}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontWeight: 700, color: '#facc15' }}>
                                                            {user.credits}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{user._count?.managedEndUsers || 0}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`adm-badge ${user.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>
                                                            {user.isActive ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => setShowCreditsModal(user.id)} title="Cargar Créditos" style={{ color: '#facc15' }}><Package size={14} /></button>
                                                            <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => openEditModal(user)}><Edit2 size={14} /></button>
                                                            <button className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--red" onClick={() => setUserToDelete(user)}><Trash2 size={14} /></button>
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--adm-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                <User size={20} color="var(--adm-muted)" />
                                                            </div>
                                                            <div style={{ textAlign: 'center' }}>
                                                                <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                                    {user.name}
                                                                    {user._count?.memberships > 0 && <Crown size={14} color="#fbbf24" />}
                                                                </div>
                                                                <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>{user.username || '-'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '.85rem' }}>{user.phone || '-'}</span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`adm-badge ${user.role === 'ADMIN' ? 'adm-badge--purple' : 'adm-badge--blue'}`}>
                                                            {user.role === 'ADMIN' && <Shield size={12} style={{ marginRight: 4 }} />}
                                                            {getRoleLabel(user.role)}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span className={`adm-badge ${user.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>
                                                            {user.isActive ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '.9rem', color: 'var(--adm-muted)' }}>
                                                            {user._count?.profiles || 0} perfiles
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <span style={{ fontSize: '.85rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                                            <Calendar size={14} />
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                            <button
                                                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                                                onClick={() => openEditModal(user)}
                                                                title="Editar usuario"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                className="adm-btn adm-btn--ghost adm-btn--sm adm-btn--red"
                                                                onClick={() => setUserToDelete(user)}
                                                                title="Eliminar usuario"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {totalPages > 1 && (
                        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'center', gap: 8 }}>
                            <button
                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Anterior
                            </button>
                            <span style={{ padding: '4px 12px', fontSize: '.9rem', color: 'var(--adm-muted)' }}>Página {page} de {totalPages}</span>
                            <button
                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                disabled={page === totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* User Create/Edit Modal */}
            {isModalOpen && (
                <div className="adm-modal-overlay animate-fadeIn">
                    <div className="adm-modal animate-slideUp" style={{ maxWidth: 500 }}>
                        <div className="adm-modal-header">
                            <h2 className="adm-modal-title">
                                {modalMode === 'create' ? 'Crear Nuevo Usuario' : 'Editar Usuario'}
                            </h2>
                            <button className="adm-modal-close" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveUser}>
                            <div className="adm-modal-body">
                                {formError && (
                                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <AlertCircle size={16} /> {formError}
                                    </div>
                                )}

                                <div className="adm-form-group">
                                    <label className="adm-label">Nombre Completo</label>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        required
                                        placeholder="Ej: Juan Perez"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Nº de Teléfono</label>
                                        <input
                                            type="tel"
                                            className="adm-input"
                                            required
                                            placeholder="Ej: 1122334455"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Nombre de Usuario</label>
                                        <input
                                            type="text"
                                            className="adm-input"
                                            required
                                            placeholder="Ej: juan.perez"
                                            value={formData.username}
                                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="adm-form-group">
                                    <label className="adm-label">
                                        Contraseña {modalMode === 'edit' && <span style={{ color: 'var(--adm-muted)', fontWeight: 400 }}>(dejar en blanco para no cambiar)</span>}
                                    </label>
                                    <input
                                        type="password"
                                        className="adm-input"
                                        required={modalMode === 'create'}
                                        placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres' : '••••••••'}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Rol de Usuario</label>
                                        <select
                                            className="adm-input"
                                            value={formData.role}
                                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            disabled={modalMode === 'create' && (activeTab === 'VENDOR' || activeTab === 'ADMIN')}
                                            style={{ backgroundColor: '#151515', color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.15)', width: '100%' }}
                                        >
                                            <option value="ADMIN" style={{ backgroundColor: '#151515', color: '#f3f4f6' }}>Administrador</option>
                                            <option value="SUPER_VENDOR" style={{ backgroundColor: '#151515', color: '#f3f4f6' }}>Super Revendedor</option>
                                        </select>
                                    </div>

                                    <div className="adm-form-group">
                                        <label className="adm-label">Estado de Cuenta</label>
                                        <div style={{ display: 'flex', alignItems: 'center', height: 42, gap: 12 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={formData.isActive}
                                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                                    style={{ width: 18, height: 18 }}
                                                />
                                                <span style={{ fontSize: '.9rem', color: 'white' }}>Activo</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                {(formData.role === 'VENDOR' || formData.role === 'SUPER_VENDOR') && modalMode === 'create' && (
                                    <div className="adm-form-group">
                                        <label className="adm-label">Créditos iniciales</label>
                                        <input
                                            type="number"
                                            className="adm-input"
                                            min={0}
                                            value={formData.credits}
                                            onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="adm-modal-footer">
                                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setIsModalOpen(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="adm-btn adm-btn--primary" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                    {modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {userToDelete && (
                <div className="adm-modal-overlay animate-fadeIn">
                    <div className="adm-modal animate-slideUp" style={{ maxWidth: 400 }}>
                        <div className="adm-modal-header" style={{ borderBottom: 'none' }}>
                            <h2 className="adm-modal-title" style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 10 }}>
                                <AlertCircle size={24} /> ¿Eliminar usuario?
                            </h2>
                        </div>
                        <div className="adm-modal-body" style={{ paddingBottom: 24 }}>
                            <p style={{ color: 'var(--adm-muted)', lineHeight: 1.5 }}>
                                Estás a punto de eliminar a <strong>{userToDelete.name}</strong> ({userToDelete.phone}).
                                Esta acción es permanente y no se puede deshacer.
                            </p>
                        </div>
                        <div className="adm-modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <button className="adm-btn adm-btn--ghost" onClick={() => setUserToDelete(null)}>
                                Cancelar
                            </button>
                            <button className="adm-btn adm-btn--red" onClick={handleDeleteUser}>
                                <Trash2 size={18} /> Confirmar Eliminación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .adm-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    padding: 20px;
                }
                .adm-modal {
                    background: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    width: 100%;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                .adm-modal-header {
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .adm-modal-title {
                    font-size: 1.2rem;
                    font-weight: 700;
                    color: white;
                    margin: 0;
                }
                .adm-modal-close {
                    background: transparent;
                    border: none;
                    color: var(--adm-muted);
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                }
                .adm-modal-close:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: white;
                }
                .adm-modal-body {
                    padding: 20px;
                }
                .adm-modal-footer {
                    padding: 16px 20px;
                    background: rgba(255, 255, 255, 0.02);
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                .adm-form-group {
                    margin-bottom: 16px;
                }
                .adm-label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: var(--adm-muted);
                    margin-bottom: 8px;
                }
                .adm-btn--red {
                    background: #ef4444;
                    color: white;
                }
                .adm-btn--red:hover {
                    background: #dc2626;
                }
            `}</style>
            {/* Credits Modal */}
            {showCreditsModal && (
                <div className="adm-modal-overlay">
                    <div className="adm-modal" style={{ maxWidth: 420 }}>
                        <div className="adm-modal-header">
                            <h2 className="adm-modal-title" style={{ color: '#facc15', display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Package size={20} /> Cargar Paquete de Créditos
                            </h2>
                            <button className="adm-modal-close" onClick={() => setShowCreditsModal(null)}><X size={20} /></button>
                        </div>
                        <div className="adm-modal-body">
                            <p style={{ fontSize: '.85rem', color: 'var(--adm-muted)', marginBottom: 20 }}>Selecciona un paquete para asignar créditos al revendedor.</p>
                            <div className="adm-form-group">
                                <label className="adm-label">Paquetes Disponibles</label>
                                <select 
                                    className="adm-input" 
                                    value={selectedPkgId} 
                                    onChange={e => setSelectedPkgId(e.target.value)}
                                    style={{ backgroundColor: '#151515', color: '#f3f4f6', borderColor: 'rgba(255,255,255,0.15)', width: '100%' }}
                                >
                                    <option value="" style={{ backgroundColor: '#151515', color: '#9ca3af' }}>Elegir paquete...</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id} style={{ backgroundColor: '#151515', color: '#f3f4f6' }}>
                                            {pkg.name} — ({pkg.baseCredits + pkg.bonusCredits} créditos)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="adm-modal-footer">
                            <button className="adm-btn adm-btn--ghost" onClick={() => setShowCreditsModal(null)}>Cancelar</button>
                            <button className="adm-btn adm-btn--primary" onClick={handleApplyPackage} disabled={!selectedPkgId}>Aplicar Paquete</button>
                        </div>
                    </div>
                </div>
            )}


            {/* End User Create Modal */}
            {showEndUserCreate && (() => {
                const euFilteredPlans = activePlans.filter(p => {
                    if (endUserPlanFilter === 'demo') return p.isDemo;
                    if (endUserPlanFilter === 'promo') return p.isPromo && !p.isDemo;
                    return !p.isDemo && !p.isPromo;
                });
                const euSelectedPlan = activePlans.find(p => p.id === endUserForm.planId);

                const handleCreateEndUser = async (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!endUserForm.username || endUserForm.username.length < 3) { alert('El usuario debe tener al menos 3 caracteres'); return; }
                    if (!endUserForm.password || endUserForm.password.length < 4) { alert('La contraseña debe tener al menos 4 caracteres'); return; }
                    if (!endUserForm.planId) { alert('Debes seleccionar un plan en la lista'); return; }
                    setEndUserCreating(true);
                    try {
                        const r = await adminFetch(API_ROUTES.END_USERS.BASE, {
                            method: 'POST',
                            body: JSON.stringify(endUserForm),
                        });
                        const j = await r.json();
                        if (j.success) {
                            setShowEndUserCreate(false);
                            setEndUserForm({ username: '', password: '', planId: '' });
                            fetchUsers();
                        } else {
                            alert(j.error || 'Error al crear cuenta');
                        }
                    } catch (err) {
                        alert('Error de conexión');
                    } finally {
                        setEndUserCreating(false);
                    }
                };

                return (
                    <div className="adm-modal-overlay" onClick={() => setShowEndUserCreate(false)}>
                        <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520, maxHeight: '85vh', overflow: 'auto' }}>
                            <div className="adm-modal-header">
                                <h2 className="adm-modal-title">
                                    <UserCheck size={20} style={{ marginRight: 8 }} /> Nueva Cuenta Final
                                </h2>
                                <button className="adm-modal-close" onClick={() => setShowEndUserCreate(false)}><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateEndUser}>
                                <div className="adm-modal-body">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginBottom: '1rem', padding: '.5rem .75rem', background: 'rgba(139,92,246,0.08)', borderRadius: '8px', fontSize: '.82rem', color: '#a78bfa' }}>
                                        <Shield size={14} />
                                        Como administrador, no se te descuentan créditos.
                                    </div>

                                    <div className="adm-form-group">
                                        <label className="adm-label">Usuario</label>
                                        <input className="adm-input" value={endUserForm.username} onChange={e => setEndUserForm(f => ({ ...f, username: e.target.value }))} required minLength={3} placeholder="Nombre de usuario" />
                                    </div>
                                    <div className="adm-form-group">
                                        <label className="adm-label">Contraseña</label>
                                        <input className="adm-input" value={endUserForm.password} onChange={e => setEndUserForm(f => ({ ...f, password: e.target.value }))} required minLength={4} placeholder="Contraseña" />
                                    </div>

                                    {/* Plan Type Selector */}
                                    <div className="adm-form-group">
                                        <label className="adm-label">Tipo de Plan</label>
                                        <div style={{ display: 'flex', gap: '.5rem' }}>
                                            <button type="button" className={`adm-btn ${endUserPlanFilter === 'normal' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }} onClick={() => { setEndUserPlanFilter('normal'); setEndUserForm(f => ({ ...f, planId: '' })); }}>
                                                Normal
                                            </button>
                                            {activePlans.some(p => p.isPromo && !p.isDemo) && (
                                                <button type="button" className={`adm-btn ${endUserPlanFilter === 'promo' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }} onClick={() => { setEndUserPlanFilter('promo'); setEndUserForm(f => ({ ...f, planId: '' })); }}>
                                                    🎉 Promo
                                                </button>
                                            )}
                                            {activePlans.some(p => p.isDemo) && (
                                                <button type="button" className={`adm-btn ${endUserPlanFilter === 'demo' ? 'adm-btn--primary' : 'adm-btn--ghost'}`} style={{ flex: 1, padding: '.4rem', fontSize: '.8rem' }} onClick={() => { setEndUserPlanFilter('demo'); setEndUserForm(f => ({ ...f, planId: '' })); }}>
                                                    🎁 Demo
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Plan Cards */}
                                    <div className="adm-form-group">
                                        <label className="adm-label">Seleccionar Plan</label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                                            {euFilteredPlans.length === 0 && <p style={{ fontSize: '.82rem', textAlign: 'center', padding: '.5rem', color: 'var(--adm-muted)' }}>No hay planes disponibles</p>}
                                            {euFilteredPlans.map(p => (
                                                <button key={p.id} type="button" onClick={() => setEndUserForm(f => ({ ...f, planId: p.id }))}
                                                    style={{
                                                        padding: '.6rem .8rem', cursor: 'pointer', textAlign: 'left',
                                                        border: endUserForm.planId === p.id ? '2px solid #a78bfa' : '1px solid rgba(255,255,255,.08)',
                                                        borderRadius: '10px', background: endUserForm.planId === p.id ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                                                        transition: 'all .2s', color: 'white',
                                                    }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <strong style={{ fontSize: '.88rem' }}>{p.name}</strong>
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
                                    {euSelectedPlan && (
                                        <div style={{ padding: '.75rem', background: 'rgba(139,92,246,0.05)', borderRadius: '10px', fontSize: '.85rem', border: '1px solid rgba(139,92,246,0.2)', marginTop: '1rem' }}>
                                            <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#a78bfa', textTransform: 'uppercase', fontSize: '.75rem', letterSpacing: '0.05em' }}>Resumen de Suscripción</div>
                                            <div style={{ marginBottom: '.2rem' }}>Plan: <strong style={{ color: 'white' }}>{euSelectedPlan.name}</strong></div>
                                            <div style={{ marginBottom: '.2rem' }}>Duración: <strong style={{ color: 'white' }}>{euSelectedPlan.isDemo ? `${euSelectedPlan.demoHours}h` : `${euSelectedPlan.durationDays} días`}{euSelectedPlan.bonusDays ? ` (+${euSelectedPlan.bonusDays} bonus)` : ''}</strong></div>
                                            <div style={{ marginBottom: '.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                Dispositivos: <strong style={{ color: '#fbbf24', fontSize: '.9rem' }}>{euSelectedPlan.maxDevices} {euSelectedPlan.maxDevices === 1 ? 'dispositivo' : 'dispositivos'}</strong>
                                            </div>
                                            <div>Costo: <strong style={{ color: '#4ade80' }}>Sin costo (Admin)</strong></div>
                                        </div>
                                    )}
                                </div>

                                <div className="adm-modal-footer">
                                    <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowEndUserCreate(false)}>Cancelar</button>
                                    <button type="submit" className="adm-btn adm-btn--primary" disabled={endUserCreating}>
                                        {endUserCreating ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                                        Crear Cuenta
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

