'use client';
import { adminFetch } from '@/lib/admin-api';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Loader2, Film, FolderSearch, AlertTriangle, ChevronLeft, ChevronRight, SortAsc, SortDesc, Calendar, Eye, Star, Hash, Download } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { getContentTypeLabel } from '@/lib/content-types';

interface ContentItem {
    id: string;
    type: string;
    status: string;
    viewCount: number | string;
    rating: number | null;
    createdAt: string;
    slug: string;
    originalTitle?: string | null;
    trailerUrl?: string | null;
    platform?: { name: string; logoUrl: string };
    translations?: { title: string; description?: string }[];
    genres?: { genre: { name: string } }[];
    videoFiles?: { status: string; qualities?: { resolution: string }[] }[];
    thumbnails?: { type: string; url: string }[];
    isPinned?: boolean;
    hasMissingFiles?: boolean;
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
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterPlatform, setFilterPlatform] = useState('');
    const [filterGenre, setFilterGenre] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [sort, setSort] = useState('recent');
    const [showIncomplete, setShowIncomplete] = useState(false);
    const [filterMissingFiles, setFilterMissingFiles] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const limit = 30;

    // Selection State
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<string>('');

    useEffect(() => {
        const saved = sessionStorage.getItem('admin_content_selected');
        if (saved) {
            try { setSelectedIds(JSON.parse(saved)); } catch (e) {}
        }

        // Restore filters
        setSearch(sessionStorage.getItem('ac_search') || '');
        setDebouncedSearch(sessionStorage.getItem('ac_search') || '');
        setFilterType(sessionStorage.getItem('ac_type') || '');
        setFilterPlatform(sessionStorage.getItem('ac_platform') || '');
        setFilterGenre(sessionStorage.getItem('ac_genre') || '');
        setFilterStatus(sessionStorage.getItem('ac_status') || '');
        setSort(sessionStorage.getItem('ac_sort') || 'recent');
        setShowIncomplete(sessionStorage.getItem('ac_incomplete') === 'true');
        setFilterMissingFiles(sessionStorage.getItem('ac_missing') === 'true');
        setPage(parseInt(sessionStorage.getItem('ac_page') || '1', 10));
        setIsInitialized(true);
    }, []);

    useEffect(() => {
        sessionStorage.setItem('admin_content_selected', JSON.stringify(selectedIds));
    }, [selectedIds]);

    useEffect(() => {
        if (!isInitialized) return;
        sessionStorage.setItem('ac_search', search);
        sessionStorage.setItem('ac_type', filterType);
        sessionStorage.setItem('ac_platform', filterPlatform);
        sessionStorage.setItem('ac_genre', filterGenre);
        sessionStorage.setItem('ac_status', filterStatus);
        sessionStorage.setItem('ac_sort', sort);
        sessionStorage.setItem('ac_incomplete', showIncomplete.toString());
        sessionStorage.setItem('ac_missing', filterMissingFiles.toString());
        sessionStorage.setItem('ac_page', page.toString());
    }, [search, filterType, filterPlatform, filterGenre, filterStatus, sort, showIncomplete, filterMissingFiles, page, isInitialized]);

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

    const fetchContents = useCallback(async (abortController?: AbortController) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                sort,
            });

            if (debouncedSearch) params.append('search', debouncedSearch);
            if (filterType) params.append('type', filterType);
            if (filterPlatform) params.append('platformId', filterPlatform);
            if (filterGenre) params.append('genreId', filterGenre);
            if (filterStatus) params.append('status', filterStatus);
            if (showIncomplete) params.append('incomplete', 'true');
            if (filterMissingFiles) params.append('hasMissingFiles', 'true');

            const res = await adminFetch(`${API_ROUTES.CONTENT.LIST}?${params}`, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                signal: abortController?.signal
            });
            const d = await res.json();

            setContents(d.data ?? []);
            setTotalItems(d.meta?.total || d.pagination?.total || 0);
            setTotalPages(d.meta?.totalPages || d.pagination?.totalPages || 1);
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [page, sort, filterType, filterPlatform, filterStatus, debouncedSearch, showIncomplete, filterMissingFiles]);

    useEffect(() => {
        if (!isInitialized) return;
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            if (search !== debouncedSearch) setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [search, debouncedSearch, isInitialized]);

    useEffect(() => {
        fetchMetadata();
    }, [fetchMetadata]);

    useEffect(() => {
        if (!isInitialized) return;
        const controller = new AbortController();
        fetchContents(controller);
        return () => controller.abort();
    }, [fetchContents, isInitialized]);

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`¿Estás seguro de que deseas eliminar "${title}"?\nEsta acción no se puede deshacer.`)) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await adminFetch(API_ROUTES.CONTENT.DELETE(id), {
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

    const handleExport = async (type: 'MOVIE' | 'SERIES') => {
        try {
            const token = localStorage.getItem('adminToken');
            const url = `${API_ROUTES.CONTENT.EXPORT}?type=${type}`;
            const res = await fetch(url, {
                headers: {
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error('Error al exportar');
            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `export_${type.toLowerCase()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);
        } catch (err) {
            console.error(err);
            alert('Error al exportar contenido');
        }
    };

    const handlePinToggle = async (id: string, currentPin: boolean) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await adminFetch(`${API_ROUTES.CONTENT.BASE}/${id}/pin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ isPinned: !currentPin })
            });
            if (res.ok) {
                setContents(prev => prev.map(c => c.id === id ? { ...c, isPinned: !currentPin } : c));
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo fijar/desfijar'}`);
            }
        } catch (error: any) {
            alert(error.message || 'Error al fijar/desfijar el contenido');
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const newIds = contents.map(c => c.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...newIds])));
        } else {
            const pageIds = contents.map(c => c.id);
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleBulkAction = async (action: 'delete' | 'changeStatus' | 'pin' | 'unpin', statusToApply?: string) => {
        const confirmMsg = {
            delete: '¿Estás seguro de que deseas eliminar los contenidos seleccionados? Esta acción no se puede deshacer.',
            changeStatus: `¿Estás seguro de cambiar el estado a ${statusToApply} de los contenidos seleccionados?`,
            pin: '¿Estás seguro de fijar los contenidos seleccionados?',
            unpin: '¿Estás seguro de desfijar los contenidos seleccionados?',
        }[action];

        if (!window.confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('adminToken');
            const res = await adminFetch(API_ROUTES.CONTENT.BULK_ACTION, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ action, ids: selectedIds, status: statusToApply })
            });

            if (res.ok) {
                if (action === 'delete') {
                    setContents(prev => prev.filter(c => !selectedIds.includes(c.id)));
                    setTotalItems(prev => prev - selectedIds.length);
                } else if (action === 'changeStatus') {
                    setContents(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, status: statusToApply! } : c));
                } else if (action === 'pin') {
                    setContents(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, isPinned: true } : c));
                } else if (action === 'unpin') {
                    setContents(prev => prev.map(c => selectedIds.includes(c.id) ? { ...c, isPinned: false } : c));
                }
                setSelectedIds([]);
                setBulkStatus('');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo completar la acción'}`);
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión');
        }
    };

    const isAllSelected = contents.length > 0 && contents.every(c => selectedIds.includes(c.id));

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
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="adm-btn adm-btn--ghost" onClick={() => handleExport('MOVIE')} style={{ gap: 6, color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Download size={16} /> Excel Películas
                    </button>
                    <button className="adm-btn adm-btn--ghost" onClick={() => handleExport('SERIES')} style={{ gap: 6, color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                        <Download size={16} /> Excel Series
                    </button>
                    <Link href="/admin/content/files" className="adm-btn adm-btn--ghost" style={{ gap: 6 }}>
                        <FolderSearch size={16} /> Importar archivos
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
                    style={{ maxWidth: 140 }}
                    onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
                >
                    <option value="">Estados</option>
                    <option value="ACTIVE">ACTIVO</option>
                    <option value="READY">LISTO</option>
                    <option value="PENDING">PENDIENTE</option>
                    <option value="PROCESSING">PROCESANDO</option>
                    <option value="ERROR">ERROR</option>
                    <option value="WITH_ERRORS">⚠️ Con episodios fallidos</option>
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

                <button
                    className={`adm-btn adm-btn--ghost${filterMissingFiles ? ' adm-btn--active' : ''}`}
                    onClick={() => { setFilterMissingFiles(!filterMissingFiles); setPage(1); }}
                    style={{ maxWidth: 130, ...(filterMissingFiles ? { background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' } : {}) }}
                >
                    <AlertTriangle size={14} /> Videos Vacíos
                </button>
            </div>

            {selectedIds.length > 0 && (
                <div className="adm-toolbar" style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <span style={{ fontWeight: 600, color: '#60a5fa', marginRight: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Hash size={14} />
                        {selectedIds.length} elemento{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}
                    </span>
                    
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255, 215, 0, 0.1)', padding: '2px 4px 2px 8px', borderRadius: 6, border: '1px solid rgba(255, 215, 0, 0.2)' }}>
                        <select 
                            className="adm-select adm-select--sm" 
                            value={bulkStatus} 
                            onChange={e => setBulkStatus(e.target.value)} 
                            style={{ padding: '4px 24px 4px 8px', border: 'none', background: 'transparent', color: '#FFD700' }}
                        >
                            <option value="">Cambiar a...</option>
                            <option value="ACTIVE">ACTIVO</option>
                            <option value="READY">LISTO</option>
                            <option value="PENDING">PENDIENTE</option>
                            <option value="PROCESSING">PROCESANDO</option>
                            <option value="ERROR">ERROR</option>
                        </select>
                        <button 
                            className="adm-btn adm-btn--sm adm-btn--ghost" 
                            onClick={() => bulkStatus ? handleBulkAction('changeStatus', bulkStatus) : alert('Selecciona un estado primero')} 
                            style={{ color: '#FFD700' }}
                        >
                            Aplicar
                        </button>
                    </div>

                    <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => handleBulkAction('pin')} style={{ color: '#3b82f6', borderColor: 'rgba(59,130,246,0.3)' }}>
                        Fijar
                    </button>
                    <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => handleBulkAction('unpin')} style={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)' }}>
                        Desfijar
                    </button>
                    <button className="adm-btn adm-btn--sm adm-btn--ghost" onClick={() => handleBulkAction('delete')} style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }}>
                        <Trash2 size={14} /> Eliminar
                    </button>
                    <button className="adm-btn adm-btn--sm" onClick={() => setSelectedIds([])} style={{ marginLeft: 8 }}>
                        Cancelar
                    </button>
                </div>
            )}

            <div className="adm-table-card">
                <div className="adm-table-wrapper">
                    <table className="adm-table">
                    <thead>
                        <tr>
                            <th style={{ width: 40, textAlign: 'center' }}>
                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                            </th>
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
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px' }}>
                                <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto', color: 'var(--adm-primary)' }} />
                            </td></tr>
                        ) : contents.length === 0 ? (
                            <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--adm-muted)' }}>No se encontró contenido con los filtros aplicados.</td></tr>
                        ) : contents.map(item => {
                            const title = item.translations?.[0]?.title || 'Sin título';
                            const poster = item.thumbnails?.find(t => t.type === 'POSTER')?.url;

                            return (
                                <tr key={item.id} style={{ 
                                    background: item.hasMissingFiles ? 'rgba(239, 68, 68, 0.15)' : selectedIds.includes(item.id) ? 'rgba(59, 130, 246, 0.05)' : '',
                                    borderLeft: item.hasMissingFiles ? '4px solid #ef4444' : 'none'
                                }}>
                                    <td style={{ textAlign: 'center' }}>
                                        <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelection(item.id)} style={{ cursor: 'pointer' }} />
                                    </td>
                                    <td>
                                        <div style={{ width: 40, height: 56, borderRadius: 6, overflow: 'hidden', background: 'var(--adm-bg-alt)' }}>
                                            {poster ? <img src={resolveImageUrl(poster)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Film size={16} style={{ margin: '20px auto', display: 'block', opacity: 0.2 }} />}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 600, color: 'white', fontSize: '0.95rem' }}>
                                                {item?.translations?.[0]?.title || item?.originalTitle || 'Sin título'}
                                            </span>
                                            <code style={{ fontSize: '0.7rem', color: 'var(--adm-muted)', marginTop: 2 }}>{item?.slug || 'sin-slug'}</code>
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

                                            {item.type === 'MOVIE' || (item.videoFiles && item.videoFiles.length > 0) ? (
                                                (item.videoFiles || []).map((v, i) => {
                                                    const isFailed = v.status === 'FAILED' || v.status === 'ERROR';
                                                    const isProcessing = v.status === 'PROCESSING' || v.status === 'QUEUED';
                                                    const isCompleted = v.status === 'READY' || v.status === 'COMPLETED';

                                                    return (
                                                        <div key={i} title={`Video ${i + 1}: ${v.status}`} className="adm-badge" style={{
                                                            background: isFailed ? 'rgba(244, 63, 94, 0.1)' : isCompleted ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255, 215, 0, 0.1)',
                                                            color: isFailed ? '#f43f5e' : isCompleted ? '#4ade80' : '#FFD700',
                                                            width: 'fit-content',
                                                            border: isFailed ? '1px solid rgba(244, 63, 94, 0.2)' : 'none'
                                                        }}>
                                                            {isFailed ? <AlertTriangle size={11} style={{ marginRight: 4 }} /> : <Film size={11} className={isProcessing ? 'animate-spin' : ''} style={{ marginRight: 4 }} />}
                                                            {isFailed ? 'FALLIDO' : (v.qualities && v.qualities.length > 0 ? v.qualities[v.qualities.length - 1].resolution : 'Auto')}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                    {(() => {
                                                        const completed = (item as any).episodeCount ?? 0;
                                                        const failed = (item as any).failedCount ?? 0;
                                                        const empty = (item as any).emptyEpisodesCount ?? 0;

                                                        return (
                                                            <>
                                                                {completed > 0 ? (
                                                                    <div className="adm-badge" style={{ background: 'rgba(74, 222, 128, 0.1)', color: '#4ade80', width: 'fit-content' }}>
                                                                        <Film size={11} style={{ marginRight: 4 }} /> {completed} Episodios
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>Sin episodios listos</span>
                                                                )}
                                                                {failed > 0 && (
                                                                    <div className="adm-badge" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', width: 'fit-content', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                                                                        <AlertTriangle size={11} style={{ marginRight: 4 }} /> {failed} Fallidos
                                                                    </div>
                                                                )}
                                                                {empty > 0 && (
                                                                    <div className="adm-badge" style={{ background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', width: 'fit-content', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
                                                                        <AlertTriangle size={11} style={{ marginRight: 4 }} /> {empty} Sin videos
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            {(!item.videoFiles || item.videoFiles.length === 0) && !item.trailerUrl && <span style={{ fontSize: '0.7rem', color: 'var(--adm-muted)' }}>-</span>}
                                        </div>
                                    </td>
                                    <td>
                                        {item.status === 'READY' && item.videoFiles?.some(v => v.status === 'FAILED' || v.status === 'ERROR') ? (
                                            <span className="adm-badge adm-badge--red" title="El contenido dice estar LISTO pero tiene archivos fallidos">
                                                ERROR (SYNC)
                                            </span>
                                        ) : (
                                            <span className={STATUS_CLASS[item.status] ?? 'adm-badge adm-badge--gray'}>
                                                {item.status}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <div className="adm-table-actions" style={{ justifyContent: 'flex-end' }}>
                                            <button 
                                                className="adm-icon-btn" 
                                                title={item.isPinned ? "Desfijar (Permitir edición/borrado)" : "Fijar (Proteger contra cambios y borrados)"}
                                                onClick={() => handlePinToggle(item.id, !!item.isPinned)}
                                                style={{ color: item.isPinned ? '#3b82f6' : 'var(--adm-muted)' }}
                                            >
                                                📌
                                            </button>
                                            <Link 
                                                href={`/admin/content/${item.id}`} 
                                                className={`adm-icon-btn ${item.isPinned ? 'disabled' : ''}`} 
                                                title="Editar"
                                                style={{ pointerEvents: item.isPinned ? 'none' : 'auto', opacity: item.isPinned ? 0.5 : 1 }}
                                            >
                                                <Edit2 size={14} />
                                            </Link>
                                            <button 
                                                className="adm-icon-btn adm-icon-btn--danger" 
                                                title="Eliminar" 
                                                onClick={() => handleDelete(item.id, title)}
                                                disabled={item.isPinned}
                                                style={{ opacity: item.isPinned ? 0.5 : 1, cursor: item.isPinned ? 'not-allowed' : 'pointer' }}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                </div>

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
