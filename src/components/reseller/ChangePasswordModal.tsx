'use client';

import { useState } from 'react';
import { API_ROUTES } from '@/lib/api-routes';
import type { EndUserAccount } from '@/types/reseller.types';

interface Props {
  account: EndUserAccount;
  onClose: () => void;
  onSuccess: () => void;
  fetchFn: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function ChangePasswordModal({ account, onClose, onSuccess, fetchFn }: Props) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 4) { alert('La contraseña debe tener al menos 4 caracteres'); return; }
    setSubmitting(true);
    try {
      const res = await fetchFn(API_ROUTES.END_USERS.PASSWORD(account.id), {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success) onSuccess();
      else alert(json.error);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <h2 style={{ margin: '0 0 1rem', fontSize: '1.05rem' }}>Cambiar Contraseña — {account.username}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div className="adm-field">
            <label className="adm-label">Nueva contraseña</label>
            <input className="adm-input" type="text" value={password} onChange={e => setPassword(e.target.value)} minLength={4} required autoFocus />
          </div>
          <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="adm-btn adm-btn--ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
