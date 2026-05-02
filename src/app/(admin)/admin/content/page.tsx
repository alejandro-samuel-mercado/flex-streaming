'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, Filter, Loader2, Film, FolderSearch, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/api-routes';

interface ContentItem {
  id: string; type: string; status: string;
  viewCount: number; rating: number | null; createdAt: string;
  translations?: { title: string; description?: string }[];
  videoFiles?: { type: string; status: string }[];
  thumbnails?: { type: string; url: string }[];
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'adm-badge adm-badge--green',
  READY: 'adm-badge adm-badge--green',
  PENDING: 'adm-badge adm-badge--yellow',
  PROCESSING: 'adm-badge adm-badge--blue',
  ERROR: 'adm-badge adm-badge--red',
};

function isIncomplete(item: ContentItem): boolean {
  const title = item.translations?.[0]?.title || '';
  const desc = item.translations?.[0]?.description || '';
  const hasPoster = item.thumbnails?.some((t: any) => t.type === 'POSTER');
  return item.status === 'PENDING' && (!desc || !hasPoster);
}

export default function AdminContentPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showIncomplete, setShowIncomplete] = useState(false);

  const fetchContents = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(API_ROUTES.CONTENT.LIST, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const d = await res.json();
      setContents(d.data ?? []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

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
        setContents(prev => prev.filter(c => c.id !== id));
      } else {
        const err = await res.json();
        alert(`Error: ${err.error || 'No se pudo eliminar'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  const filtered = contents.filter(c => {
    const title = (c.translations?.[0]?.title ?? '').toLowerCase();
    if (search && !title.includes(search.toLowerCase())) return false;
    if (filterType && c.type !== filterType) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (showIncomplete && !isIncomplete(c)) return false;
    return true;
  });

  const incompleteCount = contents.filter(isIncomplete).length;

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Contenido</h1>
          <p className="adm-page-subtitle">Administra el catálogo completo de películas y series</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/content/files" className="adm-btn adm-btn--ghost" style={{ gap: 6 }}>
            <FolderSearch size={16} /> Ver archivos
          </Link>
          <Link href="/admin/content/new" className="adm-btn adm-btn--primary">
            <Plus size={16} /> Nuevo contenido
          </Link>
        </div>
      </div>

      {/* Incomplete warning */}
      {incompleteCount > 0 && (
        <div style={{
          background: 'rgba(250, 204, 21, .06)',
          border: '1px solid rgba(250, 204, 21, .15)',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: '0.85rem'
        }}>
          <AlertTriangle size={18} style={{ color: '#facc15', flexShrink: 0 }} />
          <span style={{ color: '#fde68a' }}>
            <strong>{incompleteCount}</strong> contenido(s) con datos incompletos — necesitan datos de TMDB.
          </span>
          <button
            className="adm-btn adm-btn--ghost adm-btn--sm"
            style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
            onClick={() => setShowIncomplete(!showIncomplete)}
          >
            {showIncomplete ? 'Mostrar todos' : 'Filtrar incompletos'}
          </button>
        </div>
      )}

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={15} className="adm-search-icon" />
          <input
            type="text" placeholder="Buscar por título..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="adm-search-input"
          />
        </div>
        <select
          className="adm-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="MOVIE">MOVIE</option>
          <option value="SERIES">SERIES</option>
          <option value="ANIME">ANIME</option>
          <option value="DOCUMENTARY">DOCUMENTARY</option>
        </select>
        <select
          className="adm-select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="READY">READY</option>
          <option value="PENDING">PENDING</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="ERROR">ERROR</option>
        </select>
        <button
          className={`adm-btn adm-btn--ghost${showIncomplete ? ' adm-btn--active' : ''}`}
          onClick={() => setShowIncomplete(!showIncomplete)}
          style={showIncomplete ? { background: 'rgba(250, 204, 21, 0.1)', color: '#facc15', borderColor: 'rgba(250, 204, 21, 0.3)' } : {}}
        >
          <AlertTriangle size={14} /> Incompletos {incompleteCount > 0 && `(${incompleteCount})`}
        </button>
      </div>

      <div className="adm-table-card">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Título</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Vistas</th>
              <th>Rating</th>
              <th>Multimedia</th>
              <th>Agregado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '48px', color: 'var(--adm-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Loader2 className="animate-spin" size={24} />
                  Cargando catálogo...
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--adm-muted)' }}>
                {showIncomplete ? 'No hay contenido incompleto.' : 'Sin contenido aún. Usa "Ver archivos" o "Nuevo contenido" para agregar.'}
              </td></tr>
            ) : filtered.map(item => {
              const title = item.translations?.[0]?.title || 'Sin título';
              const incomplete = isIncomplete(item);
              return (
                <tr key={item.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {incomplete && (
                        <span title="Datos incompletos — buscar en TMDB" style={{ display: 'flex', alignItems: 'center' }}>
                          <AlertTriangle size={14} style={{ color: '#facc15', flexShrink: 0 }} />
                        </span>
                      )}
                      <span style={{ fontWeight: 600, color: incomplete ? '#fde68a' : 'white' }}>
                        {title}
                      </span>
                    </div>
                  </td>
                  <td><span className="adm-badge adm-badge--gray">{item.type}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className={STATUS_CLASS[item.status] ?? 'adm-badge adm-badge--gray'}>{item.status}</span>
                      {incomplete && (
                        <span style={{
                          fontSize: '0.6rem',
                          color: '#facc15',
                          background: 'rgba(250, 204, 21, 0.1)',
                          padding: '2px 6px',
                          borderRadius: 4
                        }}>
                          Incompleto
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="adm-table-muted">{Number(item.viewCount).toLocaleString()}</td>
                  <td className="adm-table-muted">{item.rating ?? '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(item.videoFiles || []).map((v, i) => (
                        <div key={i} title={`Video ${i + 1}: ${v.status}`} style={{ 
                          width: 20, height: 20, borderRadius: 4, 
                          background: v.status === 'COMPLETED' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: v.status === 'COMPLETED' ? '#4ade80' : '#a78bfa'
                        }}>
                          <Film size={10} className={v.status === 'PROCESSING' ? 'animate-spin' : ''} />
                        </div>
                      ))}
                      {item.videoFiles?.length === 0 && (
                        <span style={{ fontSize: '10px', color: 'var(--adm-muted)', opacity: 0.5 }}>Sin videos</span>
                      )}
                    </div>
                  </td>
                  <td className="adm-table-muted">{new Date(item.createdAt).toLocaleDateString('es-AR')}</td>
                  <td>
                    <div className="adm-table-actions">
                      <Link 
                        href={`/admin/content/${item.id}`}
                        className="adm-icon-btn" 
                        title="Editar"
                      >
                        <Edit2 size={13} />
                      </Link>
                      <button 
                        className="adm-icon-btn adm-icon-btn--danger" 
                        title="Eliminar"
                        onClick={() => handleDelete(item.id, title)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="adm-table-footer">
          <span>{filtered.length} elementos</span>
          <div className="adm-pagination">
            <button className="adm-page-btn" disabled>←</button>
            <button className="adm-page-btn adm-page-btn--active">1</button>
            <button className="adm-page-btn">→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
