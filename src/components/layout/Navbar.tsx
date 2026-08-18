'use client';

import Link from 'next/link';
import { Search, Heart, ChevronDown, Menu, X, User, LogIn, Film, Tv, Clapperboard, Monitor, Play, Star, Mic, Layout, Sparkles, BookOpen, Baby, Users, MousePointer, FlaskConical, Clock } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { API_ROUTES, API_ORIGIN, resolveImageUrl } from '@/lib/api-routes';

interface NavContentType {
    type: string;
    count: number;
}

interface NavPlatform {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
}

interface NavGenre {
    id: string;
    name: string;
    slug: string;
}

interface NavbarProps {
    contentTypes?: NavContentType[];
    platforms?: NavPlatform[];
    genres?: NavGenre[];
    isLoggedIn?: boolean;
}

import { CONTENT_TYPES_LIST, getContentTypeLabel, getContentTypeIcon } from '@/lib/content-types';

export default function Navbar({ contentTypes = [], platforms = [], genres = [] }: NavbarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const isExplorePage = pathname === '/explorar';

    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [fetchedPlatforms, setFetchedPlatforms] = useState<NavPlatform[]>([]);
    const [fetchedGenres, setFetchedGenres] = useState<NavGenre[]>([]);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleScroll = useCallback(() => {
        setScrolled(window.scrollY > 50);
    }, []);

    useEffect(() => {
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchOpen]);

    // Live Search Logic
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const fetchResults = async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`${API_ROUTES.CONTENT.LIST}?search=${encodeURIComponent(searchQuery)}&limit=6`);
                const result = await res.json();
                if (result.success) {
                    setSearchResults(result.data);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(fetchResults, 400);
        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Fetch Nav Data if missing
    useEffect(() => {
        const fetchNavData = async () => {
            try {
                const [platformsRes, genresRes] = await Promise.all([
                    fetch(API_ROUTES.PLATFORMS.LIST),
                    fetch(API_ROUTES.CATEGORIES.GENRES)
                ]);
                
                const [pData, gData] = await Promise.all([
                    platformsRes.json(),
                    genresRes.json()
                ]);

                if (pData.success) setFetchedPlatforms(pData.data);
                if (gData.success) setFetchedGenres(gData.data);
            } catch (err) {
                console.error('Error fetching navbar data:', err);
            }
        };

        if (platforms.length === 0 || genres.length === 0) {
            fetchNavData();
        }
    }, [platforms.length, genres.length]);

    const displayPlatforms = platforms.length > 0 ? platforms : fetchedPlatforms;
    const displayGenres = genres.length > 0 ? genres : fetchedGenres;

    const openDropdown = (name: string) => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
        setActiveDropdown(name);
    };

    const closeDropdown = () => {
        dropdownTimeoutRef.current = setTimeout(() => setActiveDropdown(null), 200);
    };

    const keepDropdown = () => {
        if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    };

    const currentPageLabel = 'Inicio';

    return (
        <>
            <nav className={`nav-cinema ${scrolled ? 'nav-cinema--scrolled' : ''}`} id="main-navbar">
                {/* Left: Logo + Nav Items */}
                <div className="nav-cinema-left">
                    <Link href="/" className="nav-cinema-logo" id="nav-logo">
                        <img src="/logo-nuba.png" alt="Nuba" className="nav-cinema-logo-img" />
                    </Link>

                    {/* Desktop Nav Items */}
                    <div className="nav-cinema-items">
                        <Link href="/explorar" className="nav-cinema-item font-black tracking-widest text-[var(--color-primary)] hover:scale-105 transition-all">
                            EXPLORAR
                        </Link>
                        <Link href="/explorar?quick=premieres" className="nav-cinema-item font-black tracking-widest hover:text-[var(--color-primary)] hover:scale-105 transition-all">
                            ESTRENOS
                        </Link>

                        {/* Explore page specific items or hiding them */}
                        {!isExplorePage && (
                            <>
                                {/* Current Page / Tipo */}
                                <div
                                    className="nav-cinema-dropdown"
                                    onMouseEnter={() => openDropdown('tipo')}
                                    onMouseLeave={closeDropdown}
                                >
                                    <button className="nav-cinema-item nav-cinema-item--active">
                                        {currentPageLabel}
                                        <ChevronDown size={14} className={`nav-cinema-chevron ${activeDropdown === 'tipo' ? 'nav-cinema-chevron--open' : ''}`} />
                                    </button>

                                    {activeDropdown === 'tipo' && (
                                        <div className="nav-cinema-popup" onMouseEnter={keepDropdown} onMouseLeave={closeDropdown}>
                                            <div className="grid grid-cols-3 gap-2 min-w-[580px] max-w-[80vw]">
                                                {CONTENT_TYPES_LIST.map(type => {
                                                    const ct = contentTypes.find(c => c.type === type);
                                                    return (
                                                        <Link
                                                            key={type}
                                                            href={`/explorar?type=${type}`}
                                                            className="nav-cinema-popup-link"
                                                            onClick={() => setActiveDropdown(null)}
                                                        >
                                                            <span className="nav-cinema-popup-icon">{getContentTypeIcon(type, 16)}</span>
                                                            <span className="nav-cinema-popup-label">{getContentTypeLabel(type)}</span>

                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Plataformas */}
                                <div
                                    className="nav-cinema-dropdown"
                                    onMouseEnter={() => openDropdown('plataformas')}
                                    onMouseLeave={closeDropdown}
                                >
                                    <button className="nav-cinema-item">
                                        Plataformas
                                        <ChevronDown size={14} className={`nav-cinema-chevron ${activeDropdown === 'plataformas' ? 'nav-cinema-chevron--open' : ''}`} />
                                    </button>

                                    {activeDropdown === 'plataformas' && (
                                        <div className="nav-cinema-popup" onMouseEnter={keepDropdown} onMouseLeave={closeDropdown}>
                                            <div className="nav-cinema-popup-grid nav-cinema-popup-grid--platforms">
                                                {displayPlatforms.map(p => (
                                                    <Link
                                                        key={p.id}
                                                        href={`/explorar?platformId=${p.id}`}
                                                        className="nav-cinema-popup-platform"
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        {p.logoUrl ? (
                                                            <img src={p.logoUrl} alt={p.name} className="nav-cinema-popup-platform-logo" />
                                                        ) : (
                                                            <span className="nav-cinema-popup-platform-name">{p.name}</span>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Géneros */}
                                <div
                                    className="nav-cinema-dropdown"
                                    onMouseEnter={() => openDropdown('generos')}
                                    onMouseLeave={closeDropdown}
                                >
                                    <button className="nav-cinema-item">
                                        Géneros
                                        <ChevronDown size={14} className={`nav-cinema-chevron ${activeDropdown === 'generos' ? 'nav-cinema-chevron--open' : ''}`} />
                                    </button>

                                    {activeDropdown === 'generos' && (
                                        <div className="nav-cinema-popup" onMouseEnter={keepDropdown} onMouseLeave={closeDropdown}>
                                            <div className="nav-cinema-popup-grid nav-cinema-popup-grid--genres">
                                                {displayGenres.map(g => (
                                                    <Link
                                                        key={g.id}
                                                        href={`/explorar?genreId=${g.id}`}
                                                        className="nav-cinema-popup-genre"
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        {g.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Right: Search, Favorites, Auth, Profile */}
                <div className="nav-cinema-right">
                    {/* Search */}
                    <div className="nav-cinema-search-wrap">
                        <button
                            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
                            className="nav-cinema-icon-btn"
                            aria-label="Buscar"
                            id="nav-search-btn"
                        >
                            {searchOpen ? <X size={20} /> : <Search size={20} />}
                        </button>

                        <div className={`nav-cinema-search-bar ${searchOpen ? 'nav-cinema-search-bar--open' : ''}`}>
                            <form action="/buscar" className="nav-cinema-search-form" onSubmit={(e) => e.preventDefault()}>
                                <Search size={16} className="nav-cinema-search-icon" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    name="q"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar películas, series..."
                                    className="nav-cinema-search-input"
                                />
                            </form>

                            {/* Live Search Results Popup */}
                            {searchOpen && searchQuery.length >= 2 && (
                                <div className="absolute top-[100%] right-0 mt-4 w-[450px] bg-[#0a0e1f]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-6! z-[200] animate-popupFadeSlideUp">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-xs font-black uppercase tracking-[3px] text-[var(--color-primary)] pb-8!">Resultados sugeridos</h3>
                                        {isSearching && <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>}
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {searchResults.map(item => (
                                            <Link
                                                key={item.id}
                                                href={`/film/${item.id}`}
                                                className="flex items-center gap-4 group p-2 hover:bg-white/5 rounded-xl transition-all"
                                                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                            >
                                                <div className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-white/10 group-hover:border-[var(--color-primary)] transition-all">
                                                    <img
                                                        src={resolveImageUrl(item.thumbnails?.[0]?.url)}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white group-hover:text-[var(--color-primary)] transition-all line-clamp-1">{item.translations?.[0]?.title}</span>
                                                    <div className="flex items-center gap-3 text-xs text-white/40 mt-1">
                                                        <span className="bg-white/5 px-1.5 py-0.5 rounded uppercase font-bold">{item.type}</span>
                                                        <span>{item.releaseYear}</span>
                                                        <span className="text-[var(--color-primary)] font-bold">{item.rating?.toFixed(1)} ★</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}

                                        {!isSearching && searchResults.length === 0 && (
                                            <div className="text-center py-6 text-white/30 text-sm">No se encontraron resultados</div>
                                        )}

                                        <Link
                                            href={`/explorar?search=${encodeURIComponent(searchQuery)}`}
                                            className="mt-2 text-center py-3! bg-[var(--color-primary)] text-black font-black text-xs uppercase rounded-xl tracking-widest hover:scale-[1.02] transition-all"
                                            onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                                        >
                                            Ver todos los resultados
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Favorites */}
                    <Link href="/favoritos" className="nav-cinema-icon-btn" aria-label="Favoritos" id="nav-favorites-btn">
                        <Heart size={20} />
                    </Link>

                    {/* Auth / Profile */}
                    {user ? (
                        <div className="nav-cinema-dropdown" onMouseEnter={() => openDropdown('profile')} onMouseLeave={closeDropdown}>
                            <button className="nav-cinema-profile" id="nav-profile">
                                <div className="nav-cinema-avatar">
                                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={16} />}
                                </div>
                            </button>
                            {activeDropdown === 'profile' && (
                                <div className="nav-cinema-popup nav-cinema-popup--profile" onMouseEnter={keepDropdown} onMouseLeave={closeDropdown}>
                                    <div className="nav-cinema-popup-user">
                                        <p className="nav-cinema-popup-user-name">{user.name}</p>
                                        <p className="nav-cinema-popup-user-email">{user.email}</p>
                                    </div>
                                    <div className="nav-cinema-popup-divider" />
                                    <Link href="/perfil" className="nav-cinema-popup-link" onClick={() => setActiveDropdown(null)}>
                                        <User size={14} /> Mi Perfil
                                    </Link>
                                    <Link href="/favoritos" className="nav-cinema-popup-link" onClick={() => setActiveDropdown(null)}>
                                        <Heart size={14} /> Favoritos
                                    </Link>
                                    <Link href="/historial" className="nav-cinema-popup-link" onClick={() => setActiveDropdown(null)}>
                                        <Clock size={14} /> Historial
                                    </Link>
                                    <div className="nav-cinema-popup-divider" />
                                    <button onClick={logout} className="nav-cinema-popup-link text-red-500">
                                        <LogIn size={14} className="rotate-180" /> Cerrar Sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/login" className="nav-cinema-login-btn" id="nav-login-btn">
                            <LogIn size={16} />
                            <span>Ingresar</span>
                        </Link>
                    )}

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="nav-cinema-mobile-toggle"
                        aria-label="Menú"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="nav-cinema-mobile animate-fadeIn" id="mobile-menu">
                    <button onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-close" aria-label="Cerrar">
                        <X size={28} />
                    </button>

                    <div className="nav-cinema-mobile-content">
                        <Link href="/" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">Inicio</Link>
                        <Link href="/explorar" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">Explorar</Link>
                        <Link href="/explorar?quick=premieres" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">Estrenos</Link>

                        <div className="nav-cinema-mobile-divider" />
                        <p className="nav-cinema-mobile-label">Por Tipo</p>
                        {CONTENT_TYPES_LIST.map(type => (
                            <Link key={type} href={`/explorar?type=${type}`} onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">
                                {getContentTypeLabel(type)}
                            </Link>
                        ))}

                        <div className="nav-cinema-mobile-divider" />
                        <p className="nav-cinema-mobile-label">Plataformas</p>
                        {platforms.slice(0, 6).map(p => (
                            <Link key={p.id} href={`/plataforma/${p.slug}`} onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">
                                {p.name}
                            </Link>
                        ))}

                        <div className="nav-cinema-mobile-divider" />
                        <div className="nav-cinema-mobile-actions">
                            <Link href="/favoritos" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">
                                <Heart size={16} /> Favoritos
                            </Link>
                            {user ? (
                                <>
                                    <Link href="/perfil" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-link">
                                        <User size={16} /> Mi Perfil
                                    </Link>
                                    <button onClick={logout} className="nav-cinema-mobile-auth-btn mt-4">
                                        Cerrar Sesión
                                    </button>
                                </>
                            ) : (
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="nav-cinema-mobile-auth-btn">
                                    Iniciar Sesión
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
