'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Film, ArrowLeft, Loader2, Save, Languages, 
  Layout, CheckCircle2, AlertCircle, Plus
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allPlatforms, setAllPlatforms] = useState<{ id: string; name: string }[]>([]);
  const [allGenres, setAllGenres] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    synopsis: '',
    type: 'MOVIE',
    releaseYear: new Date().getFullYear(),
    duration: 120,
    rating: 0,
    featured: false,
    platformId: '',
    genreIds: [] as string[]
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

      const [platformsRes, genresRes] = await Promise.all([
        fetch(API_ROUTES.PLATFORMS.LIST, { headers }),
        fetch(API_ROUTES.CATEGORIES.GENRES, { headers })
      ]);

      const [platformsJson, genresJson] = await Promise.all([
        platformsRes.json(),
        genresRes.json()
      ]);

      setAllPlatforms(platformsJson.data || []);
      setAllGenres(genresJson.data || []);
    } catch (err) {
      console.error(err);
      setError('Error al cargar opciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    const payload = {
      type: formData.type,
      originalTitle: formData.originalTitle || formData.title,
      releaseYear: Number(formData.releaseYear),
      duration: Number(formData.duration),
      rating: Number(formData.rating),
      featured: formData.featured,
      status: 'PENDING',
      platformId: formData.platformId || null,
      genreIds: formData.genreIds,
      translations: [{
        language: 'es',
        title: formData.title,
        description: formData.synopsis,
      }]
    };

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API_ROUTES.CONTENT.LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Error al crear contenido');
      }
      
      router.push('/admin/content');
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleGenre = (id: string) => {
    setFormData(prev => ({
      ...prev,
      genreIds: prev.genreIds.includes(id)
        ? prev.genreIds.filter(x => x !== id)
        : [...prev.genreIds, id]
    }));
  };

  if (loading && allPlatforms.length === 0) return (
    <div className="adm-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Loader2 className="animate-spin" size={32} style={{ color: 'var(--adm-muted)' }} />
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/admin/content" className="adm-icon-btn" title="Volver">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="adm-page-title">Crear Contenido</h1>
            <p className="adm-page-subtitle">Añade una nueva película o serie al catálogo</p>
          </div>
        </div>
        <button 
          className="adm-btn adm-btn--primary" 
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {submitting ? 'Creando...' : 'Crear Contenido'}
        </button>
      </div>

      {error && (
        <div style={{ 
          background: 'rgba(248, 113, 113, .1)', 
          border: '1px solid rgba(248, 113, 113, .3)',
          color: '#fca5a5',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="adm-settings-grid">
        {/* Información Principal */}
        <div className="adm-settings-section">
          <div className="adm-settings-section-header">
            <Film className="adm-settings-icon" size={18} />
            <h2>Información General</h2>
          </div>
          <div className="adm-settings-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="adm-form-row">
                <label>Tipo de Contenido *</label>
                <select 
                  className="adm-select" 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="MOVIE">Película</option>
                  <option value="SERIES">Serie</option>
                  <option value="ANIME">Anime</option>
                  <option value="DOCUMENTARY">Documental</option>
                </select>
              </div>
              <div className="adm-form-row">
                <label>Año *</label>
                <input 
                  type="number" required
                  className="adm-input"
                  value={formData.releaseYear}
                  onChange={e => setFormData({ ...formData, releaseYear: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="adm-form-row">
                <label>Duración (min) *</label>
                <input 
                  type="number" required
                  className="adm-input"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div className="adm-form-row">
                <label>Rating (0-10)</label>
                <input 
                  type="number" step="0.1" max="10" min="0"
                  className="adm-input"
                  value={formData.rating}
                  onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            
            <div className="adm-toggle-row" style={{ marginTop: 8 }}>
              <span>Contenido Destacado</span>
              <div 
                className={`adm-toggle ${formData.featured ? 'adm-toggle--on' : ''}`} 
                onClick={() => setFormData({ ...formData, featured: !formData.featured })}
              />
            </div>
          </div>
        </div>

        {/* Clasificación */}
        <div className="adm-settings-section">
          <div className="adm-settings-section-header">
            <Layout className="adm-settings-icon" size={18} />
            <h2>Plataforma y Géneros</h2>
          </div>
          <div className="adm-settings-body">
            <div className="adm-form-row">
              <label>Plataforma principal</label>
              <select 
                className="adm-select"
                value={formData.platformId}
                onChange={e => setFormData({ ...formData, platformId: e.target.value })}
              >
                <option value="">Ninguna</option>
                {allPlatforms.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="adm-form-row">
              <label>Géneros</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {allGenres.map(g => {
                  const isActive = formData.genreIds.includes(g.id);
                  return (
                    <button 
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={`adm-badge ${isActive ? 'adm-badge--purple' : 'adm-badge--gray'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                    >
                      {g.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Textos */}
        <div className="adm-settings-section" style={{ gridColumn: 'span 2' }}>
          <div className="adm-settings-section-header">
            <Languages className="adm-settings-icon" size={18} />
            <h2>Textos (Español)</h2>
          </div>
          <div className="adm-settings-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="adm-form-row">
                <label>Título *</label>
                <input 
                  type="text" required
                  className="adm-input"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="adm-form-row">
                <label>Título Original</label>
                <input 
                  type="text"
                  className="adm-input"
                  value={formData.originalTitle}
                  onChange={e => setFormData({ ...formData, originalTitle: e.target.value })}
                />
              </div>
            </div>
            <div className="adm-form-row">
              <label>Sinopsis</label>
              <textarea 
                className="adm-input" 
                rows={5}
                style={{ resize: 'vertical' }}
                value={formData.synopsis}
                onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
