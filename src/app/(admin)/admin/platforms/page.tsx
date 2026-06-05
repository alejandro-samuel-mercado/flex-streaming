'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect, useCallback } from 'react';
import { Server, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface Platform { id: string; name: string; slug: string; logoUrl?: string; }

export default function AdminPlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', logoUrl: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPlatforms = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.PLATFORMS.LIST, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const d = await res.json();
      setPlatforms(d.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlatforms();
  }, [fetchPlatforms]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const url = editingId ? API_ROUTES.PLATFORMS.UPDATE(editingId) : API_ROUTES.PLATFORMS.CREATE;
      const method = editingId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ name: '', slug: '', logoUrl: '' });
        fetchPlatforms();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Operación fallida'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (p: Platform) => {
    setEditingId(p.id);
    setFormData({ name: p.name, slug: p.slug, logoUrl: p.logoUrl || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la plataforma "${name}"?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.PLATFORMS.DELETE(id), {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (res.ok) {
        fetchPlatforms();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo eliminar'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', logoUrl: '' });
    setIsModalOpen(true);
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Plataformas</h1>
          <p className="adm-page-subtitle">Canales y servicios de streaming integrados</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={openCreateModal}>
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
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--adm-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Loader2 className="animate-spin" size={24} />
                  Cargando plataformas...
                </div>
              </td></tr>
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
                    <button className="adm-icon-btn" title="Editar" onClick={() => handleEdit(p)}><Pencil size={13} /></button>
                    <button className="adm-icon-btn adm-icon-btn--danger" title="Eliminar" onClick={() => handleDelete(p.id, p.name)}><Trash2 size={13} /></button>
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
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                {editingId ? 'Editar Plataforma' : 'Crear Plataforma'}
              </h2>
              <button className="adm-icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Nombre</label>
                <input 
                  type="text" required
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value, slug: editingId ? formData.slug : e.target.value.toLowerCase().replace(/\s+/g, '-') })}
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
                  {submitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 className="animate-spin" size={14} />
                      Guardando...
                    </div>
                  ) : editingId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
