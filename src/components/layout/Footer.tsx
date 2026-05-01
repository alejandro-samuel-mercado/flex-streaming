'use client';

import Link from 'next/link';
import { Mail, Phone, Globe, ExternalLink, AtSign, Video, MapPin } from 'lucide-react';

interface FooterProps {
  backdropUrl?: string;
}

export default function Footer({ backdropUrl }: FooterProps) {
  const bgImage = backdropUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop';

  return (
    <footer className="cinema-footer" id="footer">
      {/* Background image with B&W filter */}
      <div className="cinema-footer-bg">
        <img
          src={bgImage}
          alt=""
          className="cinema-footer-bg-img"
          loading="lazy"
        />
      </div>
      <div className="cinema-footer-overlay" />

      {/* Wave separator at top */}
      <div className="cinema-footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,0 L0,0 Z" fill="var(--color-bg)" />
        </svg>
      </div>

      <div className="cinema-footer-content">
        {/* Top area */}
        <div className="cinema-footer-top">
          <div className="cinema-footer-brand">
            <Link href="/" className="cinema-footer-logo">
              <img src="/logo-flex.png" alt="FlexStreaming" className="cinema-footer-logo-img" />
            </Link>
            <p className="cinema-footer-tagline">
              Tu destino de entretenimiento. Miles de películas, series, animes y más al alcance de un clic.
            </p>
          </div>

          <div className="cinema-footer-links-grid">
            <div className="cinema-footer-col">
              <h4 className="cinema-footer-col-title">Navegar</h4>
              <Link href="/" className="cinema-footer-link">Inicio</Link>
              <Link href="/explorar/peliculas" className="cinema-footer-link">Películas</Link>
              <Link href="/explorar/series" className="cinema-footer-link">Series</Link>
              <Link href="/explorar/anime" className="cinema-footer-link">Anime</Link>
            </div>

            <div className="cinema-footer-col">
              <h4 className="cinema-footer-col-title">Cuenta</h4>
              <Link href="/login" className="cinema-footer-link">Iniciar Sesión</Link>
              <Link href="/register" className="cinema-footer-link">Registrarse</Link>
              <Link href="/favoritos" className="cinema-footer-link">Favoritos</Link>
              <a href="#planes" className="cinema-footer-link">Planes</a>
            </div>

            <div className="cinema-footer-col">
              <h4 className="cinema-footer-col-title">Contacto</h4>
              <span className="cinema-footer-link cinema-footer-link--info">
                <Mail size={14} /> soporte@flexstreaming.com
              </span>
              <span className="cinema-footer-link cinema-footer-link--info">
                <Phone size={14} /> +54 9 11 0000-0000
              </span>
              <span className="cinema-footer-link cinema-footer-link--info">
                <MapPin size={14} /> Latinoamérica
              </span>
            </div>
          </div>
        </div>

        {/* Social + divider */}
        <div className="cinema-footer-divider" />

        <div className="cinema-footer-bottom">
          <div className="cinema-footer-social">
            <a href="#" className="cinema-footer-social-btn" aria-label="Instagram"><AtSign size={18} /></a>
            <a href="#" className="cinema-footer-social-btn" aria-label="Facebook"><Globe size={18} /></a>
            <a href="#" className="cinema-footer-social-btn" aria-label="Twitter"><ExternalLink size={18} /></a>
            <a href="#" className="cinema-footer-social-btn" aria-label="YouTube"><Video size={18} /></a>
          </div>

          <p className="cinema-footer-copy">
            © {new Date().getFullYear()} FlexStreaming. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
