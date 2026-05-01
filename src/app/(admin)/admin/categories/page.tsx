'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Search, Trash2, Loader2, X } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface Category { id: string; name: string; slug: string; count?: number; }

export default function AdminCategoriesPage() {
  const [genres, setGenres] = useState<Category[]>([]);
  const [tags, setTags] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

      const [genresRes, tagsRes] = await Promise.all([
        fetch(API_ROUTES.CATEGORIES.GENRES, { headers }),
        fetch(API_ROUTES.CATEGORIES.TAGS, { headers })
      ]);

      const [genresData, tagsData] = await Promise.all([
        genresRes.json(),
        tagsRes.json()
      ]);

      setGenres(genresData.data ?? []);
      setTags(tagsData.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API_ROUTES.CATEGORIES.TAGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newTagName, slug: newTagName.toLowerCase().replace(/\s+/g, '-') })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTagName('');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar etiqueta "${name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API_ROUTES.CATEGORIES.DELETE_TAG(id), {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Categorías</h1>
          <p className="adm-page-subtitle">Géneros y etiquetas para clasificar el contenido</p>
        </div>
        <button className="adm-btn adm-btn--primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> Nueva etiqueta
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Genres */}
        <div className="adm-table-card">
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Géneros</h2>
            <span className="adm-badge adm-badge--blue">Público</span>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Nombre</th><th>Slug</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="animate-spin" size={18} /></td></tr>
              ) : genres.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--adm-muted)' }}>Sin géneros.</td></tr>
              ) : genres.map(g => (
                <tr key={g.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{g.name}</td>
                  <td><code style={{ color: '#60a5fa', fontSize: '.75rem' }}>{g.slug}</code></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Tags */}
        <div className="adm-table-card">
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Etiquetas / Tags</h2>
            <div className="adm-search-wrap" style={{ maxWidth: 180 }}>
              <Search size={13} className="adm-search-icon" />
              <input type="text" placeholder="Buscar..." className="adm-search-input" />
            </div>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Nombre</th><th>Slug</th><th></th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="animate-spin" size={18} /></td></tr>
              ) : tags.length === 0 ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--adm-muted)' }}>Sin etiquetas.</td></tr>
              ) : tags.map(tag => (
                <tr key={tag.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={13} style={{ color: '#a78bfa' }} />
                      <span style={{ fontWeight: 600, color: 'white' }}>{tag.name}</span>
                    </div>
                  </td>
                  <td><code style={{ color: '#60a5fa', fontSize: '.75rem' }}>{tag.slug}</code></td>
                  <td>
                    <div className="adm-table-actions">
                      <button 
                        className="adm-icon-btn adm-icon-btn--danger" 
                        title="Eliminar"
                        onClick={() => handleDeleteTag(tag.id, tag.name)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="adm-table-footer">
            <span>{tags.length} etiquetas</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>Nueva Etiqueta</h2>
              <button className="adm-icon-btn" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTag} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Nombre de la etiqueta</label>
                <input 
                  type="text" required autoFocus
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
