'use client';

import { useState, useEffect } from 'react';
import {
    Layout,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Monitor,
    Zap,
    TrendingUp,
    Settings,
    Star,
    Search,
    Plus,
    Trash2,
    ChevronUp,
    ChevronDown
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

export default function AdminHomepageConfigPage() {
    const [settings, setSettings] = useState({
        home_banner_strategy: 'MANUAL', // MANUAL, AUTO_LATEST, AUTO_TRENDING, COMBINED
        home_banner_limit: '5',
        home_banner_ids: '[]',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search and Selection
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(API_ROUTES.ADMIN.SETTINGS);
            const json = await res.json();
            if (json.success && json.data) {
                const s = {
                    home_banner_strategy: json.data.home_banner_strategy || 'MANUAL',
                    home_banner_limit: json.data.home_banner_limit || '5',
                    home_banner_ids: json.data.home_banner_ids || '[]',
                };
                setSettings(s);

                // Fetch full objects for selected IDs
                const ids = JSON.parse(s.home_banner_ids);
                if (ids.length > 0) {
                    const items = await Promise.all(ids.map(async (id: string) => {
                        try {
                            const r = await adminFetch(API_ROUTES.CONTENT.DETAIL(id));
                            const j = await r.json();
                            return j.data;
                        } catch { return null; }
                    }));
                    setSelectedItems(items.filter(Boolean));
                }
            }
        } catch (err) {
            console.error(err);
            setError('Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    // Live search for adding content
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                // Search might not need full admin auth if it's a public route, but using adminFetch doesn't hurt
                const res = await adminFetch(`${API_ROUTES.CONTENT.LIST}?search=${searchQuery}&limit=5`);
                const json = await res.json();
                if (json.success) setSearchResults(json.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const updatedSettings = {
            ...settings,
            home_banner_ids: JSON.stringify(selectedItems.map(i => i.id))
        };

        try {
            const res = await adminFetch(API_ROUTES.ADMIN.SETTINGS, {
                method: 'PUT',
                body: JSON.stringify(updatedSettings)
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            } else {
                const json = await res.json();
                setError(json.error || 'Error al guardar la configuración');
            }
        } catch (err) {
            console.error(err);
            setError('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const addItem = (item: any) => {
        if (selectedItems.find(i => i.id === item.id)) return;
        setSelectedItems([...selectedItems, item]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeItem = (id: string) => {
        setSelectedItems(selectedItems.filter(i => i.id !== id));
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...selectedItems];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newItems.length) return;
        [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
        setSelectedItems(newItems);
    };

    const strategies = [
        {
            id: 'MANUAL',
            name: 'Lista Manual',
            desc: 'Tú eliges exactamente qué películas y en qué orden se ven.',
            icon: <Star className="text-yellow-400" size={24} />
        },
        {
            id: 'AUTO_LATEST',
            name: 'Aut. Estrenos',
            desc: 'Muestra automáticamente las películas más nuevas subidas.',
            icon: <Zap className="text-blue-400" size={24} />
        },
        {
            id: 'AUTO_TRENDING',
            name: 'Aut. Tendencias',
            desc: 'Muestra automáticamente lo más visto de la plataforma.',
            icon: <TrendingUp className="text-red-400" size={24} />
        },
        {
            id: 'COMBINED',
            name: 'Mix Dinámico',
            desc: 'Mezcla tu lista manual con estrenos y tendencias.',
            icon: <Monitor className="text-purple-400" size={24} />
        }
    ];

    if (loading) return (
        <div className="adm-page flex items-center justify-center min-h-[60vh]">
            <Loader2 className="animate-spin text-[var(--color-primary)]" size={40} />
        </div>
    );

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Configuración de Portada</h1>
                    <p className="adm-page-subtitle">Personaliza el banner principal y el orden de los destacados</p>
                </div>
                <button
                    className="adm-btn adm-btn--primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {success && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 flex items-center gap-3">
                    <CheckCircle2 size={18} />
                    Configuración guardada correctamente.
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 flex items-center gap-3">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Strategy Selection */}
                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Layout className="adm-settings-icon" size={18} />
                            <h2>Estrategia del Hero Banner</h2>
                        </div>
                        <div className="adm-settings-body p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {strategies.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`p-5! rounded-2xl border-2 transition-all cursor-pointer flex gap-4 ${settings.home_banner_strategy === s.id
                                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                                            : 'border-white/5 bg-white/2 hover:border-white/10'
                                            }`}
                                        onClick={() => setSettings({ ...settings, home_banner_strategy: s.id })}
                                    >
                                        <div className="mt-1">{s.icon}</div>
                                        <div>
                                            <h3 className={`font-black text-sm uppercase tracking-wider ${settings.home_banner_strategy === s.id ? 'text-[var(--color-primary)]' : 'text-white'
                                                }`}>
                                                {s.name}
                                            </h3>
                                            <p className="text-xs text-[var(--adm-muted)] mt-1 leading-relaxed">
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Manual Selection Management */}
                    {(settings.home_banner_strategy === 'MANUAL' || settings.home_banner_strategy === 'COMBINED') && (
                        <div className="adm-settings-section animate-fadeIn">
                            <div className="adm-settings-section-header">
                                <Star className="adm-settings-icon" size={18} />
                                <h2>Gestión de Lista Manual</h2>
                            </div>
                            <div className="adm-settings-body p-6">
                                {/* Search Bar */}
                                <div className="relative mb-6">
                                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[var(--color-primary)] transition-all">
                                        <Search size={18} className="text-[var(--adm-muted)]" />
                                        <input
                                            type="text"
                                            placeholder="Buscar películas o series para añadir..."
                                            className="bg-transparent border-none outline-none flex-1 text-sm text-white p-2!"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {isSearching && <Loader2 size={16} className="animate-spin text-[var(--color-primary)]" />}
                                    </div>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1e2e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {searchResults.map(item => (
                                                <button
                                                    key={item.id}
                                                    className="w-full flex items-center gap-4 p-3! hover:bg-white/5 text-left transition-all border-b border-white/5 last:border-none"
                                                    onClick={() => addItem(item)}
                                                >
                                                    <div className="w-10 h-14 bg-white/10 rounded overflow-hidden flex-shrink-0">
                                                        <img
                                                            src={item.thumbnails?.[0]?.url.startsWith('http') ? item.thumbnails[0].url : `http://localhost:4000${item.thumbnails?.[0]?.url}`}
                                                            className="w-full h-full object-cover"
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-white">{item.translations[0]?.title}</h4>
                                                        <p className="text-[10px] uppercase text-[var(--adm-muted)]">{item.type} • {item.releaseYear}</p>
                                                    </div>
                                                    <div className="ml-auto bg-[var(--color-primary)] text-black rounded-full p-1">
                                                        <Plus size={14} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Selected Items List */}
                                <div className="space-y-3!">
                                    {selectedItems.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-2xl">
                                            <p className="text-sm text-[var(--adm-muted)]">No hay películas seleccionadas. Usa el buscador de arriba.</p>
                                        </div>
                                    ) : (
                                        selectedItems.map((item, index) => (
                                            <div key={item.id} className="flex items-center gap-4 bg-white/2 border border-white/5 p-3! rounded-xl group hover:border-white/10  mb-3 transition-all">
                                                <div className="flex flex-col gap-1">
                                                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="text-[var(--adm-muted)] hover:text-white disabled:opacity-0"><ChevronUp size={16} /></button>
                                                    <button onClick={() => moveItem(index, 'down')} disabled={index === selectedItems.length - 1} className="text-[var(--adm-muted)] hover:text-white disabled:opacity-0"><ChevronDown size={16} /></button>
                                                </div>
                                                <div className="w-12 h-16 bg-white/5 rounded overflow-hidden flex-shrink-0">
                                                    <img
                                                        src={item.thumbnails?.[0]?.url.startsWith('http') ? item.thumbnails[0].url : `http://localhost:4000${item.thumbnails?.[0]?.url}`}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-bold text-white">{item.translations[0]?.title}</h4>
                                                    <p className="text-[10px] uppercase text-[var(--adm-muted)]">{item.type} • {item.releaseYear}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-red-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-400/10 rounded-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="adm-settings-section">
                        <div className="adm-settings-section-header">
                            <Settings className="adm-settings-icon" size={18} />
                            <h2>Ajustes Globales</h2>
                        </div>
                        <div className="adm-settings-body p-6">
                            <div className="adm-form-row mb-6">
                                <label className="block text-sm font-bold mb-2">Items Máximos</label>
                                <input
                                    type="number"
                                    className="adm-input"
                                    value={settings.home_banner_limit}
                                    onChange={(e) => setSettings({ ...settings, home_banner_limit: e.target.value })}
                                />
                                <p className="text-[10px] uppercase text-[var(--adm-muted)] mt-2">Cuántas diapositivas mostrar en el banner.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
