'use client';

import { Users, Search, MoreVertical, ShieldCheck, UserX } from 'lucide-react';

const MOCK_USERS = [
  { id: '1', name: 'Alejandra García', email: 'ale@peliplus.com', role: 'ADMIN', status: 'active', joined: '2025-01-15', plan: 'Admin' },
  { id: '2', name: 'Carlos Rodríguez', email: 'carlos@email.com', role: 'MEMBER', status: 'active', joined: '2025-03-22', plan: 'Premium' },
  { id: '3', name: 'María López', email: 'maria@email.com', role: 'REGISTERED', status: 'inactive', joined: '2025-04-01', plan: 'Básico' },
  { id: '4', name: 'Pedro Martínez', email: 'pedro@email.com', role: 'MEMBER', status: 'active', joined: '2025-02-10', plan: 'Premium' },
  { id: '5', name: 'Sofía Herrera', email: 'sofia@email.com', role: 'REGISTERED', status: 'active', joined: '2025-04-18', plan: 'Básico' },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'adm-badge adm-badge--purple',
  MEMBER: 'adm-badge adm-badge--blue',
  REGISTERED: 'adm-badge adm-badge--gray',
};

export default function AdminUsersPage() {
  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Usuarios</h1>
          <p className="adm-page-subtitle">Gestión de cuentas y membresías</p>
        </div>
        <button className="adm-btn adm-btn--primary"><ShieldCheck size={16} /> Invitar usuario</button>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={15} className="adm-search-icon" />
          <input type="text" placeholder="Buscar por nombre o email..." className="adm-search-input" />
        </div>
        <select className="adm-select">
          <option>Todos los roles</option>
          <option>ADMIN</option>
          <option>MEMBER</option>
          <option>REGISTERED</option>
        </select>
        <select className="adm-select">
          <option>Todos los estados</option>
          <option>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Rol</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Registro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="adm-table-user">
                    <div className="adm-table-avatar">{u.name[0]}</div>
                    <div>
                      <div className="adm-table-user-name">{u.name}</div>
                      <div className="adm-table-user-email">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td><span className={ROLE_COLORS[u.role] ?? 'adm-badge adm-badge--gray'}>{u.role}</span></td>
                <td><span className="adm-table-plan">{u.plan}</span></td>
                <td>
                  <span className={`adm-badge ${u.status === 'active' ? 'adm-badge--green' : 'adm-badge--red'}`}>
                    {u.status === 'active' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="adm-table-muted">{new Date(u.joined).toLocaleDateString('es-AR')}</td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-icon-btn adm-icon-btn--danger" title="Suspender"><UserX size={14} /></button>
                    <button className="adm-icon-btn" title="Más"><MoreVertical size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="adm-table-footer">
          <span>5 usuarios</span>
          <div className="adm-pagination">
            <button className="adm-page-btn" disabled>←</button>
            <button className="adm-page-btn adm-page-btn--active">1</button>
            <button className="adm-page-btn">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
