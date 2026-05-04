'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Film, FolderSearch, AlertTriangle, ChevronLeft, ChevronRight, SortAsc, SortDesc, Calendar, Eye, Star, Hash } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/api-routes';
import { getContentTypeLabel } from '@/lib/content-types';

interface ContentItem {
    id: string;
    type: string;
    status: string;
    viewCount: number | string;
    rating: number | null;
    createdAt: string;
    slug: string;
    trailerUrl?: string | null;
    platform?: { name: string; logoUrl: string };
    translations?: { title: string; description?: string }[];
    genres?: { genre: { name: string } }[];
    videoFiles?: { status: string; qualities?: { resolution: string }[] }[];
    thumbnails?: { type: string; url: string }[];
}

const STATUS_CLASS: Record<string, string> = {
    ACTIVE: 'adm-badge adm-badge--green',
    READY: 'adm-badge adm-badge--green',
    PENDING: 'adm-badge adm-badge--yellow',
    PROCESSING: 'adm-badge adm-badge--blue',
    ERROR: 'adm-badge adm-badge--red',
};

// Types from schema update
const CONTENT_TYPES = [
    'MOVIE', 'SERIES', 'ANIME', 'ANIMATION', 'DOCUMENTARY',
    'BIOGRAPHY', 'REALITY_SHOW', 'TALK_SHOW', 'VARIETY_SHOW',
    'STAND_UP', 'SPECIAL', 'EDUCATIONAL', 'KIDS', 'FAMILY',
    'INTERACTIVE', 'EXPERIMENTAL', 'DOCUDRAMA', 'NOVELA'
];

export default function AdminContentPage() {
    const router = useRouter();

    // States for filters
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sort, setSort] = useState('recent');
    const [showIncomplete, setShowIncomplete] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 30;

    // Data
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [platforms, setPlatforms] = useState<any[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMetadata = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

            const [pRes, gRes] = await Promise.all([
                fetch(API_ROUTES.PLATFORMS.LIST, { headers }),
                fetch(API_ROUTES.CATEGORIES.GENRES, { headers })
            ]);

            const [pData, gData] = await Promise.all([pRes.json(), gRes.json()]);

            setPlatforms(pData.data || []);
            setGenres(gData.data || []);
        } catch (err) {
            console.error('Error fetching metadata:', err);
        }
    }, []);

    const fetchContents = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort,
            });

            if (search) params.append('search', search);
            if (filterType) params.append('type', filterType);
            if (filterPlatform) params.append('platformId', filterPlatform);
            if (filterGenre) params.append('genreId', filterGenre);
            if (filterStatus) params.append('status', filterStatus);
            if (showIncomplete) params.append('incomplete', 'true');

            const res = await fetch(`${API_ROUTES.CONTENT.LIST}?${params}`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            const d = await res.json();

            setContents(d.data ?? []);
            setTotalItems(d.pagination?.total || 0);
            setTotalPages(d.pagination?.totalPages || 1);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [page, sort, filterType, filterPlatform, filterStatus, search, showIncomplete]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    useEffect(() => {
        fetchContents();
    }, [fetchContents]);

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${title}"?\nEsta acción no se puede deshacer.`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(API_ROUTES.CONTENT.DELETE(id), {
                method: 'DELETE',
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.ok) {
                fetchContents();
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo eliminar'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        }
    };

    const toggleSort = () => {
        if (sort === 'az') setSort('za');
        else if (sort === 'za') setSort('recent');
        else setSort('az');
        setPage(1);
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Inventario de Contenido</h1>
                    <p className="adm-page-subtitle">Gestiona {totalItems} títulos en tu catálogo</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Link href="/admin/content/files" className="adm-btn adm-btn--ghost" style={{ gap: 6 }}>
                        <FolderSearch size={16} /> Archivos Crudos
                    </Link>
                    <Link href="/admin/content/new" className="adm-btn adm-btn--primary">
                        <Plus size={16} /> Nuevo Contenido
                    </Link>
                </div>
            </div>

            {/* Quick Filters - Type Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 8 }} className="no-scrollbar">
                <button
                    className={`adm-btn adm-btn--sm ${filterType === '' ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                    onClick={() => { setFilterType(''); setPage(1); }}
                >
                    Todos
                </button>
                {CONTENT_TYPES.slice(0, 8).map(t => (
                    <button
                        key={t}
                        className={`adm-btn adm-btn--sm ${filterType === t ? 'adm-btn--primary' : 'adm-btn--ghost'}`}
                        onClick={() => { setFilterType(t); setPage(1); }}
                    >
                        {getContentTypeLabel(t)}
                    </button>
                ))}
                {CONTENT_TYPES.length > 8 && (
                    <select
                        className="adm-select adm-select--sm"
                        style={{ width: 'auto' }}
                        value={CONTENT_TYPES.includes(filterType) && CONTENT_TYPES.indexOf(filterType) >= 8 ? filterType : ''}
                        onChange={e => { setFilterType(e.target.value); setPage(1); }}
                    >
                        <option value="">Más tipos...</option>
                        {CONTENT_TYPES.slice(8).map(t => <option key={t} value={t}>{getContentTypeLabel(t)}</option>)}
                    </select>
                )}
            </div>

            {/* Advanced Filters Toolbar */}
            <div className="adm-toolbar" style={{ display: 'flex', gap: 20 }}>
                <div className="adm-search-wrap" style={{ maxWidth: "500px" }}>
                    <Search size={15} className="adm-search-icon" />
                    <input
                        type="text" placeholder="Buscar por título..."
                        value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                        className="adm-search-input"
                    />
                </div>

                <select
                    className="adm-select"
                    value={filterPlatform}
                    onChange={e => { setFilterPlatform(e.target.value); setPage(1); }}
                    style={{ maxWidth: 120 }}>
                    <option value="">Plataformas</option>
                    {platforms.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <select
                    className="adm-select"
                    value={filterGenre} style={{ maxWidth: 120 }}
                    onChange={e => { setFilterGenre(e.target.value); setPage(1); }}
                >
                    <option value="">Categorías</option>
                    {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>

                <select
                    className="adm-select"
                    value={filterStatus}
                    style={{ maxWidth: 120 }}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                >
                    <option value="">Estados</option>
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="READY">LISTO</option>
                    <option value="PENDING">PENDIENTE</option>
                    <option value="PROCESSING">PROCESANDO</option>
                    <option value="ERROR">ERROR</option>
                </select>

                <button
                    className="adm-btn adm-btn--ghost"
                    title="Ordenar alfabéticamente"
                    onClick={toggleSort}
                    style={{ maxWidth: 120 }}
                >
                    {sort === 'az' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                    {sort === 'az' ? ' A-Z' : ' Z-A'}
                </button>

                <button
                    className={`adm-btn adm-btn--ghost${showIncomplete ? ' adm-btn--active' : ''}`}
                    onClick={() => { setShowIncomplete(!showIncomplete); setPage(1); }}
                    style={{ maxWidth: 120, ...(showIncomplete ? { background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.3)' } : {}) }}
                >
                    <AlertTriangle size={14} /> Incompletos
                </button>
            </div>

            <div className="adm-table-card">
                <table className="adm-table">
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>Poster</th>
                            <th>Título / Slug</th>
                            <th>Información</th>
                            <th>Métricas</th>
                            <th>Multimedia</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '60px' }}>
                                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--adm-primary)' }} />
                            </td></tr>
                        ) : contents.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>No se encontró contenido con los filtros aplicados.</td></tr>
                        ) : contents.map(item => {
                            const title = item.translations?.[0]?.title || 'Sin título';
                            const poster = item.thumbnails?.find(t => t.type === 'POSTER')?.url;

                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div style={{ width: 40, height: 56, borderRadius: 6, overflow: 'hidden', background: 'var(--adm-bg-alt)' }}>
                                            {poster ? <img src={poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Film size={16} style={{ margin: '20px auto', display: 'block', opacity: 0.2 }} />}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>{title}</span>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', marginTop: 2 }}>{item.slug}</code>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                                <span className="adm-badge adm-badge--gray" style={{ fontSize: '0.65rem' }}>{getContentTypeLabel(item.type)}</span>
                                                {item.platform && (
                                                    <span className="adm-badge" style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa' }}>
                                                        {item.platform.logoUrl && <img src={item.platform.logoUrl} alt="" style={{ width: 12, height: 12, objectFit: 'contain', display: 'inline-block', marginRight: 4 }} />}
                                                        {item.platform.name}
                                                    </span>
                                                )}
                                            </div>
                                            {item.genres && item.genres.length > 0 && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>
                                                    {item.genres.map(g => g.genre.name).join(', ')}
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--adm-muted)', fontSize: '0.75rem', marginTop: 2 }}>
                                                <Calendar size={12} /> {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                            <div title="Visualizaciones" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--adm-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                                <Eye size={14} /> {Number(item.viewCount).toLocaleString()} visitas
                                            </div>
                                            <div title="Calificación" style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#facc15', fontSize: '0.85rem' }}>
                                                <Star size={14} fill={item.rating ? '#facc15' : 'transparent'} /> {item.rating || 'S/N'}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {item.trailerUrl && (
                                                <span className="adm-badge" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: 'fit-content' }}>
                                                    ▶ Tráiler
                                                </span>
                                            )}
                                            {(item.videoFiles || []).map((v, i) => (
                                                <div key={i} title={`Video ${i + 1}: ${v.status}`} className="adm-badge" style={{
                                                    background: v.status === 'READY' || v.status === 'COMPLETED' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                                    color: v.status === 'READY' || v.status === 'COMPLETED' ? '#4ade80' : '#a78bfa',
                                                    width: 'fit-content'
                                                }}>
                                                    <Film size={11} className={v.status === 'PROCESSING' ? 'animate-spin' : ''} style={{ marginRight: 4 }} />
                                                    {v.qualities && v.qualities.length > 0 ? v.qualities[v.qualities.length - 1].resolution : 'Auto'}
                                                </div>
                                            ))}
                                            {(!item.videoFiles || item.videoFiles.length === 0) && !item.trailerUrl && <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Sin contenido multimedia</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={STATUS_CLASS[item.status] ?? 'adm-badge adm-badge--gray'}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="adm-table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <Link href={`/admin/content/${item.id}`} className="adm-icon-btn" title="Editar"><Edit2 size={14} /></Link>
                                            <button className="adm-icon-btn adm-icon-btn--danger" title="Eliminar" onClick={() => handleDelete(item.id, title)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="adm-table-footer" style={{ padding: '12px 20px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--adm-muted)' }}>Mostrando {contents.length} de {totalItems} elementos</span>
                    <div className="adm-pagination">
                        <button
                            className="adm-page-btn"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{page}</span>
                            <span style={{ fontSize: '0.9rem', color: 'var(--adm-muted)' }}>/ {totalPages}</span>
                        </div>
                        <button
                            className="adm-page-btn"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
