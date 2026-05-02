'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import EndUsersTable from '@/components/reseller/EndUsersTable';
import AddPlanModal from '@/components/reseller/AddPlanModal';
import type { EndUserAccount } from '@/types/reseller.types';

export default function VendorEndUsersPage() {
  const [users, setUsers] = useState<EndUserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newAccountPlanModal, setNewAccountPlanModal] = useState<EndUserAccount | null>(null);
  const [form, setForm] = useState({ username: '', password: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    const r = await resellerFetch(`${API_ROUTES.END_USERS.BASE}?${params}`);
    const j = await r.json();
    if (j.success) { setUsers(j.data.users); setTotalPages(j.data.totalPages); }
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await resellerFetch(API_ROUTES.END_USERS.BASE, { method: 'POST', body: JSON.stringify(form) });
    const j = await r.json();
    if (j.success) {
      setShowCreate(false);
      setForm({ username: '', password: '' });
      setNewAccountPlanModal(j.data); // Backend create returns the created account in j.data
      fetchUsers();
    } else {
      alert(j.error);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Mis Clientes</h1><p className="adm-page-subtitle">Cuentas de clientes finales</p></div>
        <button className="adm-btn adm-btn--primary" onClick={() => setShowCreate(true)}><Plus size={16} /> Nueva Cuenta</button>
      </div>
      <EndUsersTable users={users} loading={loading} search={search} onSearchChange={setSearch} page={page} totalPages={totalPages} onPageChange={setPage} onRefresh={fetchUsers} fetchFn={resellerFetch} />

      {showCreate && (
        <div className="adm-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>Nueva Cuenta</h2>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              <div className="adm-field">
                <label className="adm-label">Usuario</label>
                <input className="adm-input" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required minLength={6} />
              </div>
              <div className="adm-field">
                <label className="adm-label">Contraseña</label>
                <input className="adm-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
              </div>
              <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
                <button type="button" className="adm-btn adm-btn--ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary">Crear y Elegir Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newAccountPlanModal && (
        <AddPlanModal
          account={newAccountPlanModal}
          onClose={() => setNewAccountPlanModal(null)}
          onSuccess={() => { setNewAccountPlanModal(null); fetchUsers(); }}
          fetchFn={resellerFetch}
        />
      )}
    </div>
  );
}
