'use client';

import { Tag, Plus, Search } from 'lucide-react';

// ContentType is a Prisma Enum — read-only from the DB
const CONTENT_TYPES = ['MOVIE', 'SERIES', 'ANIME', 'DOCUMENTARY', 'SHORT'];

const TAGS_MOCK = [
  { id: '1', name: 'Acción', slug: 'accion', count: 42 },
  { id: '2', name: 'Drama', slug: 'drama', count: 38 },
  { id: '3', name: 'Comedia', slug: 'comedia', count: 27 },
  { id: '4', name: 'Terror', slug: 'terror', count: 19 },
  { id: '5', name: 'Sci-Fi', slug: 'sci-fi', count: 33 },
  { id: '6', name: 'Animación', slug: 'animacion', count: 15 },
  { id: '7', name: 'Thriller', slug: 'thriller', count: 24 },
  { id: '8', name: 'Romance', slug: 'romance', count: 11 },
];

export default function AdminCategoriesPage() {
  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Categorías</h1>
          <p className="adm-page-subtitle">Tipos de contenido y etiquetas del catálogo</p>
        </div>
        <button className="adm-btn adm-btn--primary"><Plus size={16} /> Nueva etiqueta</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Content Types — read-only enum */}
        <div className="adm-table-card">
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Tipos de Contenido</h2>
            <span className="adm-badge adm-badge--purple">Enum · Solo lectura</span>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Tipo</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {CONTENT_TYPES.map(type => (
                <tr key={type}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{type}</td>
                  <td><span className="adm-badge adm-badge--green">Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--adm-border)', fontSize: '.75rem', color: 'var(--adm-muted)' }}>
            Para agregar tipos, modificar el <code style={{ color: '#a78bfa' }}>enum ContentType</code> en schema.prisma y correr una migración.
          </div>
        </div>

        {/* Tags */}
        <div className="adm-table-card">
          <div className="adm-table-card-header">
            <h2 className="adm-table-card-title">Etiquetas / Tags</h2>
            <div className="adm-search-wrap" style={{ maxWidth: 180 }}>
              <Search size={13} className="adm-search-icon" />
              <input type="text" placeholder="Buscar..." className="adm-search-input" />
            </div>
          </div>
          <table className="adm-table">
            <thead>
              <tr><th>Nombre</th><th>Slug</th><th>Contenidos</th><th></th></tr>
            </thead>
            <tbody>
              {TAGS_MOCK.map(tag => (
                <tr key={tag.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={13} style={{ color: '#a78bfa' }} />
                      <span style={{ fontWeight: 600, color: 'white' }}>{tag.name}</span>
                    </div>
                  </td>
                  <td><code style={{ color: '#60a5fa', fontSize: '.75rem' }}>{tag.slug}</code></td>
                  <td><span className="adm-badge adm-badge--gray">{tag.count}</span></td>
                  <td>
                    <div className="adm-table-actions">
                      <button className="adm-icon-btn adm-icon-btn--danger" title="Eliminar" style={{ fontSize: 12 }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="adm-table-footer">
            <span>{TAGS_MOCK.length} etiquetas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
