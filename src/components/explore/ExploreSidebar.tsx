'use client';

import { Search, Star, Clock, Calendar, Gift, Globe } from 'lucide-react';
import { CONTENT_TYPES_LIST, getContentTypeLabel, getContentTypeIcon } from '@/lib/content-types';

interface ExploreSidebarProps {
    onFilterChange: (filters: any) => void;
    activeFilters: any;
    genres: any[];
    platforms: any[];
    tags?: any[];
}

export default function ExploreSidebar({ onFilterChange, activeFilters, genres, platforms, tags }: ExploreSidebarProps) {
    const types = CONTENT_TYPES_LIST.map(id => ({
        id,
        name: getContentTypeLabel(id),
        icon: getContentTypeIcon(id)
    }));

    const quickFilters = [
        { id: 'recommended', name: 'Recomendados', icon: <Star size={18} /> },
        { id: 'latest', name: 'Últimos subidos', icon: <Clock size={18} /> },
        { id: 'premieres', name: 'Estrenos', icon: <Calendar size={18} /> },
        { id: 'free', name: 'Gratis', icon: <Gift size={18} /> },
    ];

    const updateFilter = (key: string, value: any) => {
        onFilterChange({ ...activeFilters, [key]: value, page: 1 });
    };

    return (
        <aside className="explore-sidebar custom-scrollbar">
            {/* Search */}
            <div className="filter-section">
                <label className="filter-title">Buscar</label>
                <div className="filter-search">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="¿Qué quieres ver?"
                        value={activeFilters.search || ''}
                        onChange={(e) => updateFilter('search', e.target.value)}
                    />
                </div>
            </div>

            {/* Types */}
            <div className="filter-section">
                <label className="filter-title">Tipo de contenido</label>
                <div className="filter-list">
                    <button
                        className={`filter-item ${!activeFilters.type ? 'active' : ''}`}
                        onClick={() => updateFilter('type', null)}
                    >
                        <span>Todos los tipos</span>
                    </button>
                    {types.map(t => (
                        <button
                            key={t.id}
                            className={`filter-item ${activeFilters.type === t.id ? 'active' : ''}`}
                            onClick={() => updateFilter('type', t.id)}
                        >
                            <div className="flex items-center gap-3">
                                {t.icon}
                                <span>{t.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Filters */}
            <div className="filter-section">
                <label className="filter-title">Descubrir</label>
                <div className="filter-list">
                    {quickFilters.map(f => (
                        <button
                            key={f.id}
                            className={`filter-item ${activeFilters.quick === f.id ? 'active' : ''}`}
                            onClick={() => updateFilter('quick', f.id === activeFilters.quick ? null : f.id)}
                        >
                            <div className="flex items-center gap-3">
                                {f.icon}
                                <span>{f.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Platforms */}
            <div className="filter-section">
                <label className="filter-title">Plataformas</label>
                <div className="filter-list">
                    <button
                        className={`filter-item ${!activeFilters.platformId ? 'active' : ''}`}
                        onClick={() => updateFilter('platformId', null)}
                    >
                        <span>Todas las plataformas</span>
                    </button>
                    {platforms.map(p => (
                        <button
                            key={p.id}
                            className={`filter-item ${activeFilters.platformId === p.id ? 'active' : ''}`}
                            onClick={() => updateFilter('platformId', p.id)}
                        >
                            <div className="flex items-center gap-3">
                                {p.logoUrl ? (
                                    <img src={p.logoUrl} alt={p.name} className="w-5 h-5 object-contain rounded-sm" />
                                ) : <Globe size={18} />}
                                <span>{p.name}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Genres */}
            <div className="filter-section">
                <label className="filter-title">Géneros</label>
                <div className="grid grid-cols-1 gap-1">
                    <button
                        className={`filter-item ${!activeFilters.genreId ? 'active' : ''}`}
                        onClick={() => updateFilter('genreId', null)}
                    >
                        <span>Todos los géneros</span>
                    </button>
                    {genres.map(g => (
                        <button
                            key={g.id}
                            className={`filter-item ${activeFilters.genreId === g.id ? 'active' : ''}`}
                            onClick={() => updateFilter('genreId', g.id)}
                        >
                            <span>{g.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tags */}
            {tags && tags.length > 0 && (
                <div className="filter-section">
                    <label className="filter-title">Etiquetas / Tags</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {tags.map(t => (
                            <button
                                key={t.id}
                                onClick={() => updateFilter('tagId', activeFilters.tagId === t.id ? null : t.id)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeFilters.tagId === t.id
                                        ? 'bg-[#00E5FF] text-black'
                                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                #{t.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
}
