'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, Globe, ExternalLink, AtSign, Video, MapPin } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

interface FooterProps {
    backdropUrl?: string;
}

export default function Footer({ backdropUrl }: FooterProps) {
    const bgImage = backdropUrl || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2525&auto=format&fit=crop';

    const [config, setConfig] = useState<Record<string, string>>({});

    useEffect(() => {
        fetch(API_ROUTES.HOMEPAGE.DATA)
            .then(res => res.json())
            .then(json => {
                if (json.success && json.data.config) {
                    setConfig(json.data.config);
                }
            })
            .catch(err => console.error('Failed to fetch footer config', err));
    }, []);

    const siteName = config['SITE_NAME'] || 'Nuba';
    const email = config['CONTACT_EMAIL'] || 'soporte@nuba.com';
    const phone = config['CONTACT_PHONE'] || '+54 9 11 0000-0000';
    const location = config['CONTACT_LOCATION'] || 'Latinoamérica';

    const ig = config['SOCIAL_INSTAGRAM'];
    const fb = config['SOCIAL_FACEBOOK'];
    const tw = config['SOCIAL_TWITTER'];
    const yt = config['SOCIAL_YOUTUBE'];

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
                            <img src="/logo-nuba.png" alt={siteName} className="cinema-footer-logo-img" />
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

                            <Link href="/favoritos" className="cinema-footer-link">Favoritos</Link>

                        </div>

                        <div className="cinema-footer-col">
                            <h4 className="cinema-footer-col-title">Contacto</h4>
                            <span className="cinema-footer-link cinema-footer-link--info">
                                <Mail size={14} /> {email}
                            </span>
                            <span className="cinema-footer-link cinema-footer-link--info">
                                <Phone size={14} /> {phone}
                            </span>
                            <span className="cinema-footer-link cinema-footer-link--info">
                                <MapPin size={14} /> {location}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Social + divider */}
                <div className="cinema-footer-divider" />

                <div className="cinema-footer-bottom">
                    <div className="cinema-footer-social">
                        {ig && <a href={ig} target="_blank" rel="noopener noreferrer" className="cinema-footer-social-btn" aria-label="Instagram"><AtSign size={18} /></a>}
                        {fb && <a href={fb} target="_blank" rel="noopener noreferrer" className="cinema-footer-social-btn" aria-label="Facebook"><Globe size={18} /></a>}
                        {tw && <a href={tw} target="_blank" rel="noopener noreferrer" className="cinema-footer-social-btn" aria-label="Twitter"><ExternalLink size={18} /></a>}
                        {yt && <a href={yt} target="_blank" rel="noopener noreferrer" className="cinema-footer-social-btn" aria-label="YouTube"><Video size={18} /></a>}
                    </div>

                    <p className="cinema-footer-copy">
                        © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </footer>
    );
}
