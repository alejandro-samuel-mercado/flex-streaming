'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Film, ArrowLeft, Loader2 } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import Link from 'next/link';

export default function NewContentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    type: 'MOVIE',
    synopsis: '',
    releaseYear: new Date().getFullYear(),
    duration: 120,
    ageRating: 'PG-13',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We wrap it in a translations array as required by the backend
    const payload = {
      type: formData.type,
      originalTitle: formData.originalTitle || formData.title,
      releaseYear: Number(formData.releaseYear),
      duration: Number(formData.duration),
      status: 'PENDING',
      translations: [{
        language: 'es',
        title: formData.title,
        synopsis: formData.synopsis,
      }]
    };

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('accessToken');
      console.log('Creando contenido en:', API_ROUTES.CONTENT.LIST);
      console.log('Token de admin:', token ? 'Encontrado (longitud: ' + token.length + ')' : 'NO ENCONTRADO');
      
      const res = await fetch(API_ROUTES.CONTENT.LIST, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error('Error al crear contenido');
      
      // Redirect back to content list
      router.push('/admin/content');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al crear el contenido. Revisa la consola.');
      setLoading(false);
    }
  };

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <Link href="/admin/content" style={{ color: 'var(--adm-muted)', display: 'flex', alignItems: 'center' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1 className="adm-page-title" style={{ margin: 0 }}>Crear Contenido</h1>
          </div>
          <p className="adm-page-subtitle">Añade una nueva película, serie o anime al catálogo.</p>
        </div>
      </div>

      <div className="adm-table-card" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 24 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Título (Español) *</label>
              <input 
                type="text" required
                className="adm-search-input" style={{ width: '100%', padding: '12px' }}
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Título Original</label>
              <input 
                type="text"
                className="adm-search-input" style={{ width: '100%', padding: '12px' }}
                value={formData.originalTitle}
                onChange={e => setFormData({ ...formData, originalTitle: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Tipo *</label>
              <select 
                className="adm-select" style={{ width: '100%', padding: '12px' }}
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="MOVIE">Película</option>
                <option value="SERIES">Serie</option>
                <option value="ANIME">Anime</option>
                <option value="DOCUMENTARY">Documental</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Año *</label>
              <input 
                type="number" required
                className="adm-search-input" style={{ width: '100%', padding: '12px' }}
                value={formData.releaseYear}
                onChange={e => setFormData({ ...formData, releaseYear: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Duración (min) *</label>
              <input 
                type="number" required
                className="adm-search-input" style={{ width: '100%', padding: '12px' }}
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '.8rem', color: 'var(--adm-muted)', marginBottom: 6 }}>Sinopsis (Español)</label>
            <textarea 
              className="adm-search-input" style={{ width: '100%', padding: '12px', minHeight: 100, resize: 'vertical' }}
              value={formData.synopsis}
              onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: 20, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Link href="/admin/content" className="adm-btn adm-btn--ghost">
              Cancelar
            </Link>
            <button type="submit" className="adm-btn adm-btn--primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="adm-spin" /> : <Film size={16} />}
              Guardar Contenido
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
