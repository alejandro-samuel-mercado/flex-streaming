'use client';

import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import Link from 'next/link';

interface HeroBannerProps {
  id: string;
  title: string;
  description: string;
  backdropUrl: string;
  match?: string;
  year?: string;
  ageRating?: string;
  duration?: string;
  quality?: string;
  type?: string;
}

export default function HeroBanner({
  id, title, description, backdropUrl,
  match, year, ageRating, duration, quality, type,
}: HeroBannerProps) {
  return (
    <section className="hero-cinematic">
      {/* Background Image */}
      <div
        className="hero-bg"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      />
      <div className="hero-vignette" />

      {/* Content */}
      <div className="hero-content">
        {type && (
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge badge-trending">#1 EN TENDENCIAS</span>
            {type === 'SERIES' && (
              <span className="badge badge-new">NUEVO EPISODIO</span>
            )}
          </motion.div>
        )}

        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {title}
        </motion.h1>

        <motion.div
          className="hero-metadata"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {match && <span className="text-[var(--color-success)] font-bold">{match} para ti</span>}
          {year && <span>{year}</span>}
          {ageRating && <span className="rating-badge">{ageRating}</span>}
          {duration && <span>{duration}</span>}
          {quality && <span className="quality-badge">{quality}</span>}
        </motion.div>

        <motion.p
          className="hero-desc"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="hero-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Link href={`/watch/${id}`} className="btn-play">
            <Play size={22} fill="black" />
            Reproducir
          </Link>
          <Link href={`/film/${id}`} className="btn-info">
            <Info size={22} />
            Más información
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
