'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, Save, Trash2, Film, Image as ImageIcon, 
  Languages, Layout, Loader2, CheckCircle2, AlertCircle,
  Play, Clock, AlertTriangle, Check,
  Link, UploadCloud
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

interface Translation {
  id?: string;
  lang: string;
  title: string;
  description: string;
}

interface ContentData {
  id: string;
  type: string;
  status: string;
  releaseYear?: number;
  duration?: number;
  rating?: number;
  featured?: boolean;
  translations: Translation[];
  platforms: { id: string; name: string }[];
  categories: { id: string; name: string }[];
    videoFiles?: {
      id: string;
      status: string;
      type: string;
      resolution?: string;
      episodeId?: string;
      qualities: { quality: string }[];
    }[];
  thumbnails?: {
    id?: string;
    type: string;
    url: string;
  }[];
}

export default function EditContentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null); // 'POSTER' | 'BACKDROP' | null
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [data, setData] = useState<ContentData | null>(null);
  const [allPlatforms, setAllPlatforms] = useState<{ id: string; name: string }[]>([]);
  const [allGenres, setAllGenres] = useState<{ id: string; name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [contentRes, platformsRes, genresRes] = await Promise.all([
        adminFetch(API_ROUTES.CONTENT.DETAIL(id)),
        adminFetch(API_ROUTES.PLATFORMS.LIST),
        adminFetch(API_ROUTES.CATEGORIES.GENRES)
      ]);

      const [contentJson, platformsJson, genresJson] = await Promise.all([
        contentRes.json(),
        platformsRes.json(),
        genresRes.json()
      ]);

      if (contentJson.success && contentJson.data) {
        const item = contentJson.data;
        const mappedTranslations = (item.translations || []).map((t: any) => ({
          id: t.id,
          lang: t.language || t.lang,
          title: t.title,
          description: t.description || t.synopsis
        }));
        
        setData({
          ...item,
          translations: mappedTranslations.length > 0 ? mappedTranslations : [{ lang: 'es', title: '', description: '' }],
          platforms: item.platform ? [item.platform] : [],
          categories: (item.genres || []).map((g: any) => g.genre),
          videoFiles: item.videoFiles,
          thumbnails: item.thumbnails || []
        });
      }

      setAllPlatforms(platformsJson.data || []);
      setAllGenres(genresJson.data || []);

    } catch (err) {
      console.error(err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const payload = {
        type: data.type,
        status: data.status,
        releaseYear: Number(data.releaseYear),
        duration: Number(data.duration),
        rating: data.rating ? Number(data.rating) : undefined,
        featured: data.featured,
        platformId: data.platforms[0]?.id || null,
        genreIds: data.categories.map(c => c.id),
        translations: data.translations.map(t => ({
          language: t.lang,
          title: t.title,
          description: t.description
        }))
      };

      const res = await adminFetch(API_ROUTES.CONTENT.UPDATE(id), {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
        await fetchData();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(json.message || json.error || 'Error al guardar');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const resolveImageUrl = (url?: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const backendUrl = new URL(apiUrl).origin;
      return `${backendUrl}${url}`;
    } catch (e) {
      return url;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'POSTER' | 'BACKDROP') => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingImage(type);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('contentId', id);
      fd.append('type', type);

      const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD + '/image', {
        method: 'POST',
        body: fd
      });

      const json = await res.json();
      if (res.ok && json.success) {
        // Update local state with new image URL
        setData(prev => {
          if (!prev) return null;
          const otherThumbs = prev.thumbnails?.filter((t: any) => t.type !== type) || [];
          return {
            ...prev,
            thumbnails: [...otherThumbs, { type, url: json.url }]
          };
        });
      } else {
        setError(json.error || 'Error al subir imagen');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al subir imagen');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data) return;

    setUploadingVideo(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('video', file);
      fd.append('contentId', id);

      const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD + '/video', {
        method: 'POST',
        body: fd
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        await fetchData(); // Refresh to see the new video record
      } else {
        setError(json.error || 'Error al subir video');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión al subir video');
    } finally {
      setUploadingVideo(false);
    }
  };

  const toggleGenre = (genre: { id: string; name: string }) => {
    if (!data) return;
    const exists = data.categories.find(c => c.id === genre.id);
    const newCategories = exists 
      ? data.categories.filter(c => c.id !== genre.id)
      : [...data.categories, genre];
    setData({ ...data, categories: newCategories });
  };

  const updateTranslation = (lang: string, field: string, value: string) => {
    if (!data) return;
    const newTranslations = data.translations.map(t => 
      t.lang === lang ? { ...t, [field]: value } : t
    );
    setData({ ...data, translations: newTranslations });
  };

  if (loading) return (
    <div className="adm-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--adm-muted)' }}>
        <Loader2 className="animate-spin mb-4" size={32} style={{ margin: '0 auto' }} />
        <p>Cargando información del contenido...</p>
      </div>
    </div>
  );

  if (error && !data) return (
    <div className="adm-page">
      <div className="adm-table-card" style={{ padding: '40px', textAlign: 'center' }}>
        <AlertCircle size={48} color="#f87171" style={{ margin: '0 auto 16px' }} />
        <h2 className="adm-page-title">{error}</h2>
        <button onClick={() => router.back()} className="adm-btn adm-btn--ghost mt-4">
          <ChevronLeft size={16} /> Volver
        </button>
      </div>
    </div>
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} className="adm-icon-btn" title="Volver">
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="adm-page-title">Editar Contenido</h1>
            <p className="adm-page-subtitle">ID: {id}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            className="adm-btn adm-btn--primary" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {success && (
        <div style={{ 
          background: 'rgba(74, 222, 128, .1)', 
          border: '1px solid rgba(74, 222, 128, .3)',
          color: '#86efac',
          padding: '12px 16px',
          borderRadius: '12px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={18} />
          Contenido actualizado correctamente
        </div>
      )}

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
                <label>Tipo de Contenido</label>
                <select 
                  className="adm-select" 
                  value={data?.type}
                  onChange={e => setData(d => d ? { ...d, type: e.target.value } : null)}
                >
                  <option value="MOVIE">Película</option>
                  <option value="SERIES">Serie</option>
                  <option value="ANIME">Anime</option>
                  <option value="DOCUMENTARY">Documental</option>
                </select>
              </div>
              <div className="adm-form-row">
                <label>Estado</label>
                <select 
                  className="adm-select" 
                  value={data?.status}
                  onChange={e => setData(d => d ? { ...d, status: e.target.value } : null)}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="PENDING">Pendiente</option>
                  <option value="READY">Listo</option>
                  <option value="ERROR">Error</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <div className="adm-form-row">
                <label>Año</label>
                <input 
                  type="number"
                  className="adm-input"
                  value={data?.releaseYear || ''}
                  onChange={e => setData(d => d ? { ...d, releaseYear: parseInt(e.target.value) } : null)}
                />
              </div>
              <div className="adm-form-row">
                <label>Duración (min)</label>
                <input 
                  type="number"
                  className="adm-input"
                  value={data?.duration || ''}
                  onChange={e => setData(d => d ? { ...d, duration: parseInt(e.target.value) } : null)}
                />
              </div>
              <div className="adm-form-row">
                <label>Rating (0-10)</label>
                <input 
                  type="number" step="0.1" max="10" min="0"
                  className="adm-input"
                  value={data?.rating || ''}
                  onChange={e => setData(d => d ? { ...d, rating: parseFloat(e.target.value) } : null)}
                />
              </div>
            </div>
            
            <div className="adm-toggle-row" style={{ marginTop: 8 }}>
              <span>Contenido Destacado</span>
              <div 
                className={`adm-toggle ${data?.featured ? 'adm-toggle--on' : ''}`} 
                onClick={() => setData(d => d ? { ...d, featured: !d.featured } : null)}
              />
            </div>
          </div>
        </div>

        {/* Imágenes y Multimedia */}
        <div className="adm-settings-section">
          <div className="adm-settings-section-header">
            <ImageIcon className="adm-settings-icon" size={18} />
            <h2>Imágenes y Portadas</h2>
          </div>
          <div className="adm-settings-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Poster Upload */}
              <div className="adm-form-row">
                <label>Póster Vertical</label>
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '2/3', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}>
                    {data?.thumbnails?.find(t => t.type === 'POSTER')?.url ? (
                      <img 
                        src={resolveImageUrl(data.thumbnails.find(t => t.type === 'POSTER')?.url) || ''} 
                        alt="Poster" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                        onClick={() => setPreviewImage(resolveImageUrl(data.thumbnails?.find(t => t.type === 'POSTER')?.url) || null)}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--adm-muted)' }}>
                        <ImageIcon size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                        <p style={{ fontSize: '.7rem' }}>Sin Póster</p>
                      </div>
                    )}
                    
                    {uploadingImage === 'POSTER' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <label 
                      className="adm-btn adm-btn--ghost adm-btn--sm" 
                      style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <UploadCloud size={14} /> {data?.thumbnails?.find(t => t.type === 'POSTER') ? 'Cambiar' : 'Subir'}
                      <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e, 'POSTER')} />
                    </label>
                    {data?.thumbnails?.find(t => t.type === 'POSTER') && (
                      <button 
                        className="adm-icon-btn adm-icon-btn--danger"
                        onClick={() => setData(prev => ({ ...prev!, thumbnails: prev!.thumbnails?.filter(t => t.type !== 'POSTER') }))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Backdrop Upload */}
              <div className="adm-form-row">
                <label>Banner Horizontal</label>
                <div style={{ position: 'relative', marginTop: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    aspectRatio: '16/9', 
                    background: 'rgba(255,255,255,0.03)', 
                    borderRadius: 12,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    position: 'relative'
                  }}>
                    {data?.thumbnails?.find(t => t.type === 'BACKDROP')?.url ? (
                      <img 
                        src={resolveImageUrl(data.thumbnails.find(t => t.type === 'BACKDROP')?.url) || ''} 
                        alt="Backdrop" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'zoom-in' }} 
                        onClick={() => setPreviewImage(resolveImageUrl(data.thumbnails?.find(t => t.type === 'BACKDROP')?.url) || null)}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--adm-muted)' }}>
                        <ImageIcon size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                        <p style={{ fontSize: '.7rem' }}>Sin Banner</p>
                      </div>
                    )}

                    {uploadingImage === 'BACKDROP' && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <label 
                      className="adm-btn adm-btn--ghost adm-btn--sm" 
                      style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <UploadCloud size={14} /> {data?.thumbnails?.find(t => t.type === 'BACKDROP') ? 'Cambiar' : 'Subir'}
                      <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e, 'BACKDROP')} />
                    </label>
                    {data?.thumbnails?.find(t => t.type === 'BACKDROP') && (
                      <button 
                        className="adm-icon-btn adm-icon-btn--danger"
                        onClick={() => setData(prev => ({ ...prev!, thumbnails: prev!.thumbnails?.filter(t => t.type !== 'BACKDROP') }))}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
                value={data?.platforms[0]?.id || ''}
                onChange={e => {
                  const p = allPlatforms.find(x => x.id === e.target.value);
                  setData(d => d ? { ...d, platforms: p ? [p] : [] } : null);
                }}
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
                  const isActive = data?.categories.some(c => c.id === g.id);
                  return (
                    <button 
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g)}
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

        {/* Videos */}
        <div className="adm-settings-section">
          <div className="adm-settings-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play className="adm-settings-icon" size={18} />
              <h2>Archivos de Video</h2>
            </div>
            <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ cursor: 'pointer' }}>
              {uploadingVideo ? <Loader2 size={12} className="animate-spin" /> : <UploadCloud size={12} />}
              {uploadingVideo ? 'Subiendo...' : 'Añadir Video'}
              <input type="file" accept="video/*" hidden onChange={handleVideoUpload} disabled={uploadingVideo} />
            </label>
          </div>
          <div className="adm-settings-body">
            {!data?.videoFiles || data.videoFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
                <AlertTriangle size={24} style={{ color: 'var(--adm-muted)', marginBottom: 8, margin: '0 auto' }} />
                <p style={{ fontSize: '.85rem', color: 'var(--adm-muted)' }}>No hay videos asociados.</p>
                <Link href="/admin/upload" className="adm-btn adm-btn--ghost adm-btn--sm mt-3" style={{ fontSize: '.75rem' }}>
                  Ir a Subidas
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.videoFiles.map(video => (
                  <div key={video.id} style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '12px', 
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ 
                        width: 32, height: 32, borderRadius: 8, 
                        background: video.status === 'COMPLETED' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: video.status === 'COMPLETED' ? '#4ade80' : '#a78bfa'
                      }}>
                        {video.status === 'COMPLETED' ? <Check size={16} /> : <Clock size={16} className={video.status === 'PROCESSING' ? 'animate-spin' : ''} />}
                      </div>
                      <div>
                        <p style={{ fontSize: '.85rem', fontWeight: 600, color: 'white' }}>
                          {video.type || 'Archivo de Video'} {video.resolution ? `- ${video.resolution}` : ''}
                        </p>
                        <p style={{ fontSize: '.75rem', color: 'var(--adm-muted)' }}>
                          {video.status === 'COMPLETED' ? 'Procesamiento finalizado' : `Estado: ${video.status}`}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {video.status === 'COMPLETED' && (
                        <Link 
                          href={`/watch/${id}${video.episodeId ? `?episode=${video.episodeId}` : ''}`}
                          target="_blank"
                          className="adm-btn adm-btn--ghost adm-btn--sm"
                          style={{ fontSize: '.7rem', padding: '4px 8px' }}
                        >
                          <Play size={12} fill="currentColor" /> Ver
                        </Link>
                      )}
                      <span className={`adm-badge ${video.status === 'COMPLETED' ? 'adm-badge--green' : 'adm-badge--blue'}`} style={{ fontSize: '.7rem' }}>
                        {video.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Traducciones (Español por defecto) */}
        <div className="adm-settings-section" style={{ gridColumn: 'span 2' }}>
          <div className="adm-settings-section-header">
            <Languages className="adm-settings-icon" size={18} />
            <h2>Textos (Español)</h2>
          </div>
          <div className="adm-settings-body">
            <div className="adm-form-row">
              <label>Título</label>
              <input 
                type="text" 
                className="adm-input"
                value={data?.translations.find(t => t.lang === 'es')?.title || ''}
                onChange={e => updateTranslation('es', 'title', e.target.value)}
              />
            </div>
            <div className="adm-form-row">
              <label>Sinopsis</label>
              <textarea 
                className="adm-input" 
                rows={5}
                style={{ resize: 'vertical' }}
                value={data?.translations.find(t => t.lang === 'es')?.description || ''}
                onChange={e => updateTranslation('es', 'description', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, zIndex: 1000, 
            background: 'rgba(0,0,0,0.9)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 40, cursor: 'zoom-out'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 12, boxShadow: '0 0 50px rgba(0,0,0,0.5)' }} 
          />
          <button 
            style={{ position: 'absolute', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}
          >
            <ChevronLeft size={24} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </div>
      )}
    </div>
  );
}
