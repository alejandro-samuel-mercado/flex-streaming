'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Save, Trash2, Film, Image as ImageIcon,
    Languages, Layout, Loader2, CheckCircle2, AlertCircle,
    Play, Clock, AlertTriangle, Check,
    Link, UploadCloud,
    X, MessageSquare,
    Import,
    Headphones
} from 'lucide-react';
import { API_ROUTES, API_ORIGIN } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';
import VideoPlayer from '@/components/video/VideoPlayer';
import { createPortal } from 'react-dom';
import TMDBSuggestions from '@/components/admin/TMDBSuggestions';

interface Translation {
    id?: string;
    lang: string;
    title: string;
    description: string;
    tagline?: string;
}

interface ContentData {
    id: string;
    type: string;
    status: string;
    releaseYear?: number;
    originalTitle?: string;
    duration?: number;
    rating?: number;
    featured?: boolean;
    trailerUrl?: string | null;
    originalLanguage?: string;
    budget?: number;
    revenue?: number;
    isAdult?: boolean;
    isFreeWithMembership?: boolean;
    translations: Translation[];
    platforms: { id: string; name: string }[];
    categories: { id: string; name: string }[];
    tags?: { id: string; name: string }[];
    actors?: { actor: { id: string; name: string; photoUrl?: string }; character?: string }[];
    directors?: { director: { id: string; name: string; photoUrl?: string } }[];
    videoFiles?: {
        id: string;
        status: string;
        type: string;
        resolution?: string;
        masterPlaylist?: string;
        episodeId?: string;
        qualities: { resolution: string }[];
        audioTracks?: {
            id: string;
            language: string;
            label: string;
            trackIndex: number;
        }[];
        subtitleTracks?: {
            id: string;
            language: string;
            label: string;
            url: string;
        }[];
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
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [activeVideo, setActiveVideo] = useState<{ url: string, title: string } | null>(null);
    const [trailerFile, setTrailerFile] = useState<File | null>(null);
    const [uploadingSubtitle, setUploadingSubtitle] = useState<string | null>(null); // videoFileId

    const [data, setData] = useState<ContentData | null>(null);
    const [allPlatforms, setAllPlatforms] = useState<{ id: string; name: string }[]>([]);
    const [allGenres, setAllGenres] = useState<{ id: string; name: string }[]>([]);
    const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [contentRes, platformsRes, genresRes, tagsRes] = await Promise.all([
                adminFetch(API_ROUTES.CONTENT.DETAIL(id)),
                adminFetch(API_ROUTES.PLATFORMS.LIST),
                adminFetch(API_ROUTES.CATEGORIES.GENRES),
                adminFetch(API_ROUTES.CATEGORIES.TAGS)
            ]);

            const [contentJson, platformsJson, genresJson, tagsJson] = await Promise.all([
                contentRes.json(),
                platformsRes.json(),
                genresRes.json(),
                tagsRes.json()
            ]);

            if (contentJson.success && contentJson.data) {
                const item = contentJson.data;
                console.log('[DEBUG] Video Files received:', item.videoFiles);

                const mappedTranslations = (item.translations || []).map((t: any) => ({
                    id: t.id,
                    lang: t.language || t.lang,
                    title: t.title,
                    description: t.description || t.synopsis || '',
                    tagline: t.tagline || ''
                }));

                setData({
                    ...item,
                    originalTitle: item.originalTitle || '',
                    translations: mappedTranslations.length > 0 ? mappedTranslations : [{ lang: 'es', title: '', description: '', tagline: '' }],
                    platforms: item.platform ? [item.platform] : [],
                    categories: (item.genres || []).map((g: any) => g.genre),
                    tags: (item.tags || []).map((t: any) => t.tag),
                    actors: item.actors || [],
                    directors: item.directors || [],
                    videoFiles: item.videoFiles,
                    thumbnails: item.thumbnails || [],
                    originalLanguage: item.originalLanguage || '',
                    budget: item.budget ? Number(item.budget) : undefined,
                    revenue: item.revenue ? Number(item.revenue) : undefined,
                    isAdult: item.isAdult || false,
                    isFreeWithMembership: item.isFreeWithMembership ?? true,
                });

            }

            setAllPlatforms(platformsJson.data || []);
            setAllGenres(genresJson.data || []);
            setAllTags(tagsJson.data || []);

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
                trailerUrl: data.trailerUrl,
                originalLanguage: data.originalLanguage || null,
                originalTitle: data.originalTitle?.trim() || null,
                budget: data.budget ? data.budget : null,
                revenue: data.revenue ? data.revenue : null,
                isAdult: data.isAdult || false,
                isFreeWithMembership: data.isFreeWithMembership,
                genreIds: data.categories.map(c => c.id),
                tagIds: data.tags?.map(t => t.id) || [],
                translations: data.translations.map(t => ({
                    language: t.lang,
                    title: t.title,
                    description: t.description,
                    tagline: t.tagline
                }))
            };

            const res = await adminFetch(API_ROUTES.CONTENT.UPDATE(id), {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            const json = await res.json();
            if (res.ok && json.success) {
                // Upload local trailer if selected
                if (trailerFile) {
                    const uploadFd = new FormData();
                    uploadFd.append('video', trailerFile);
                    uploadFd.append('contentId', id as string);
                    uploadFd.append('type', 'TRAILER');

                    const token = localStorage.getItem('adminToken');
                    const uploadRes = await fetch(API_ROUTES.ADMIN.UPLOAD.BASE, {
                        method: 'POST',
                        headers: {
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: uploadFd
                    });

                    if (!uploadRes.ok) {
                        console.error('Error uploading trailer', await uploadRes.json());
                    } else {
                        setTrailerFile(null);
                    }
                }

                setSuccess(true);
                await fetchData(true);
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
        return `${API_ORIGIN}${url}`;
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

            const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.BASE + '/image', {
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

    const handleUploadSubtitle = async (videoFileId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const language = prompt('Ingresa el código de idioma (ej: es, en, pt):', 'es');
        if (!language) return;
        const label = prompt('Ingresa la etiqueta (ej: Español, Inglés):', 'Español');
        if (!label) return;

        setUploadingSubtitle(videoFileId);
        const formData = new FormData();
        formData.append('subtitle', file);
        formData.append('videoFileId', videoFileId);
        formData.append('language', language);
        formData.append('label', label);

        try {
            const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.SUBTITLE, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                fetchData();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo subir el subtítulo'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        } finally {
            setUploadingSubtitle(null);
        }
    };

    const handleDeleteSubtitle = async (subtitleId: string) => {
        if (!confirm('¿Eliminar este subtítulo?')) return;
        try {
            const res = await adminFetch(API_ROUTES.ADMIN.UPLOAD.DELETE_SUBTITLE(subtitleId), { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteVideo = async (videoId: string) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar este archivo de video?')) return;

        try {
            const res = await adminFetch(`${API_ROUTES.ADMIN.UPLOAD.BASE}/video/${videoId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
                await fetchData();
            } else {
                const json = await res.json();
                setError(json.error || 'Error al eliminar video');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
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

    const toggleTag = (tag: { id: string; name: string }) => {
        if (!data) return;
        const currentTags = data.tags || [];
        const exists = currentTags.find(t => t.id === tag.id);
        const newTags = exists
            ? currentTags.filter(t => t.id !== tag.id)
            : [...currentTags, tag];
        setData({ ...data, tags: newTags });
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

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24 }}>
                {/* COLUMNA IZQUIERDA: Textos, Imágenes, Archivos de Video */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* TMDB Suggestions for incomplete content */}
                    {data && data.status === 'PENDING' && (
                        !data.translations.find(t => t.lang === 'es')?.description ||
                        !data.thumbnails?.find(t => t.type === 'POSTER')
                    ) && (
                            <TMDBSuggestions
                                title={data.translations.find(t => t.lang === 'es')?.title || ''}
                                contentId={id}
                                onApplied={() => fetchData()}
                            />
                        )}

                    {/* Textos (Español) */}
                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Languages className="adm-settings-icon" size={18} />
                            <h2>Textos Principales</h2>
                        </div>
                        <div className="adm-settings-body">
                            <div className="adm-form-row">
                                <label>Título (Español)</label>
                                <input
                                    type="text"
                                    className="adm-input"
                                    value={data?.translations.find(t => t.lang === 'es')?.title || ''}
                                    onChange={e => updateTranslation('es', 'title', e.target.value)}
                                />
                            </div>
                            <div className="adm-form-row">
                                <label>Título Original</label>
                                <input
                                    type="text"
                                    className="adm-input"
                                    value={data?.originalTitle || ''}
                                    onChange={e => setData(d => d ? { ...d, originalTitle: e.target.value } : null)}
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
                            <div className="adm-form-row" style={{ marginTop: 16 }}>
                                <label>URL del Tráiler o Archivo Local</label>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <input
                                        type="text"
                                        className="adm-input"
                                        placeholder="Ej: https://youtube.com/watch?v=..."
                                        value={data?.trailerUrl || ''}
                                        onChange={e => setData(d => d ? { ...d, trailerUrl: e.target.value } : null)}
                                        disabled={!!trailerFile}
                                        style={{ flex: 1, opacity: trailerFile ? 0.5 : 1 }}
                                    />
                                    <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>o</span>
                                    <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                        <Import size={16} style={{ marginRight: 6 }} />
                                        {trailerFile ? 'Cambiar' : 'Subir'}
                                        <input
                                            type="file"
                                            accept="video/*"
                                            hidden
                                            onChange={(e) => {
                                                if (e.target.files && e.target.files[0]) {
                                                    setTrailerFile(e.target.files[0]);
                                                    setData(d => d ? { ...d, trailerUrl: '' } : null);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                {trailerFile && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <CheckCircle2 size={14} /> Archivo: {trailerFile.name}
                                    </div>
                                )}
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
                                            <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                                                <UploadCloud size={14} /> Subir
                                                <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e, 'POSTER')} />
                                            </label>
                                            {data?.thumbnails?.find(t => t.type === 'POSTER') && (
                                                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setData(prev => ({ ...prev!, thumbnails: prev!.thumbnails?.filter(t => t.type !== 'POSTER') }))}>
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
                                            <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ flex: 1, justifyContent: 'center', cursor: 'pointer' }}>
                                                <UploadCloud size={14} /> Subir
                                                <input type="file" accept="image/*" hidden onChange={e => handleImageUpload(e, 'BACKDROP')} />
                                            </label>
                                            {data?.thumbnails?.find(t => t.type === 'BACKDROP') && (
                                                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => setData(prev => ({ ...prev!, thumbnails: prev!.thumbnails?.filter(t => t.type !== 'BACKDROP') }))}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Archivos de Video */}
                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Play className="adm-settings-icon" size={18} />
                            <h2>Archivos de Video</h2>
                        </div>
                        <div className="adm-settings-body">
                            {/* Embedded Player Overlay */}
                            {activeVideo && typeof window !== 'undefined' && createPortal(
                                <div style={{ position: 'fixed', inset: 0, zIndex: 999999, background: 'black' }}>
                                    <button
                                        onClick={() => setActiveVideo(null)}
                                        style={{
                                            position: 'absolute', top: 20, right: 20, zIndex: 9999999,
                                            background: 'rgba(229, 9, 20, 0.8)', color: 'white',
                                            border: 'none', borderRadius: '8px', padding: '8px 16px',
                                            fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '8px'
                                        }}
                                    >
                                        <X size={20} /> CERRAR VISTA PREVIA
                                    </button>
                                    <VideoPlayer
                                        src={activeVideo.url}
                                        title={activeVideo.title}
                                        poster={resolveImageUrl(data?.thumbnails?.find(t => t.type === 'BACKDROP')?.url) || undefined}
                                    />
                                </div>,
                                document.body
                            )}

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
                                    {data.videoFiles.map((video, idx) => (
                                        <div key={video.id || idx} style={{
                                            background: 'rgba(255,255,255,0.03)', padding: '16px',
                                            borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <div style={{
                                                        width: 40, height: 40, borderRadius: 10,
                                                        background: video.status === 'COMPLETED' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        color: video.status === 'COMPLETED' ? '#4ade80' : '#a78bfa'
                                                    }}>
                                                        <Film size={20} />
                                                    </div>
                                                    <div>
                                                        <p style={{ fontSize: '.9rem', fontWeight: 700, color: 'white' }}>
                                                            {video.type || 'Archivo de Video'}
                                                            <span style={{ marginLeft: 8, fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 400 }}>ID: {video.id}</span>
                                                        </p>
                                                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                                            <span className={`adm-badge ${video.status === 'COMPLETED' ? 'adm-badge--green' : 'adm-badge--blue'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                                                {video.status}
                                                            </span>
                                                            {video.resolution && (
                                                                <span className="adm-badge adm-badge--gray" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                                                                    {video.resolution}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {video.status === 'COMPLETED' && video.masterPlaylist && (
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const token = localStorage.getItem('adminToken');
                                                                    const res = await fetch(API_ROUTES.STREAM.REQUEST_ACCESS, {
                                                                        method: 'POST',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                                                        },
                                                                        body: JSON.stringify({ contentId: id })
                                                                    });
                                                                    const resJson = await res.json();
                                                                    if (resJson.success) {
                                                                        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                                                                        const backendOrigin = new URL(apiUrl).origin;
                                                                        setActiveVideo({
                                                                            url: `${backendOrigin}${video.masterPlaylist}?token=${resJson.data.token}`,
                                                                            title: data?.translations.find(t => t.lang === 'es')?.title || 'Video'
                                                                        });
                                                                    } else {
                                                                        alert('Error al acceder al video: ' + (resJson.error || 'Token denegado'));
                                                                    }
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert('Error de conexión al obtener acceso al video.');
                                                                }
                                                            }}
                                                            className="adm-btn adm-btn--primary adm-btn--sm"
                                                            style={{ fontSize: '.75rem', padding: '6px 12px' }}
                                                        >
                                                            <Play size={14} fill="currentColor" /> Ver
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDeleteVideo(video.id)} className="adm-icon-btn adm-icon-btn--danger">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Audio Tracks */}
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 10, paddingTop: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <Headphones size={12} /> PISTAS DE AUDIO
                                                    </span>
                                                </div>
                                                {video.audioTracks && video.audioTracks.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        {video.audioTracks.map((audio: any) => (
                                                            <div key={audio.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                                <div style={{ color: 'white' }}>
                                                                    <span style={{ fontWeight: 700, color: '#facc15' }}>{audio.language.toUpperCase()}</span> - {audio.label}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No hay pistas de audio adicionales extraídas.</div>
                                                )}
                                            </div>

                                            {/* Subtitles */}
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 10, paddingTop: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', fontWeight: 600, display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        <MessageSquare size={12} /> SUBTÍTULOS
                                                    </span>
                                                    <label className="adm-btn adm-btn--gray adm-btn--sm" style={{ padding: '2px 8px', fontSize: '.7rem', cursor: 'pointer' }}>
                                                        {uploadingSubtitle === video.id ? <Loader2 className="animate-spin" size={12} /> : '+ Añadir'}
                                                        <input type="file" accept=".vtt,.srt" style={{ display: 'none' }} onChange={(e) => handleUploadSubtitle(video.id, e)} disabled={uploadingSubtitle === video.id} />
                                                    </label>
                                                </div>
                                                {video.subtitleTracks && video.subtitleTracks.length > 0 ? (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        {video.subtitleTracks.map((sub: any) => (
                                                            <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                                                                <div style={{ color: 'white' }}><span style={{ fontWeight: 700, color: 'var(--adm-primary)' }}>{sub.language.toUpperCase()}</span> - {sub.label}</div>
                                                                <button onClick={() => handleDeleteSubtitle(sub.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}><X size={12} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic' }}>No hay subtítulos externos.</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DERECHA: Configuración Técnica y Metadatos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Film className="adm-settings-icon" size={18} />
                            <h2>Clasificación</h2>
                        </div>
                        <div className="adm-settings-body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div className="adm-form-row">
                                    <label>Tipo</label>
                                    <select className="adm-select" value={data?.type} onChange={e => setData(d => d ? { ...d, type: e.target.value } : null)}>
                                        <option value="MOVIE">Película</option>
                                        <option value="SERIES">Serie</option>
                                        <option value="ANIME">Anime</option>
                                        <option value="ANIMATION">Animación</option>
                                        <option value="DOCUMENTARY">Documental</option>
                                        <option value="BIOGRAPHY">Biografía</option>
                                        <option value="REALITY_SHOW">Reality Show</option>
                                        <option value="TALK_SHOW">Talk Show</option>
                                        <option value="VARIETY_SHOW">Variedad</option>
                                        <option value="STAND_UP">Stand-up</option>
                                        <option value="SPECIAL">Especial</option>
                                        <option value="EDUCATIONAL">Educativo</option>
                                        <option value="KIDS">Infantil</option>
                                        <option value="FAMILY">Familiar</option>
                                        <option value="INTERACTIVE">Interactivo</option>
                                        <option value="EXPERIMENTAL">Experimental</option>
                                        <option value="DOCUDRAMA">Docudrama</option>
                                        <option value="NOVELA">Telenovela</option>
                                        <option value="SHORT">Cortometraje</option>
                                    </select>
                                </div>
                                <div className="adm-form-row">
                                    <label>Estado</label>
                                    <select className="adm-select" value={data?.status} onChange={e => setData(d => d ? { ...d, status: e.target.value } : null)}>
                                        <option value="ACTIVE">Activo</option>
                                        <option value="PENDING">Pendiente</option>
                                        <option value="READY">Listo</option>
                                        <option value="ERROR">Error</option>
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div className="adm-form-row">
                                    <label>Año</label>
                                    <input type="number" className="adm-input" value={data?.releaseYear || ''} onChange={e => setData(d => d ? { ...d, releaseYear: parseInt(e.target.value) } : null)} />
                                </div>
                                <div className="adm-form-row">
                                    <label>Duración</label>
                                    <input type="number" className="adm-input" value={data?.duration || ''} onChange={e => setData(d => d ? { ...d, duration: parseInt(e.target.value) } : null)} />
                                </div>
                                <div className="adm-form-row">
                                    <label>Rating</label>
                                    <input type="number" step="0.1" max="10" min="0" className="adm-input" value={data?.rating || ''} onChange={e => setData(d => d ? { ...d, rating: parseFloat(e.target.value) } : null)} />
                                </div>
                            </div>

                            <div className="adm-form-row" style={{ marginTop: 16 }}>
                                <label>Plataforma principal</label>
                                <select className="adm-select" value={data?.platforms[0]?.id || ''} onChange={e => {
                                    const p = allPlatforms.find(x => x.id === e.target.value);
                                    setData(d => d ? { ...d, platforms: p ? [p] : [] } : null);
                                }}>
                                    <option value="">Ninguna</option>
                                    {allPlatforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div className="adm-form-row" style={{ marginTop: 16 }}>
                                <label>Géneros</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {allGenres.map(g => {
                                        const isActive = data?.categories.some(c => c.id === g.id);
                                        return (
                                            <button key={g.id} type="button" onClick={() => toggleGenre(g)} className={`adm-badge ${isActive ? 'adm-badge--purple' : 'adm-badge--gray'}`} style={{ cursor: 'pointer', border: 'none' }}>
                                                {g.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="adm-form-row" style={{ marginTop: 16 }}>
                                <label>Etiquetas</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                    {allTags.map(t => {
                                        const isActive = data?.tags?.some(tag => tag.id === t.id);
                                        return (
                                            <button key={t.id} type="button" onClick={() => toggleTag(t)} className={`adm-badge ${isActive ? 'adm-badge--blue' : 'adm-badge--gray'}`} style={{ cursor: 'pointer', border: 'none' }}>
                                                #{t.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Layout className="adm-settings-icon" size={18} />
                            <h2>Visibilidad</h2>
                        </div>
                        <div className="adm-settings-body">
                            <div className="adm-toggle-row">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span>Contenido recomendado/destacado</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Aparece en los recomendados del inicio (si no hay IDs fijos) y en filtros especiales.</span>
                                </div>
                                <div className={`adm-toggle ${data?.featured ? 'adm-toggle--on' : ''}`} onClick={() => setData(d => d ? { ...d, featured: !d.featured } : null)} />
                            </div>
                            <div className="adm-toggle-row" style={{ marginTop: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span>Contenido para Adultos</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Añade el indicativo +18 visible en la ficha de contenido.</span>
                                </div>
                                <div className={`adm-toggle ${data?.isAdult ? 'adm-toggle--on' : ''}`} onClick={() => setData(d => d ? { ...d, isAdult: !d.isAdult } : null)} />
                            </div>
                            <div className="adm-toggle-row" style={{ marginTop: 12 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <span>Contenido Gratuito</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Se puede ver sin tener plan activo. Se resalta en el inicio SOLO para usuarios no suscritos o deslogueados.</span>
                                </div>
                                <div className={`adm-toggle ${!data?.isFreeWithMembership ? 'adm-toggle--on' : ''}`} onClick={() => setData(d => d ? { ...d, isFreeWithMembership: !d.isFreeWithMembership } : null)} />
                            </div>
                        </div>
                    </div>

                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Languages className="adm-settings-icon" size={18} />
                            <h2>Metadatos Financieros</h2>
                        </div>
                        <div className="adm-settings-body">
                            <div className="adm-form-row">
                                <label>Idioma Original</label>
                                <input type="text" className="adm-input" placeholder="ej: en, es, ja" value={data?.originalLanguage || ''} onChange={e => setData(d => d ? { ...d, originalLanguage: e.target.value } : null)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                                <div className="adm-form-row">
                                    <label>Presupuesto (USD)</label>
                                    <input type="number" className="adm-input" placeholder="0" value={data?.budget || ''} onChange={e => setData(d => d ? { ...d, budget: parseInt(e.target.value) || 0 } : null)} />
                                </div>
                                <div className="adm-form-row">
                                    <label>Ingresos (USD)</label>
                                    <input type="number" className="adm-input" placeholder="0" value={data?.revenue || ''} onChange={e => setData(d => d ? { ...d, revenue: parseInt(e.target.value) || 0 } : null)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {(data?.directors && data.directors.length > 0 || data?.actors && data.actors.length > 0) && (
                        <div className="adm-settings-section">
                            <div className="adm-settings-section-header">
                                <Film className="adm-settings-icon" size={18} />
                                <h2>Reparto y Equipo</h2>
                            </div>
                            <div className="adm-settings-body">
                                {data?.directors && data.directors.length > 0 && (
                                    <div>
                                        <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--adm-muted)', marginBottom: 8, fontWeight: 600 }}>Director(es)</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            {data.directors.map((d: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', padding: '6px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                                                    {d.director.photoUrl && <img src={d.director.photoUrl} alt={d.director.name} style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                                                    <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'white' }}>{d.director.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {data?.actors && data.actors.length > 0 && (
                                    <div style={{ marginTop: 16 }}>
                                        <label style={{ display: 'block', fontSize: '.75rem', color: 'var(--adm-muted)', marginBottom: 8, fontWeight: 600 }}>Reparto principal ({data.actors.length})</label>
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {data.actors.map((a: any, i: number) => (
                                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', padding: '4px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', fontSize: '.75rem' }}>
                                                    {a.actor.photoUrl && <img src={a.actor.photoUrl} alt={a.actor.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />}
                                                    <span style={{ fontWeight: 600, color: 'white' }}>{a.actor.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
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
