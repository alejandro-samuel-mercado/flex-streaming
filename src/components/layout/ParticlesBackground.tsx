'use client';

import React, { useEffect, useState } from 'react';

export default function ParticlesBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  // Generate random particles
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDuration: `${Math.random() * 5 + 3}s`,
    animationDelay: `${Math.random() * 2}s`,
    opacity: Math.random() * 0.6 + 0.2,
    size: Math.random() * 3 + 1,
  }));

  return (
    <div className="particles-container" aria-hidden="true">
      {/* Moving background lights */}
      <div className="bg-light bg-light-1" />
      <div className="bg-light bg-light-2" />
      <div className="bg-light bg-light-3" />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            top: p.top,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
