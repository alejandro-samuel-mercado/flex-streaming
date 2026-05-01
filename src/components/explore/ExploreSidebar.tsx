'use client';

import { Search, Film, Tv, PlayCircle, Star, Sparkles, Clock, Calendar, Gift, Globe } from 'lucide-react';

interface ExploreSidebarProps {
  onFilterChange: (filters: any) => void;
  activeFilters: any;
  genres: any[];
  platforms: any[];
}

export default function ExploreSidebar({ onFilterChange, activeFilters, genres, platforms }: ExploreSidebarProps) {
  const types = [
    { id: 'MOVIE', name: 'Películas', icon: <Film size={18} /> },
    { id: 'SERIES', name: 'Series', icon: <Tv size={18} /> },
    { id: 'DOCUMENTARY', name: 'Documentales', icon: <PlayCircle size={18} /> },
    { id: 'ANIME', name: 'Anime', icon: <Sparkles size={18} /> },
  ];

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
    </aside>
  );
}
