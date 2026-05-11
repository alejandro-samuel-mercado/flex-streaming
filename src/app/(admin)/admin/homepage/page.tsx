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
    ChevronDown,
    HelpCircle,
    Image as ImageIcon
} from 'lucide-react';
import { API_ROUTES, API_ORIGIN } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';
import { getContentTypeLabel } from '@/lib/content-types';

interface FAQItem {
    question: string;
    answer: string;
}

export default function AdminHomepageConfigPage() {
    const [settings, setSettings] = useState({
        home_banner_strategy: 'MANUAL',
        home_banner_limit: '5',
        home_banner_ids: '[]',
    });

    // New FAQ State
    const [faqItems, setFaqItems] = useState<FAQItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Search and Selection
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItems, setSelectedItems] = useState<any[]>([]);

    // Tabs
    const [activeTab, setActiveTab] = useState<'portada' | 'faq'>('portada');

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

                // Parse FAQ
                if (json.data.faq_items) {
                    try {
                        setFaqItems(JSON.parse(json.data.faq_items));
                    } catch { setFaqItems([]); }
                }

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
            home_banner_ids: JSON.stringify(selectedItems.map(i => i.id)),
            faq_items: JSON.stringify(faqItems)
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

    // FAQ Handlers
    const addFaq = () => {
        setFaqItems([...faqItems, { question: '', answer: '' }]);
    };

    const updateFaq = (index: number, field: keyof FAQItem, value: string) => {
        const newFaq = [...faqItems];
        newFaq[index][field] = value;
        setFaqItems(newFaq);
    };

    const removeFaq = (index: number) => {
        const newFaq = [...faqItems];
        newFaq.splice(index, 1);
        setFaqItems(newFaq);
    };

    const strategies = [
        {
            id: 'MANUAL',
            name: 'Lista Manual',
            desc: 'Tú eliges exactamente qué películas y en qué orden se ven.',
            icon: <Star className="!text-yellow-400" size={24} />
        },
        {
            id: 'AUTO_LATEST',
            name: 'Aut. Estrenos',
            desc: 'Muestra automáticamente las películas más nuevas subidas.',
            icon: <Zap className="!text-blue-400" size={24} />
        },
        {
            id: 'AUTO_TRENDING',
            name: 'Aut. Tendencias',
            desc: 'Muestra automáticamente lo más visto de la plataforma.',
            icon: <TrendingUp className="!text-red-400" size={24} />
        },
        {
            id: 'COMBINED',
            name: 'Mix Dinámico',
            desc: 'Mezcla tu lista manual con estrenos y tendencias.',
            icon: <Monitor className="!text-purple-400" size={24} />
        }
    ];

    if (loading) return (
        <div className="!flex !items-center !justify-center !min-h-[60vh]">
            <Loader2 className="!animate-spin !text-[var(--color-primary)]" size={40} />
        </div>
    );

    return (
        <div className="!mx-auto !p-2 ">
            <div className="!flex !flex-col md:!flex-row !justify-between !items-start md:!items-center !mb-8 !gap-4">
                <div>
                    <h1 className="!text-3xl !font-black !text-white !tracking-tight">Gestión de Web</h1>
                    <p className="!text-[var(--adm-muted)] !mt-1">Personaliza la portada, el banner principal y preguntas frecuentes</p>
                </div>
                <button
                    className="!flex !items-center !gap-2 !bg-[var(--color-primary)] !text-black !px-6 !py-2.5 !rounded-xl !font-bold hover:!bg-[var(--color-primary-light)] !transition-all disabled:!opacity-50"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? <Loader2 size={18} className="!animate-spin" /> : <Save size={18} />}
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            {success && (
                <div className="!mb-6 !p-4 !bg-green-500/10 !border !border-green-500/30 !rounded-xl !text-green-400 !flex !items-center !gap-3">
                    <CheckCircle2 size={18} />
                    Configuración guardada correctamente.
                </div>
            )}

            {error && (
                <div className="!mb-6 !p-4 !bg-red-500/10 !border !border-red-500/30 !rounded-xl !text-red-400 !flex !items-center !gap-3">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Custom Tabs */}
            <div className="!flex !gap-2 !mb-6 !border-b !border-white/10 !pb-4 !overflow-x-auto">
                <button
                    onClick={() => setActiveTab('portada')}
                    className={`!flex !items-center !gap-2 !px-4 !py-2.5 !rounded-xl !font-bold !text-sm !transition-all !whitespace-nowrap ${activeTab === 'portada' ? '!bg-white/10 !text-white' : '!text-[var(--adm-muted)] hover:!bg-white/5 hover:!text-white'}`}
                >
                    <ImageIcon size={16} /> Portada Principal
                </button>
                <button
                    onClick={() => setActiveTab('faq')}
                    className={`!flex !items-center !gap-2 !px-4 !py-2.5 !rounded-xl !font-bold !text-sm !transition-all !whitespace-nowrap ${activeTab === 'faq' ? '!bg-white/10 !text-white' : '!text-[var(--adm-muted)] hover:!bg-white/5 hover:!text-white'}`}
                >
                    <HelpCircle size={16} /> Preguntas Frecuentes
                </button>
            </div>
            <div className="!bg-[#0f1532] !border !border-white/10 !rounded-2xl !overflow-hidden !animate-in !fade-in !slide-in-from-bottom-2 !mb-8!">
                <div className="!bg-[#141b3d] !px-6 !py-4 !border-b !border-white/10 !flex !items-center !gap-3">
                    <Settings className="!text-[var(--color-primary)]" size={20} />
                    <h2 className="!font-bold !text-white !text-lg !m-0">Ajustes Globales de Portada</h2>
                </div>
                <div className="!p-6">
                    <div className="!mb-6">
                        <label className="!block !text-sm !font-bold !mb-2 !text-white">Items Máximos en Banner</label>
                        <input
                            type="number"
                            className="!w-full !bg-white/5 !border !border-white/10 !rounded-xl !px-4 !py-3 !text-white focus:!border-[var(--color-primary)] !outline-none !transition-all"
                            value={settings.home_banner_limit}
                            onChange={(e) => setSettings({ ...settings, home_banner_limit: e.target.value })}
                        />
                        <p className="!text-[10px] !uppercase !text-[var(--adm-muted)] !mt-2 !m-0">Cuántas diapositivas mostrar en la portada principal.</p>
                    </div>

                    <div className="!mt-8 !p-4 !bg-white/5 !border !border-[var(--color-primary)]/20 !rounded-xl">
                        <h3 className="!text-xs !font-bold !uppercase !tracking-wider !text-[var(--color-primary)] !mb-2 !flex !items-center !gap-2 !m-0">
                            <CheckCircle2 size={14} /> Tip de Optimización
                        </h3>
                        <p className="!text-xs !text-[var(--adm-muted)] !leading-relaxed !m-0">
                            Es recomendable mantener el banner principal con <strong>no más de 6 elementos</strong> para no afectar los tiempos de carga inicial del sitio web de los clientes finales.
                        </p>
                    </div>
                </div>
            </div>
            {/* Tab Content: Portada */}
            {activeTab === 'portada' && (
                <div className="!space-y-6 !animate-in !fade-in !slide-in-from-bottom-2">
                    <div className="!bg-[#0f1532] !border !border-white/10 !rounded-2xl !overflow-hidden">
                        <div className="!bg-[#141b3d] !px-6 !py-4 !border-b !border-white/10 !flex !items-center !gap-3">
                            <Layout className="!text-[var(--color-primary)]" size={20} />
                            <h2 className="!font-bold !text-white !text-lg !m-0">Estrategia del Hero Banner</h2>
                        </div>
                        <div className="!p-6">
                            <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4">
                                {strategies.map((s) => (
                                    <div
                                        key={s.id}
                                        className={`!p-5 !rounded-2xl !border-2 !transition-all !cursor-pointer !flex !gap-4 ${settings.home_banner_strategy === s.id
                                            ? '!border-[var(--color-primary)] !bg-[var(--color-primary)]/10'
                                            : '!border-white/5 !bg-white/5 hover:!border-white/10'
                                            }`}
                                        onClick={() => setSettings({ ...settings, home_banner_strategy: s.id })}
                                    >
                                        <div className="!mt-1">{s.icon}</div>
                                        <div>
                                            <h3 className={`!font-black !text-sm !uppercase !tracking-wider !m-0 ${settings.home_banner_strategy === s.id ? '!text-[var(--color-primary)]' : '!text-white'
                                                }`}>
                                                {s.name}
                                            </h3>
                                            <p className="!text-xs !text-[var(--adm-muted)] !mt-2 !leading-relaxed !m-0">
                                                {s.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {(settings.home_banner_strategy === 'MANUAL' || settings.home_banner_strategy === 'COMBINED') && (
                        <div className="!bg-[#0f1532] !border !border-white/10 !rounded-2xl !overflow-hidden">
                            <div className="!bg-[#141b3d] !px-6 !py-4 !border-b !border-white/10 !flex !items-center !gap-3">
                                <Star className="!text-[var(--color-primary)]" size={20} />
                                <h2 className="!font-bold !text-white !text-lg !m-0">Gestión de Lista Manual</h2>
                            </div>
                            <div className="!p-6">
                                <div className="!relative !mb-6">
                                    <div className="!flex !items-center !gap-3 !bg-white/5 !border !border-white/10 !rounded-xl !px-4 !py-3 focus-within:!border-[var(--color-primary)] !transition-all">
                                        <Search size={18} className="!text-[var(--adm-muted)]" />
                                        <input
                                            type="text"
                                            placeholder="Buscar películas o series para añadir..."
                                            className="!bg-transparent !border-none !outline-none !flex-1 !text-sm !text-white !p-0"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                        {isSearching && <Loader2 size={16} className="!animate-spin !text-[var(--color-primary)]" />}
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="!absolute !top-full !left-0 !right-0 !mt-2 !bg-[#1a1e2e] !border !border-white/10 !rounded-xl !shadow-2xl !z-[100] !max-h-72 !overflow-y-auto">
                                            {searchResults.map(item => (
                                                <button
                                                    key={item.id}
                                                    className="!w-full !flex !items-center !gap-4 !p-3 hover:!bg-white/5 !text-left !transition-all !border-b !border-white/5 last:!border-none"
                                                    onClick={() => addItem(item)}
                                                >
                                                    <div className="!w-10 !h-14 !bg-white/10 !rounded !overflow-hidden !flex-shrink-0">
                                                        <img
                                                            src={item.thumbnails?.[0]?.url.startsWith('http') ? item.thumbnails[0].url : `${API_ORIGIN}${item.thumbnails?.[0]?.url}`}
                                                            className="!w-full !h-full !object-cover"
                                                            alt=""
                                                        />
                                                    </div>
                                                    <div className="!flex-1">
                                                        <h4 className="!text-sm !font-bold !text-white !m-0">{item.translations[0]?.title}</h4>
                                                        <p className="!text-[10px] !uppercase !text-[var(--adm-muted)] !m-0 !mt-1">{item.type} • {item.releaseYear}</p>
                                                    </div>
                                                    <div className="!bg-[var(--color-primary)] !text-black !rounded-full !p-1">
                                                        <Plus size={14} />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="!space-y-3">
                                    {selectedItems.length === 0 ? (
                                        <div className="!text-center !py-10 !border-2 !border-dashed !border-white/5 !rounded-2xl">
                                            <p className="!text-sm !text-[var(--adm-muted)] !m-0">No hay películas seleccionadas. Usa el buscador de arriba.</p>
                                        </div>
                                    ) : (
                                        selectedItems.map((item, index) => (
                                            <div key={item.id} className="!flex !items-center !gap-4 !bg-white/5 !border !border-white/10 !p-3 !rounded-xl group hover:!border-white/20 !transition-all">
                                                <div className="!flex !flex-col !gap-1">
                                                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="!text-[var(--adm-muted)] hover:!text-white disabled:!opacity-0 !bg-transparent !border-none !p-0"><ChevronUp size={16} /></button>
                                                    <button onClick={() => moveItem(index, 'down')} disabled={index === selectedItems.length - 1} className="!text-[var(--adm-muted)] hover:!text-white disabled:!opacity-0 !bg-transparent !border-none !p-0"><ChevronDown size={16} /></button>
                                                </div>
                                                <div className="!w-12 !h-16 !bg-white/10 !rounded !overflow-hidden !flex-shrink-0">
                                                    <img
                                                        src={item.thumbnails?.[0]?.url.startsWith('http') ? item.thumbnails[0].url : `${API_ORIGIN}${item.thumbnails?.[0]?.url}`}
                                                        className="!w-full !h-full !object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="!flex-1">
                                                    <h4 className="!text-sm !font-bold !text-white !m-0">{item.translations[0]?.title}</h4>
                                                    <p className="!text-[10px] !uppercase !text-[var(--adm-muted)] !m-0 !mt-1">{getContentTypeLabel(item.type)} • {item.releaseYear}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="!p-2 !text-red-400 !opacity-0 group-hover:!opacity-100 !transition-all hover:!bg-red-400/10 !rounded-lg !border-none"
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
            )}

            {/* Tab Content: FAQ */}
            {activeTab === 'faq' && (
                <div className="!bg-[#0f1532] !border !border-white/10 !rounded-2xl !overflow-hidden !animate-in !fade-in !slide-in-from-bottom-2">
                    <div className="!bg-[#141b3d] !px-6 !py-4 !border-b !border-white/10 !flex !items-center !justify-between">
                        <div className="!flex !items-center !gap-3">
                            <HelpCircle className="!text-[var(--color-primary)]" size={20} />
                            <h2 className="!font-bold !text-white !text-lg !m-0">Preguntas Frecuentes (FAQ)</h2>
                        </div>
                        <button onClick={addFaq} className="!flex !items-center !gap-2 !bg-white/10 hover:!bg-white/20 !text-white !px-3 !py-1.5 !rounded-lg !text-xs !font-bold !transition-all !border-none">
                            <Plus size={14} /> Añadir Pregunta
                        </button>
                    </div>
                    <div className="!p-6">
                        {faqItems.length === 0 ? (
                            <div className="!text-center !py-12 !border-2 !border-dashed !border-white/5 !rounded-2xl">
                                <HelpCircle size={40} className="!mx-auto !text-[var(--adm-muted)] !opacity-50 !mb-4" />
                                <p className="!text-sm !text-[var(--adm-muted)] !mb-4 !m-0">No hay preguntas frecuentes configuradas en la portada.</p>
                                <button onClick={addFaq} className="!bg-[var(--color-primary)] !text-black !px-4 !py-2 !rounded-lg !font-bold !text-sm !border-none">
                                    Agregar mi primera pregunta
                                </button>
                            </div>
                        ) : (
                            <div className="!space-y-4">
                                {faqItems.map((faq, idx) => (
                                    <div key={idx} className="!bg-[#141b3d] !border !border-white/10 !rounded-xl !p-5 !relative group">
                                        <button
                                            onClick={() => removeFaq(idx)}
                                            className="!absolute !top-4 !right-4 !text-red-400 !opacity-50 hover:!opacity-100 !bg-red-400/10 !p-2 !rounded-lg !transition-all !border-none"
                                            title="Eliminar pregunta"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="!space-y-4 !pr-12">
                                            <div>
                                                <label className="!block !text-xs !font-bold !text-[var(--color-primary)] !uppercase !tracking-wider !mb-2">Pregunta</label>
                                                <input
                                                    type="text"
                                                    value={faq.question}
                                                    onChange={(e) => updateFaq(idx, 'question', e.target.value)}
                                                    className="!w-full !bg-black/20 !border !border-white/10 !rounded-lg !px-4 !py-3 !text-sm !text-white focus:!border-[var(--color-primary)] !outline-none !transition-all"
                                                    placeholder="Ej: ¿Qué incluye la membresía Premium?"
                                                />
                                            </div>
                                            <div>
                                                <label className="!block !text-xs !font-bold !text-[var(--color-primary)] !uppercase !tracking-wider !mb-2">Respuesta</label>
                                                <textarea
                                                    value={faq.answer}
                                                    onChange={(e) => updateFaq(idx, 'answer', e.target.value)}
                                                    className="!w-full !bg-black/20 !border !border-white/10 !rounded-lg !px-4 !py-3 !text-sm !text-white focus:!border-[var(--color-primary)] !outline-none !min-h-[100px] !transition-all"
                                                    placeholder="Ej: Acceso ilimitado a películas y series en calidad 4K UHD sin interrupciones..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

        </div>
    );
}
