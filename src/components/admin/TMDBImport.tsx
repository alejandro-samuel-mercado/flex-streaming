'use client';

import { useState } from 'react';
import { Search, Loader2, Import, X, Film, Tv } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

interface TMDBImportProps {
    onImport: (data: any) => void;
    onClose: () => void;
}

export default function TMDBImport({ onImport, onClose }: TMDBImportProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await adminFetch(`${API_ROUTES.TMDB.SEARCH}?query=${encodeURIComponent(query)}`);
            const json = await res.json();
            if (json.success) {
                setResults(json.data.filter((r: any) => r.media_type === 'movie' || r.media_type === 'tv'));
            }
        } catch (err) {
            console.error('TMDB Search error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (result: any) => {
        setImporting(result.id);
        try {
            const res = await adminFetch(API_ROUTES.TMDB.DETAILS(result.media_type, result.id));
            const json = await res.json();
            if (json.success) {
                const details = json.data;
                // Map TMDB details to our form format
                const mappedData = {
                    title: details.title || details.name,
                    originalTitle: details.original_title || details.original_name,
                    synopsis: details.overview,
                    type: result.media_type === 'movie' ? 'MOVIE' : 'SERIES',
                    releaseYear: new Date(details.release_date || details.first_air_date).getFullYear(),
                    duration: details.runtime || (details.episode_run_time ? details.episode_run_time[0] : 0),
                    rating: details.vote_average,
                    tmdbId: details.id.toString(),
                    posterPath: details.poster_path,
                    backdropPath: details.backdrop_path,
                    // We can also extract genres if they match our IDs (logic needed)
                };
                onImport(mappedData);
                onClose();
            }
        } catch (err) {
            console.error('TMDB Details error:', err);
        } finally {
            setImporting(null);
        }
    };

    return (
        <div className="tmdb-import-overlay">
            <div className="tmdb-import-modal">
                <div className="tmdb-import-header">
                    <h3>Importar desde TMDB</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                <form onSubmit={handleSearch} className="tmdb-search-bar">
                    <input 
                        type="text" 
                        placeholder="Buscar película o serie..." 
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                    </button>
                </form>

                <div className="tmdb-results">
                    {results.map((result) => (
                        <div key={result.id} className="tmdb-result-item">
                            <div className="tmdb-result-poster">
                                {result.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w92${result.poster_path}`} alt={result.title || result.name} />
                                ) : (
                                    <div className="tmdb-poster-placeholder"><Film size={24} /></div>
                                )}
                            </div>
                            <div className="tmdb-result-info">
                                <h4>{result.title || result.name}</h4>
                                <p>{result.release_date || result.first_air_date} • {result.media_type === 'movie' ? 'Película' : 'Serie'}</p>
                            </div>
                            <button 
                                className="tmdb-import-btn"
                                onClick={() => handleSelect(result)}
                                disabled={!!importing}
                            >
                                {importing === result.id ? <Loader2 className="animate-spin" size={16} /> : <Import size={16} />}
                                Importar
                            </button>
                        </div>
                    ))}
                    {!loading && results.length === 0 && query && (
                        <div className="tmdb-no-results">No se encontraron resultados</div>
                    )}
                </div>
            </div>

            <style jsx>{`
                .tmdb-import-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.8);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .tmdb-import-modal {
                    background: #1a1a1a;
                    width: 100%;
                    max-width: 600px;
                    border-radius: 12px;
                    border: 1px solid #333;
                    display: flex;
                    flex-direction: column;
                    max-height: 80vh;
                }
                .tmdb-import-header {
                    padding: 16px;
                    border-bottom: 1px solid #333;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .tmdb-import-header h3 { margin: 0; font-size: 1.1rem; }
                .tmdb-import-header button { background: none; border: none; color: #666; cursor: pointer; }
                
                .tmdb-search-bar {
                    padding: 16px;
                    display: flex;
                    gap: 8px;
                }
                .tmdb-search-bar input {
                    flex: 1;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    padding: 8px 12px;
                    border-radius: 6px;
                    color: white;
                }
                .tmdb-search-bar button {
                    background: #3b82f6;
                    border: none;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                }

                .tmdb-results {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0 16px 16px;
                }
                .tmdb-result-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border-bottom: 1px solid #2a2a2a;
                }
                .tmdb-result-poster {
                    width: 45px;
                    height: 68px;
                    border-radius: 4px;
                    overflow: hidden;
                    background: #2a2a2a;
                }
                .tmdb-result-poster img { width: 100%; height: 100%; object-fit: cover; }
                .tmdb-poster-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #444; }

                .tmdb-result-info { flex: 1; }
                .tmdb-result-info h4 { margin: 0 0 4px; font-size: 0.95rem; }
                .tmdb-result-info p { margin: 0; font-size: 0.8rem; color: #888; }

                .tmdb-import-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: #2a2a2a;
                    border: 1px solid #444;
                    color: #ccc;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tmdb-import-btn:hover:not(:disabled) { background: #3b82f6; border-color: #3b82f6; color: white; }
                .tmdb-no-results { text-align: center; padding: 32px; color: #666; }
            `}</style>
        </div>
    );
}
