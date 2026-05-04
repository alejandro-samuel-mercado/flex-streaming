'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import { Users, Search, Loader2, User, Mail, Calendar, Shield, Crown, UserCheck, Coins, Monitor, Smartphone, Tv } from 'lucide-react';

export default function AdminUsersPage() {
    const [activeTab, setActiveTab] = useState<'ADMIN' | 'VENDOR' | 'END_USER'>('ADMIN');

    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '20', role: activeTab });
            if (searchQuery) params.append('search', searchQuery);

            const res = await adminFetch(`${API_ROUTES.ADMIN.BASE}/users?${params}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.data.users || []);
                setTotalPages(Math.ceil((data.data.total || 0) / 20));
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, activeTab, searchQuery]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
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
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                <button
                    className={`adm-btn ${activeTab === 'ADMIN' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('ADMIN'); setPage(1); }}
                >
                    <Shield size={16} /> Administradores
                </button>
                <button
                    className={`adm-btn ${activeTab === 'VENDOR' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('VENDOR'); setPage(1); }}
                >
                    <Coins size={16} /> Revendedores
                </button>
                <button
                    className={`adm-btn ${activeTab === 'END_USER' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setActiveTab('END_USER'); setPage(1); }}
                >
                    <UserCheck size={16} /> Clientes Finales
                </button>
            </div>

            <div className="adm-table-card animate-fadeIn">
                <div className="adm-table-filters" style={{ padding: '16px 20px', borderBottom: '1px solid var(--adm-border)' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
                        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--adm-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                className="adm-input"
                                style={{ paddingLeft: 36 }}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="adm-btn adm-btn--primary">
                            Buscar
                        </button>
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
                                    <th>{activeTab === 'END_USER' ? 'Cuenta / Cliente' : 'Usuario'}</th>
                                    {activeTab === 'END_USER' ? (
                                        <>
                                            <th>Estado / Plan</th>
                                            <th>Dispositivos</th>
                                            <th>Gestionado por</th>
                                        </>
                                    ) : (
                                        <>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Perfiles</th>
                                        </>
                                    )}
                                    <th>Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No se encontraron registros.</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id}>
                                        {activeTab === 'END_USER' ? (
                                            <>
                                                {/* END_USER Render */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--adm-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={20} color="var(--adm-muted)" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'white' }}>{user.username}</div>
                                                            {user.country && <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)' }}>País: {user.country}</div>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <span className={`adm-badge ${user.status === 'ACTIVE' ? 'adm-badge--green' : 'adm-badge--red'}`} style={{ alignSelf: 'flex-start' }}>
                                                            {user.status}
                                                        </span>
                                                        <span style={{ fontSize: '.8rem', color: 'var(--adm-muted)' }}>{user.plan?.name || 'Sin plan'}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <span style={{ fontSize: '.9rem', color: 'white', fontWeight: 600 }}>
                                                            {user._count?.connectedDevices || 0} / {user.maxDevices}
                                                        </span>
                                                        {user.connectedDevices?.length > 0 && (
                                                            <div style={{ display: 'flex', gap: 4 }}>
                                                                {user.connectedDevices.slice(0, 3).map((d: any) => (
                                                                    <div key={d.id} title={d.deviceName || d.platform || 'Dispositivo'} style={{ background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 4, color: 'var(--adm-muted)' }}>
                                                                        {getDeviceIcon(d.deviceType)}
                                                                    </div>
                                                                ))}
                                                                {user.connectedDevices.length > 3 && <span style={{ fontSize: '.7rem', color: 'var(--adm-muted)' }}>+{user.connectedDevices.length - 3}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '.85rem', color: 'var(--adm-muted)' }}>
                                                        {user.managedBy?.name || 'Sistema'}
                                                    </span>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                {/* ADMIN / VENDOR Render */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--adm-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <User size={20} color="var(--adm-muted)" />
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                {user.name}
                                                                {user._count?.memberships > 0 && <Crown size={14} color="#fbbf24" />}
                                                            </div>
                                                            <div style={{ fontSize: '.8rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                                <Mail size={12} /> {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`adm-badge ${user.role === 'ADMIN' ? 'adm-badge--purple' : 'adm-badge--blue'}`}>
                                                        {user.role === 'ADMIN' && <Shield size={12} style={{ marginRight: 4 }} />}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`adm-badge ${user.isActive ? 'adm-badge--green' : 'adm-badge--red'}`}>
                                                        {user.isActive ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '.9rem', color: 'var(--adm-muted)' }}>
                                                        {user._count?.profiles || 0} perfiles
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                        <td>
                                            <span style={{ fontSize: '.85rem', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Calendar size={14} />
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            {activeTab === 'END_USER' ? (
                                                <button className="adm-btn adm-btn--ghost adm-btn--sm" onClick={() => alert('Historial de pagos pronto')}>Ver Historial</button>
                                            ) : (
                                                <button className="adm-btn adm-btn--ghost adm-btn--sm" disabled>Editar</button>
                                            )}
                                        </td>
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
        </div>
    );
}
