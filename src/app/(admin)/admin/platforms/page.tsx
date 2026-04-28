'use client';

import { useState, useEffect } from 'react';
import { Server, Plus, Pencil, Trash2, X } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface Platform { id: string; name: string; slug: string; logoUrl?: string; }

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', logoUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlatforms = () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
    fetch(API_ROUTES.PLATFORMS.LIST, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    })
      .then(r => r.json())
      .then(d => { setPlatforms(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      console.log('Creando plataforma en:', API_ROUTES.PLATFORMS.CREATE);
      console.log('Token de admin:', token ? 'Encontrado' : 'NO ENCONTRADO');

      const res = await fetch(API_ROUTES.PLATFORMS.CREATE, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', slug: '', logoUrl: '' });
        fetchPlatforms();
      } else {
        console.error('Failed to create platform');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Plataformas</h1>
          <p className="adm-page-subtitle">Canales y servicios de streaming integrados</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nueva plataforma
        </button>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Plataforma</th>
              <th>Slug</th>
              <th>Logo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '32px', color: 'var(--adm-muted)' }}>Cargando...</td></tr>
            ) : platforms.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>
                  <Server size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: .3 }} />
                  Sin plataformas. Crea la primera usando el botón.
                </td>
              </tr>
            ) : platforms.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'rgba(124,58,237,.2)', display: 'flex',
                      alignItems: 'center', justifyContent: 'center'
                    }}>
                      {p.logoUrl ? (
                        <img src={p.logoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
                      ) : (
                        <Server size={14} style={{ color: '#a78bfa' }} />
                      )}
                    </div>
                    <span style={{ fontWeight: 600, color: 'white' }}>{p.name}</span>
                  </div>
                </td>
                <td><code style={{ color: '#60a5fa', fontSize: '.78rem' }}>{p.slug}</code></td>
                <td className="adm-table-muted">{p.logoUrl ? '✓ Sí' : '— Sin logo'}</td>
                <td>
                  <div className="adm-table-actions">
                    <button className="adm-icon-btn" title="Editar"><Pencil size={13} /></button>
                    <button className="adm-icon-btn adm-icon-btn--danger" title="Eliminar"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="adm-table-footer">
          <span>{platforms.length} plataformas</span>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>Crear Plataforma</h2>
              <button className="adm-icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Nombre</label>
                <input 
                  type="text" required
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Slug</label>
                <input 
                  type="text" required
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>URL del Logo (Opcional)</label>
                <input 
                  type="url"
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={formData.logoUrl}
                  onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
