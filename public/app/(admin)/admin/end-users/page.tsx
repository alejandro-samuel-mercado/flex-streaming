'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';
import EndUsersTable from '@/components/reseller/EndUsersTable';
import type { EndUserAccount } from '@/types/reseller.types';

export default function AdminEndUsersPage() {
  const [users, setUsers] = useState<EndUserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await adminFetch(`${API_ROUTES.END_USERS.BASE}?${params}`);
      const json = await res.json();
      if (json.success) { setUsers(json.data.users); setTotalPages(json.data.totalPages); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div><h1 className="adm-page-title">Clientes Finales</h1><p className="adm-page-subtitle">Todas las cuentas de clientes del sistema</p></div>
      </div>
      <EndUsersTable
        users={users}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onRefresh={fetchUsers}
        fetchFn={adminFetch}
      />
    </div>
  );
}
