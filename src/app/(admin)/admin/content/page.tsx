'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

// We'll map the backend Content model to a UI interface
interface ContentItem {
  id: string;
  type: string;
  status: string;
  viewCount: number;
  rating: number | null;
  createdAt: string;
  translations?: { title: string }[];
}

export default function AdminContentPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from the backend on mount
  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/content` : 'http://localhost:4000/api/content')
      .then(r => r.json())
      .then(data => {
        if (data.data) {
          setContents(data.data);
        } else {
          setContents([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Contenido</h1>
          <p className="text-[var(--color-text-muted)]">Administra el catálogo, agrega películas y series</p>
        </div>
        <Link href="/admin/content/new" className="btn-primary-accent flex items-center gap-2">
          <Plus size={20} />
          <span>Nuevo Contenido</span>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-[var(--color-surface)] p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
          <input
            type="text"
            placeholder="Buscar por título, ID o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm flex items-center gap-2 hover:bg-[var(--color-surface-2)] transition">
            <Filter size={16} />
            <span>Filtros</span>
          </button>
          <select className="px-4 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm focus:outline-none">
            <option>Más recientes</option>
            <option>Más vistos</option>
            <option>Mejor calificados</option>
          </select>
        </div>
      </div>

      {/* Content Table */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              <tr className="text-[var(--color-text-muted)]">
                <th className="px-6 py-4 font-semibold">Título</th>
                <th className="px-6 py-4 font-semibold">Tipo</th>
                <th className="px-6 py-4 font-semibold">Estado DB</th>
                <th className="px-6 py-4 font-semibold">Vistas</th>
                <th className="px-6 py-4 font-semibold">Rating</th>
                <th className="px-6 py-4 font-semibold">Agregado</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-[var(--color-text-muted)]">Cargando base de datos real...</td></tr>
              ) : contents.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-[var(--color-text-muted)]">Aún no hay contenido. Acude al "Sube Archivos" y el procesamiento automático los creará.</td></tr>
              ) : contents.map((item) => (
                <tr key={item.id} className="hover:bg-[var(--color-surface-2)] transition-colors group">
                  <td className="px-6 py-4 font-medium text-white">{item.translations?.[0]?.title || 'Contenido Nuevo'}</td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">{item.type}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      item.status === 'ACTIVE' || item.status === 'READY' ? 'bg-[#46d369]/20 text-[#46d369]' :
                      item.status === 'PENDING' ? 'bg-[#f5c518]/20 text-[#f5c518]' :
                      'bg-[var(--color-surface-3)] text-[var(--color-text-muted)]'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">{item.viewCount}</td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">{item.rating || '-'}</td>
                  <td className="px-6 py-4 text-[var(--color-text-muted)]">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-[var(--color-text-muted)] hover:text-white transition rounded hover:bg-[var(--color-surface-3)]" title="Editar">
                        <Edit2 size={16} />
                      </button>
                      <button className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition rounded hover:bg-[var(--color-error)]/20" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-[var(--color-text-muted)] hover:text-white transition rounded hover:bg-[var(--color-surface-3)]">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>Mostrando 1 a 5 de 1,402 resultados</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-2)] disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 bg-[var(--color-primary)] text-white font-medium border border-[var(--color-primary)] rounded">1</button>
            <button className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-2)]">2</button>
            <button className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-2)]">3</button>
            <span className="px-2 py-1">...</span>
            <button className="px-3 py-1 border border-[var(--color-border)] rounded hover:bg-[var(--color-surface-2)]">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  );
}
