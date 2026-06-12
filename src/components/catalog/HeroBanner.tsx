'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Star, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { getContentTypeLabel } from '@/lib/content-types';
import { useAuth } from '@/context/AuthContext';

interface HeroSlide {
  id: string;
  title: string;
  description: string;
  backdropUrl: string;
  rating?: number | null;
  year?: number | null;
  duration?: number | null;
  ageRating?: string;
  type?: string;
  genres?: string[];
}

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export default function HeroCarousel({ slides }: HeroCarouselProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 7000);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return;
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [slides.length, resetTimer]);

  const goTo = (idx: number) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
    resetTimer();
  };

  const goNext = () => {
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % slides.length);
    resetTimer();
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
    resetTimer();
  };

  if (slides.length === 0) return null;

  const slide = slides[currentIndex];
  const formatDuration = (mins?: number | null) => {
    if (!mins) return null;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  };

  const typeLabel = (type?: string) => {
    return getContentTypeLabel(type);
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0, scale: 1.05 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? '-30%' : '30%', opacity: 0, scale: 0.98 }),
  };

  return (
    <>
      {slides.length > 0 && (
        <link rel="preload" as="image" href={slides[0].backdropUrl} />
      )}
      <section className="hero-carousel" id="hero-carousel">
      {/* Particles */}
      <div className="hero-particles" aria-hidden="true">
        {Array.from({ length: 30 }).map((_, i) => (
          <span
            key={i}
            className="hero-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
              opacity: 0.2 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>

      {/* Background slides */}
      <AnimatePresence custom={direction} mode="wait">
        <motion.div
          key={slide.id}
          className="hero-carousel-bg"
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div
            className="hero-carousel-img"
            style={{ backgroundImage: `url(${slide.backdropUrl})` }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Cinematic overlays */}
      <div className="hero-carousel-vignette" />
      <div className="hero-carousel-grain" />

      {/* Content */}
      <div className="hero-carousel-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id + '-content'}
            className="hero-carousel-info"
            initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            {/* Badge */}
            <div className="hero-badge-row">
              {slide.type && (
                <span className="hero-type-badge">
                  <Sparkles size={12} />
                  {typeLabel(slide.type)}
                </span>
              )}
              {slide.genres && slide.genres.length > 0 && (
                <span className="hero-genre-badge">{slide.genres.slice(0, 2).join(' • ')}</span>
              )}
            </div>

            {/* Title */}
            <h1 className="hero-carousel-title">{slide.title}</h1>

            {/* Metadata */}
            <div className="hero-carousel-meta">
              {slide.rating && slide.rating > 0 && (
                <span className="hero-rating">
                  <Star size={14} fill="#f5c518" stroke="#f5c518" />
                  {slide.rating.toFixed(1)}
                </span>
              )}
              {slide.year && <span className="hero-year">{slide.year}</span>}
              {slide.ageRating && <span className="hero-age-badge">{slide.ageRating}</span>}
              {formatDuration(slide.duration) && (
                <span className="hero-duration">{formatDuration(slide.duration)}</span>
              )}
            </div>

            {/* Description */}
            <p className="hero-carousel-desc">{slide.description}</p>

            {/* Actions */}
            <div className="hero-carousel-actions">
              <Link href={`/film/${slide.id}`} className="hero-btn-play" id="hero-play-btn">
                <Play size={20} fill="white" />
                Reproducir
              </Link>
              {!user && (
                <Link href="/login" className="hero-btn-subscribe" id="hero-subscribe-btn">
                  <Sparkles size={18} />
                  Suscribirse
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button className="hero-nav-arrow hero-nav-prev" onClick={goPrev} aria-label="Anterior">
            <ChevronLeft size={28} />
          </button>
          <button className="hero-nav-arrow hero-nav-next" onClick={goNext} aria-label="Siguiente">
            <ChevronRight size={28} />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="hero-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === currentIndex ? 'hero-dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            >
              {i === currentIndex && (
                <motion.span
                  className="hero-dot-progress"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 7, ease: 'linear' }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Bottom wave */}
      <div className="hero-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,30 1440,60 L1440,120 L0,120 Z" fill="var(--color-bg)" />
        </svg>
      </div>
    </section>
    </>
  );
}
