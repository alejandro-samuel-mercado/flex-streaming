'use client';

import { useState, useEffect } from 'react';
import { History, Search, Film, Tv, Clock, Loader2 } from 'lucide-react';
import { API_ROUTES, API_ORIGIN } from '@/lib/api-routes';

export default function AdminHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_ROUTES.ADMIN.BASE}/history?page=${page}&search=${encodeURIComponent(search)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const resJson = await res.json();
        if (resJson.success && resJson.data) {
          setHistory(resJson.data.data);
          setTotal(resJson.data.total);
          setPages(resJson.data.pages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchHistory();
    }, 500);

    return () => clearTimeout(timer);
  }, [page, search]);

  const resolveUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_ORIGIN}${url}`;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Historial Global</h1>
          <p className="adm-page-subtitle">Monitoreo de reproducciones de usuarios</p>
        </div>
      </div>

      <div className="adm-toolbar">
        <div className="adm-search-wrap">
          <Search size={15} className="adm-search-icon" />
          <input 
            type="text" 
            placeholder="Buscar por usuario o título..." 
            className="adm-search-input" 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
        </div>
      </div>

      <div className="adm-table-card">
        {loading ? (
          <div className="flex justify-center !py-20">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={32} />
          </div>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Contenido</th>
                <th>Tipo</th>
                <th>Progreso</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => {
                const c = h.content;
                const p = h.profile;
                const isComplete = h.completed;
                const percent = Math.min(100, Math.floor((h.progress / Math.max(h.duration, 1)) * 100));

                return (
                  <tr key={h.id}>
                    <td>
                      <div className="adm-table-user">
                        <div className="adm-table-avatar bg-[#00E5FF]/10 text-[#00E5FF]">
                           {p?.name?.[0] || 'U'}
                        </div>
                        <div>
                          <div className="adm-table-user-name">{p?.name || 'Perfil borrado'}</div>
                          <div className="adm-table-user-email text-xs text-gray-500">{p?.user?.email || 'Sin cuenta'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="font-bold text-gray-200">
                        {c?.translations?.[0]?.title || 'Desconocido'}
                      </div>
                      {h.episode && (
                        <div className="text-xs text-gray-500">
                          Episodio {h.episode.number}: {h.episode.translations?.[0]?.title}
                        </div>
                      )}
                    </td>
                    <td>
                       <span className="adm-badge adm-badge--gray inline-flex items-center !gap-1">
                          {c?.type === 'SERIES' ? <Tv size={12}/> : <Film size={12}/>}
                          {c?.type || 'N/A'}
                       </span>
                    </td>
                    <td>
                        <div className="flex flex-col !gap-1 w-24">
                            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                <span>{formatTime(h.progress)}</span>
                                <span>{formatTime(h.duration)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-[var(--color-primary)]" style={{ width: `${percent}%` }}/>
                            </div>
                        </div>
                    </td>
                    <td>
                      <span className={`adm-badge ${isComplete ? 'adm-badge--green' : 'adm-badge--blue'}`}>
                        {isComplete ? 'Completado' : 'Viendo'}
                      </span>
                    </td>
                    <td className="adm-table-muted">
                        <div className="flex items-center !gap-1">
                           <Clock size={12} className="opacity-50"/>
                           {new Date(h.updatedAt).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr>
                   <td colSpan={6} className="text-center !py-12 text-gray-500">No hay registros de reproducción aún.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        <div className="adm-table-footer">
          <span>{total} reproducciones en total</span>
          <div className="adm-pagination">
            <button className="adm-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>←</button>
            <span className="text-xs text-gray-400 mx-2">Página {page} de {pages}</span>
            <button className="adm-page-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>→</button>
          </div>
        </div>
      </div>
    </div>
  );
}
