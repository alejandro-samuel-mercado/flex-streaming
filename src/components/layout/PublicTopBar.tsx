'use client';

import CustomSelect from '@/components/ui/CustomSelect';
import { useAuth } from '@/context/AuthContext';
import { CONTENT_TYPES_LIST, getContentTypeIcon, getContentTypeLabel } from '@/lib/content-types';
import { ChevronDown, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function PublicTopBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const [inputValue, setInputValue] = useState('');
  const [theme, setTheme] = useState('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastUpdatedUrlSearch = useRef(currentSearch);
  const inputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on click outside or scroll
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    const handleScroll = () => setIsUserMenuOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, { capture: true } as any);
    };
  }, []);

  // Scroll detection for dynamic background
  useEffect(() => {
    const scrollContainer = document.querySelector('.serivia-main-content') as HTMLElement;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolled(scrollContainer.scrollTop > 10);
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Load theme on mount
  useEffect(() => {
    const stored = localStorage.getItem('serivia-theme') || 'dark';
    setTheme(stored);
    document.documentElement.setAttribute('data-theme', stored);
  }, []);

  // Sync search input with URL param, but ONLY if the URL changed externally
  // (not from our own typing)
  useEffect(() => {
      if (pathname === '/explorar') {
          const pendingVal = sessionStorage.getItem('pending-search-val');
          if (pendingVal !== null) {
              // Restore keystrokes that happened while navigating
              setInputValue(pendingVal);
              lastUpdatedUrlSearch.current = pendingVal;
              sessionStorage.removeItem('pending-search-val');
              
              // Ensure the URL catches up to the restored keystrokes
              const params = new URLSearchParams(searchParams.toString());
              if (pendingVal.trim()) {
                  params.set('search', pendingVal);
              } else {
                  params.delete('search');
              }
              router.replace(`/explorar?${params.toString()}`);
          } else if (currentSearch !== lastUpdatedUrlSearch.current) {
              setInputValue(currentSearch);
              lastUpdatedUrlSearch.current = currentSearch;
          }
      } else {
          setInputValue('');
          lastUpdatedUrlSearch.current = '';
          sessionStorage.removeItem('pending-search-val');
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, currentSearch]);

  // Restore focus if coming from another page's auto-navigate
  useEffect(() => {
      if (typeof window !== 'undefined' && sessionStorage.getItem('focus-search') === 'true') {
          sessionStorage.removeItem('focus-search');
          if (inputRef.current) {
              inputRef.current.focus();
              const len = inputRef.current.value.length;
              inputRef.current.setSelectionRange(len, len);
          }
      }
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('serivia-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val); // Update immediately for UI
    sessionStorage.setItem('pending-search-val', val); // Save keystrokes instantly!
    
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    
    debounceTimer.current = setTimeout(() => {
        if (pathname === '/explorar') {
            const params = new URLSearchParams(searchParams.toString());
            if (val.trim()) {
                params.set('search', val);
            } else {
                params.delete('search');
            }
            lastUpdatedUrlSearch.current = val; // Mark that WE caused this URL change
            router.replace(`/explorar?${params.toString()}`);
        } else {
            if (val.trim()) {
                sessionStorage.setItem('focus-search', 'true');
                lastUpdatedUrlSearch.current = val;
                router.push(`/explorar?search=${encodeURIComponent(val)}`);
            }
        }
    }, 200); // 200ms debounce
  };

  const handleSearchSubmit = () => {
      if (pathname !== '/explorar') {
          if (inputValue.trim()) {
              router.push(`/explorar?search=${encodeURIComponent(inputValue)}`);
          } else {
              router.push('/explorar');
          }
      }
  };

  return (
    <header 
      className="topbar-wrapper transition-all duration-300 relative z-[100]"
      style={{
        background: isScrolled ? 'rgba(11, 15, 25, 0.6)' : 'transparent',
        backdropFilter: isScrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: isScrolled ? 'blur(20px)' : 'none',
        borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        boxShadow: isScrolled ? '0 2px 12px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      {/* Left side: Category Dropdown */}
      {pathname !== '/explorar' && (
        <div className="flex items-center gap-6 shrink-0 relative z-50">
          <div className="w-34">
              <CustomSelect 
                  options={[
                      { id: '/explorar', name: 'Explorar' },
                      ...CONTENT_TYPES_LIST.map(t => ({
                          id: `/explorar?type=${t}`,
                          name: getContentTypeLabel(t),
                          icon: getContentTypeIcon(t, 16)
                      }))
                  ]}
                  value="/explorar"
                  onChange={(val) => val && router.push(String(val))}
                  placeholder="Explorar"
              />
          </div>
        </div>
      )}

      {/* Center: Search */}
      {!pathname.startsWith('/film') && (
          <div className="topbar-search hidden md:block w-full max-w-xl mx-8">
            <div className="relative">
                <button 
                    onClick={handleSearchSubmit}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-[var(--text-main)] transition z-10"
                    title="Buscar"
                >
                    <Search size={18} />
                </button>
                <input 
                    ref={inputRef}
                    type="text" 
                    placeholder="Películas, series, shows..." 
                    value={inputValue}
                    onChange={handleSearchChange}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchSubmit();
                    }}
                    className="w-full bg-[var(--bg-panel)] rounded-full py-3.5 pl-12 pr-6 text-sm placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                    style={{
                        border: theme === 'dark' ? '2px solid rgba(255,255,255,0.5)' : (isScrolled ? '1px solid rgba(255,255,255,0.4)' : '1px solid var(--border-subtle)'),
                        color: theme === 'dark' ? '#ffffff' : (isScrolled ? '#ffffff' : 'var(--text-main)'),
                        fontWeight: theme === 'dark' ? '600' : 'normal',
                    }}
                />
            </div>
          </div>
      )}

      {/* Right side: Theme & Profile */}
      <div className="flex items-center gap-5">
        <button 
            onClick={toggleTheme}
            className="relative w-10 h-10 rounded-xl bg-[var(--bg-panel)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition shadow-inner"
            title="Cambiar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {user ? (
          <div className="relative" ref={userMenuRef}>
            <div 
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 cursor-pointer group bg-[var(--bg-panel)] pl-2 pr-4 py-1.5 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all shadow-inner"
            >
              <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.email || 'Yuki')}`} 
                  alt="Profile" 
                  className="w-9 h-9 rounded-full border border-[var(--border-strong)] object-cover"
              />
              <div className="hidden sm:flex flex-col justify-center">
                <span className="text-sm font-bold text-[var(--text-main)] group-hover:text-[var(--color-primary)] transition-colors leading-tight">{user.name || user.email}</span>
                <span className="text-[10px] text-[var(--color-primary)] font-black uppercase tracking-wider leading-tight mt-0.5">{user.role}</span>
              </div>
              <ChevronDown size={16} className={`text-[var(--text-muted)] hidden sm:block ml-1 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-xl overflow-hidden py-2 z-50!">
                <Link 
                  href="/perfiles"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-white/5 transition-all"
                  style={{ textDecoration: 'none' }}
                >
                  <User size={16} />
                  Mi Perfil
                </Link>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 transition-all text-left"
                >
                  <LogOut size={16} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/auth/login" className="bg-[var(--color-primary)] text-black px-5 py-2 rounded-full font-bold text-sm hover:brightness-110 transition">
            Iniciar Sesión
          </Link>
        )}
      </div>
    </header>
  );
}
