'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MoreVertical, Edit2, Trash2, Filter, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/api-routes';

interface ContentItem {
  id: string; type: string; status: string;
  viewCount: number; rating: number | null; createdAt: string;
  translations?: { title: string }[];
  videoFiles?: { type: string; status: string }[];
}

const STATUS_CLASS: Record<string, string> = {
  ACTIVE: 'adm-badge adm-badge--green',
  READY: 'adm-badge adm-badge--green',
  PENDING: 'adm-badge adm-badge--yellow',
  PROCESSING: 'adm-badge adm-badge--blue',
  ERROR: 'adm-badge adm-badge--red',
};

export default function AdminContentPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const filtered = contents.filter(c =>
    (c.translations?.[0]?.title ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Contenido</h1>
          <p className="adm-page-subtitle">Administra el catálogo completo de películas y series</p>
        </div>
        <Link href="/admin/content/new" className="adm-btn adm-btn--primary">
          <Plus size={16} /> Nuevo contenido
        </Link>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={15} className="adm-search-icon" />
          <input
            type="text" placeholder="Buscar por título..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="adm-search-input"
          />
        </div>
        <select className="adm-select">
          <option>Todos los tipos</option>
          <option>MOVIE</option>
          <option>SERIES</option>
          <option>ANIME</option>
        </select>
        <select className="adm-select">
          <option>Todos los estados</option>
          <option>ACTIVE</option>
          <option>PENDING</option>
          <option>ERROR</option>
        </select>
        <button className="adm-btn adm-btn--ghost"><Filter size={14} /> Filtros</button>
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
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--adm-muted)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <Loader2 className="animate-spin" size={24} />
                  Cargando catálogo...
                </div>
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--adm-muted)' }}>
                Sin contenido aún. Usa &quot;Subidas / HLS&quot; para cargar videos.
              </td></tr>
            ) : filtered.map(item => {
              const title = item.translations?.[0]?.title || 'Sin título';
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{title}</td>
                  <td><span className="adm-badge adm-badge--gray">{item.type}</span></td>
                  <td><span className={STATUS_CLASS[item.status] ?? 'adm-badge adm-badge--gray'}>{item.status}</span></td>
                  <td className="adm-table-muted">{item.viewCount.toLocaleString()}</td>
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
                      <button className="adm-icon-btn" title="Más"><MoreVertical size={13} /></button>
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
