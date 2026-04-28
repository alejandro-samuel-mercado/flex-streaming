'use client';

import Link from 'next/link';
import { Search, Bell, ChevronDown, Menu, X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/explorar/series', label: 'Series' },
  { href: '/explorar/peliculas', label: 'Películas' },
  { href: '/explorar/anime', label: 'Anime' },
  { href: '/lista', label: 'Mi lista' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 50);
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="nav-logo">
            PELIPLUS
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex gap-5 text-sm font-medium">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--color-text-muted)] hover:text-white transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-white">
          {/* Search Toggle */}
          <button
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
            className="hover:text-[var(--color-text-muted)] transition"
            aria-label="Buscar"
          >
            {searchOpen ? <X size={22} /> : <Search size={22} />}
          </button>

          {/* Search Bar (inline expand) */}
          <div className={`overflow-hidden transition-all duration-300 ${searchOpen ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}>
            <form action="/buscar" className="flex">
              <input
                type="text"
                name="q"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar títulos…"
                className="w-full bg-black/60 border border-white/30 px-3 py-1.5 text-sm rounded-sm
                           focus:border-white focus:outline-none placeholder:text-gray-500"
                autoFocus={searchOpen}
              />
            </form>
          </div>

          <Link href="/login" className="hidden md:block text-sm font-semibold hover:text-[var(--color-text-muted)] transition">
            Iniciar sesión
          </Link>

          <Bell size={22} className="cursor-pointer hover:text-[var(--color-text-muted)] transition hidden md:block" />

          {/* Profile Avatar */}
          <div className="hidden md:flex items-center gap-1 cursor-pointer group">
            <div className="w-8 h-8 rounded-[var(--radius-md)] border border-transparent group-hover:border-white transition-colors overflow-hidden">
              <img
                src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/84c20033850498.56ba69ac290ea.png"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <ChevronDown size={16} className="group-hover:rotate-180 transition-transform duration-300 text-white/60" />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden hover:text-[var(--color-text-muted)] transition"
            aria-label="Menú"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 text-2xl font-medium md:hidden animate-fadeIn">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-5 right-5"
            aria-label="Cerrar"
          >
            <X size={28} />
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-white hover:text-[var(--color-primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-4 mt-4 flex flex-col gap-4 items-center text-base">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-text-muted)] hover:text-white">
              Iniciar sesión
            </Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary-accent">
              Registrarse
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
