'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Search, Trash2, Loader2, X, Server, Pencil } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface Category { id: string; name: string; slug: string; count?: number; }
interface Platform { id: string; name: string; slug: string; logoUrl?: string; }

export default function AdminTaxonomyPage() {
  const [activeTab, setActiveTab] = useState<'categories' | 'platforms'>('categories');

  // Categorías y Etiquetas state
  const [genres, setGenres] = useState<Category[]>([]);
  const [tags, setTags] = useState<Category[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [submittingTag, setSubmittingTag] = useState(false);
  
  const [isGenreModalOpen, setIsGenreModalOpen] = useState(false);
  const [newGenreName, setNewGenreName] = useState('');
  const [submittingGenre, setSubmittingGenre] = useState(false);

  // Plataformas state
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loadingPlats, setLoadingPlats] = useState(true);
  
  const [isPlatModalOpen, setIsPlatModalOpen] = useState(false);
  const [editingPlatId, setEditingPlatId] = useState<string | null>(null);
  const [platFormData, setPlatFormData] = useState({ name: '', slug: '', logoUrl: '' });
  const [submittingPlat, setSubmittingPlat] = useState(false);

  const fetchCategoriesAndTags = useCallback(async () => {
    setLoadingCats(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
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
      setLoadingCats(false);
    }
  }, []);

  const fetchPlatforms = useCallback(async () => {
    setLoadingPlats(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.PLATFORMS.LIST, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const d = await res.json();
      setPlatforms(d.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPlats(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'categories') {
      fetchCategoriesAndTags();
    } else {
      fetchPlatforms();
    }
  }, [activeTab, fetchCategoriesAndTags, fetchPlatforms]);

  // --- Handlers para Categorías / Etiquetas ---
  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName) return;
    setSubmittingTag(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.CATEGORIES.TAGS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newTagName, slug: newTagName.toLowerCase().replace(/\s+/g, '-') })
      });
      if (res.ok) {
        setIsTagModalOpen(false);
        setNewTagName('');
        fetchCategoriesAndTags();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingTag(false);
    }
  };

  const handleDeleteTag = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar etiqueta "${name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.CATEGORIES.DELETE_TAG(id), {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) fetchCategoriesAndTags();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGenreName) return;
    setSubmittingGenre(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.CATEGORIES.GENRES, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newGenreName, slug: newGenreName.toLowerCase().replace(/\s+/g, '-') })
      });
      if (res.ok) {
        setIsGenreModalOpen(false);
        setNewGenreName('');
        fetchCategoriesAndTags();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingGenre(false);
    }
  };

  const handleDeleteGenre = async (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar género "${name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.CATEGORIES.DELETE_GENRE(id), {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      if (res.ok) fetchCategoriesAndTags();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Handlers para Plataformas ---
  const handlePlatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platFormData.name || !platFormData.slug) return;
    setSubmittingPlat(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const url = editingPlatId ? API_ROUTES.PLATFORMS.UPDATE(editingPlatId) : API_ROUTES.PLATFORMS.CREATE;
      const method = editingPlatId ? 'PUT' : 'POST';

      const res = await adminFetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(platFormData)
      });

      if (res.ok) {
        setIsPlatModalOpen(false);
        setEditingPlatId(null);
        setPlatFormData({ name: '', slug: '', logoUrl: '' });
        fetchPlatforms();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'Operación fallida'}`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setSubmittingPlat(false);
    }
  };

  const handleEditPlat = (p: Platform) => {
    setEditingPlatId(p.id);
    setPlatFormData({ name: p.name, slug: p.slug, logoUrl: p.logoUrl || '' });
    setIsPlatModalOpen(true);
  };

  const handleDeletePlat = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la plataforma "${name}"?`)) return;
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      const res = await adminFetch(API_ROUTES.PLATFORMS.DELETE(id), {
        method: 'DELETE',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
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

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Taxonomía</h1>
          <p className="adm-page-subtitle">Organiza las categorías, etiquetas y plataformas del contenido</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
        <button 
          className={`adm-btn ${activeTab === 'categories' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} /> Categorías y Etiquetas
        </button>
        <button 
          className={`adm-btn ${activeTab === 'platforms' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
          onClick={() => setActiveTab('platforms')}
        >
          <Server size={16} /> Plataformas
        </button>
      </div>

      {activeTab === 'categories' && (
        <div className="animate-fadeIn">
          <div className="adm-grid-2">
            {/* Genres */}
            <div className="adm-table-card">
              <div className="adm-table-card-header">
                <h2 className="adm-table-card-title">Géneros</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="adm-badge adm-badge--blue">Público</span>
                  <button className="adm-icon-btn adm-icon-btn--primary" onClick={() => setIsGenreModalOpen(true)} title="Nuevo género">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <table className="adm-table">
                <thead>
                  <tr><th>Nombre</th><th>Slug</th><th></th></tr>
                </thead>
                <tbody>
                  {loadingCats ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="animate-spin" size={18} /></td></tr>
                  ) : genres.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--adm-muted)' }}>Sin géneros.</td></tr>
                  ) : genres.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600, color: 'white' }}>{g.name}</td>
                      <td><code style={{ color: '#60a5fa', fontSize: '.75rem' }}>{g.slug}</code></td>
                      <td>
                        <div className="adm-table-actions">
                          <button 
                            className="adm-icon-btn adm-icon-btn--danger" 
                            title="Eliminar"
                            onClick={() => handleDeleteGenre(g.id, g.name)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tags */}
            <div className="adm-table-card">
              <div className="adm-table-card-header">
                <h2 className="adm-table-card-title">Etiquetas / Tags</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="adm-icon-btn adm-icon-btn--primary" onClick={() => setIsTagModalOpen(true)} title="Nueva etiqueta">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              <table className="adm-table">
                <thead>
                  <tr><th>Nombre</th><th>Slug</th><th></th></tr>
                </thead>
                <tbody>
                  {loadingCats ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px' }}><Loader2 className="animate-spin" size={18} /></td></tr>
                  ) : tags.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: 'var(--adm-muted)' }}>Sin etiquetas.</td></tr>
                  ) : tags.map(tag => (
                    <tr key={tag.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag size={13} style={{ color: '#FFD700' }} />
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
        </div>
      )}

      {activeTab === 'platforms' && (
        <div className="animate-fadeIn">
          <div className="adm-table-card">
            <div className="adm-table-card-header">
              <h2 className="adm-table-card-title">Plataformas de Streaming</h2>
              <button className="adm-btn adm-btn--primary adm-btn--sm" onClick={() => { setEditingPlatId(null); setPlatFormData({ name: '', slug: '', logoUrl: '' }); setIsPlatModalOpen(true); }}>
                <Plus size={14} style={{ marginRight: 4 }} /> Añadir Plataforma
              </button>
            </div>
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
                {loadingPlats ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '48px', color: 'var(--adm-muted)' }}><Loader2 className="animate-spin" size={24} style={{ margin: '0 auto' }} /></td></tr>
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
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255, 215, 0,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {p.logoUrl ? <img src={p.logoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} /> : <Server size={14} style={{ color: '#FFD700' }} />}
                        </div>
                        <span style={{ fontWeight: 600, color: 'white' }}>{p.name}</span>
                      </div>
                    </td>
                    <td><code style={{ color: '#60a5fa', fontSize: '.78rem' }}>{p.slug}</code></td>
                    <td className="adm-table-muted">{p.logoUrl ? '✓ Sí' : '— Sin logo'}</td>
                    <td>
                      <div className="adm-table-actions">
                        <button className="adm-icon-btn" title="Editar" onClick={() => handleEditPlat(p)}><Pencil size={13} /></button>
                        <button className="adm-icon-btn adm-icon-btn--danger" title="Eliminar" onClick={() => handleDeletePlat(p.id, p.name)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      {isTagModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>Nueva Etiqueta</h2>
              <button className="adm-icon-btn" onClick={() => setIsTagModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTag} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="text" required autoFocus className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }} value={newTagName} onChange={e => setNewTagName(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsTagModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submittingTag}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGenreModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>Nuevo Género</h2>
              <button className="adm-icon-btn" onClick={() => setIsGenreModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateGenre} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <input type="text" required autoFocus className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }} value={newGenreName} onChange={e => setNewGenreName(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsGenreModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submittingGenre}>Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPlatModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="adm-table-card" style={{ width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="adm-page-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                {editingPlatId ? 'Editar Plataforma' : 'Crear Plataforma'}
              </h2>
              <button className="adm-icon-btn" onClick={() => setIsPlatModalOpen(false)}><X size={18} /></button>
            </div>
            
            <form onSubmit={handlePlatSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Nombre</label>
                <input 
                  type="text" required
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={platFormData.name}
                  onChange={e => setPlatFormData({ ...platFormData, name: e.target.value, slug: editingPlatId ? platFormData.slug : e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Slug</label>
                <input 
                  type="text" required
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={platFormData.slug}
                  onChange={e => setPlatFormData({ ...platFormData, slug: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>URL del Logo (Opcional)</label>
                <input 
                  type="url"
                  className="adm-search-input" style={{ width: '100%', padding: '10px 12px' }}
                  value={platFormData.logoUrl}
                  onChange={e => setPlatFormData({ ...platFormData, logoUrl: e.target.value })}
                />
              </div>
              
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button type="button" className="adm-btn adm-btn--ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setIsPlatModalOpen(false)}>Cancelar</button>
                <button type="submit" className="adm-btn adm-btn--primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submittingPlat}>
                  {submittingPlat ? 'Guardando...' : editingPlatId ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
