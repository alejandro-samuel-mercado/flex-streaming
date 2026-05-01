'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface PlatformData {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    contents: {
        id: string;
        slug: string;
        translations: { title: string; language: string }[];
        thumbnails: { url: string; type: string }[];
    }[];
}

interface PlatformMarqueeProps {
    platforms: PlatformData[];
}

export default function PlatformMarquee({ platforms }: PlatformMarqueeProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    if (platforms.length === 0) return null;

    // Duplicate platforms for infinite scroll effect
    const duplicated = [...platforms, ...platforms, ...platforms];

    return (
        <section className="platform-marquee-section" id="platforms-section" >
            <div className="section-header">
                <h2 className="section-title">
                    <span className="section-title-accent">Plataformas</span> Disponibles
                </h2>
                <p className="section-subtitle">Explora contenido de las mejores plataformas</p>
            </div>

            <div className="platform-marquee-container" ref={containerRef}>
                <div className="platform-marquee-track">
                    {duplicated.map((platform, idx) => (
                        <div 
                            key={`${platform.id}-${idx}`} 
                            className="platform-marquee-item"
                        >
                            <Link
                                href={`/explorar?platformId=${platform.id}`}
                                className="platform-marquee-card"
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {platform.logoUrl ? (
                                    <img
                                        src={platform.logoUrl}
                                        alt={platform.name}
                                        className="platform-marquee-logo"
                                        loading="lazy"
                                    />
                                ) : (
                                    <span className="platform-marquee-name">{platform.name}</span>
                                )}

                                {/* Hover popup with content */}
                                {hoveredIndex === idx && platform.contents.length > 0 && (
                                    <motion.div
                                        className="platform-popup"
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <div className="platform-popup-header">
                                            <span className="platform-popup-title">{platform.name}</span>
                                            <span className="platform-popup-count">{platform.contents.length} títulos</span>
                                        </div>
                                        <div className="platform-popup-grid">
                                            {platform.contents.slice(0, 6).map(content => (
                                                <div
                                                    key={`${platform.id}-${content.id}`}
                                                    className="platform-popup-item"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        window.location.href = `/film/${content.id}`;
                                                    }}
                                                >
                                                    {content.thumbnails[0]?.url ? (
                                                        <img
                                                            src={content.thumbnails[0].url}
                                                            alt={content.translations[0]?.title || ''}
                                                            className="platform-popup-thumb"
                                                        />
                                                    ) : (
                                                        <div className="platform-popup-placeholder" />
                                                    )}
                                                    <span className="platform-popup-item-title">
                                                        {content.translations[0]?.title || 'Sin título'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section >
    );
}
