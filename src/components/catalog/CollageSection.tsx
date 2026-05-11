'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, LogIn, Heart } from 'lucide-react';

interface CollageItem {
    id: string;
    posterUrl: string | null;
    title: string;
}

interface CollageSectionProps {
    items: CollageItem[];
    isLoggedIn: boolean;
    hasPlan: boolean;
}

export default function CollageSection({ items, isLoggedIn, hasPlan }: CollageSectionProps) {
    if (items.length === 0) return null;

    return (
        <section className="collage-section" id="collage-section">
            {/* Background collage grid */}
            <div className="collage-grid" aria-hidden="true">
                {items.slice(0, 12).map((item, i) => (
                    <motion.div
                        key={item.id}
                        className="collage-grid-item"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                    >
                        <img
                            src={item.posterUrl || `https://picsum.photos/300/450?random=${i}`}
                            alt={item.title}
                            className="collage-grid-img"
                            loading="lazy"
                        />
                    </motion.div>
                ))}
            </div>

            {/* Overlay */}
            <div className="collage-overlay" />

            {/* CTA Content */}
            <div className="collage-cta">
                {isLoggedIn ? (
                    /* Logged in: Thank you message / active member */
                    <motion.div
                        className="collage-cta-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="collage-icon-wrap collage-icon-wrap--thanks">
                            <Heart size={32} fill="#E50914" />
                        </div>
                        <h2 className="collage-cta-title">¡Gracias por ser parte de Nuba!</h2>
                        <p className="collage-cta-desc">
                            Tu apoyo nos permite seguir trayéndote el mejor contenido.
                            Disfruta de todo lo que tenemos para ti.
                        </p>
                    </motion.div>
                ) : (
                    /* Not logged in: Login CTA */
                    <motion.div
                        className="collage-cta-content"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="collage-icon-wrap">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="collage-cta-title">Tu próxima película favorita te espera</h2>
                        <p className="collage-cta-desc">
                            Accede a un catálogo inmenso de películas, series, animes y más.
                            Crea tu cuenta gratis y empieza a disfrutar.
                        </p>
                        <div className="collage-cta-actions">
                            <Link href="/login" className="collage-cta-btn collage-cta-btn--primary">
                                <LogIn size={18} />
                                Iniciar Sesión
                            </Link>
                            <Link href="/login" className="collage-cta-btn collage-cta-btn--secondary">
                                <Sparkles size={18} />
                                Suscribirme
                            </Link>
                        </div>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
