'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Film, ArrowLeft, Loader2, Save, Languages,
    Layout, CheckCircle2, AlertCircle, Plus, Import
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';
import TMDBImport from '@/components/admin/TMDBImport';

export default function NewContentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTMDB, setShowTMDB] = useState(false);
    const [trailerFile, setTrailerFile] = useState<File | null>(null);

    const [allPlatforms, setAllPlatforms] = useState<{ id: string; name: string }[]>([]);
    const [allGenres, setAllGenres] = useState<{ id: string; name: string }[]>([]);
    const [allTags, setAllTags] = useState<{ id: string; name: string }[]>([]);

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
        trailerUrl: '',
        posterPath: '',
        backdropPath: '',
        genreIds: [] as string[],
        tagIds: [] as string[],
        budget: 0,
        revenue: 0,
        isAdult: false,
        originalLanguage: '',
        actors: [] as any[],
        directors: [] as any[],
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

            const [platformsRes, genresRes, tagsRes] = await Promise.all([
                fetch(API_ROUTES.PLATFORMS.LIST, { headers }),
                fetch(API_ROUTES.CATEGORIES.GENRES, { headers }),
                fetch(API_ROUTES.CATEGORIES.TAGS, { headers })
            ]);

            const [platformsJson, genresJson, tagsJson] = await Promise.all([
                platformsRes.json(),
                genresRes.json(),
                tagsRes.json()
            ]);

            setAllPlatforms(platformsJson.data || []);
            setAllGenres(genresJson.data || []);
            setAllTags(tagsJson.data || []);
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

    const handleTMDBImport = (data: any) => {
        setFormData(prev => ({
            ...prev,
            title: data.title,
            originalTitle: data.originalTitle,
            synopsis: data.synopsis,
            type: data.type,
            releaseYear: data.releaseYear,
            duration: data.duration,
            rating: data.rating,
            posterPath: data.posterPath,
            backdropPath: data.backdropPath,
            budget: data.budget,
            revenue: data.revenue,
            isAdult: data.isAdult,
            originalLanguage: data.originalLanguage,
            actors: data.actors,
            directors: data.directors,
        }));
    };

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
            trailerUrl: formData.trailerUrl,
            genreIds: formData.genreIds,
            tagIds: formData.tagIds,
            posterPath: formData.posterPath,
            backdropPath: formData.backdropPath,
            budget: formData.budget,
            revenue: formData.revenue,
            isAdult: formData.isAdult,
            originalLanguage: formData.originalLanguage,
            actors: formData.actors,
            directors: formData.directors,
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
            
            const resultJson = await res.json();
            const newContentId = resultJson.data.id;

            // Upload local trailer if selected
            if (trailerFile) {
                const uploadFd = new FormData();
                uploadFd.append('video', trailerFile);
                uploadFd.append('contentId', newContentId);
                uploadFd.append('type', 'TRAILER');

                const uploadRes = await fetch(API_ROUTES.ADMIN.UPLOAD.BASE, {
                    method: 'POST',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: uploadFd
                });

                if (!uploadRes.ok) {
                    console.error('Error uploading trailer', await uploadRes.json());
                    // We still push to the list because content was created
                }
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

    const toggleTag = (id: string) => {
        setFormData(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(id)
                ? prev.tagIds.filter(x => x !== id)
                : [...prev.tagIds, id]
        }));
    };

    if (loading && allPlatforms.length === 0) return (
        <div className="adm-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--adm-muted)' }} />
        </div>
    );

    return (
        <div className="adm-page">
            <div className="adm-header ">
                <div className="adm-header-content ">

                    <div className="adm-header-actions">
                        <button
                            type="button"
                            className="adm-btn adm-btn--secondary"
                            onClick={() => setShowTMDB(true)}
                            style={{ marginRight: 12, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                            <Import size={18} />
                            Importar de TMDB
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="adm-btn adm-btn--primary"
                            disabled={submitting}
                        >
                            {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Guardar Contenido
                        </button>
                    </div>
                </div>
            </div>

            {showTMDB && (
                <TMDBImport
                    onClose={() => setShowTMDB(false)}
                    onImport={handleTMDBImport}
                />
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
                                <label>Tipo de Contenido *</label>
                                <select
                                    className="adm-select"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
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

                        <div className="adm-form-row" style={{ marginTop: 16 }}>
                            <label>URL del Tráiler o Archivo Local</label>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="adm-input"
                                    placeholder="Ej: https://youtube.com/watch?v=..."
                                    value={formData.trailerUrl}
                                    onChange={e => setFormData({ ...formData, trailerUrl: e.target.value })}
                                    disabled={!!trailerFile}
                                    style={{ flex: 1, opacity: trailerFile ? 0.5 : 1 }}
                                />
                                <span style={{ color: 'var(--adm-muted)', fontSize: '0.8rem' }}>o</span>
                                <label className="adm-btn adm-btn--ghost adm-btn--sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                    <Import size={16} style={{ marginRight: 6 }} />
                                    {trailerFile ? 'Cambiar Archivo' : 'Subir Local'}
                                    <input 
                                        type="file" 
                                        accept="video/*" 
                                        hidden 
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) {
                                                setTrailerFile(e.target.files[0]);
                                                setFormData({ ...formData, trailerUrl: '' });
                                            }
                                        }} 
                                    />
                                </label>
                            </div>
                            {trailerFile && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <CheckCircle2 size={14} /> Archivo seleccionado: {trailerFile.name}
                                </div>
                            )}
                            <span style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginTop: 4, display: 'block' }}>
                                Acepta enlaces de YouTube, Vimeo o URLs directas a archivos .mp4. Si subes un archivo local, se procesará al guardar.
                            </span>
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
                        <div className="adm-form-row" style={{ marginTop: 12 }}>
                            <label>Etiquetas (Tags)</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                {allTags.map(t => {
                                    const isActive = formData.tagIds.includes(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => toggleTag(t.id)}
                                            className={`adm-badge ${isActive ? 'adm-badge--blue' : 'adm-badge--gray'}`}
                                            style={{ cursor: 'pointer', border: 'none' }}
                                        >
                                            #{t.name}
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
