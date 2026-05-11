'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
  const [query, setQuery] = useState('');

  // Simulación estática para FASE 2
  const mockResults = Array.from({ length: 6 }).map((_, i) => ({
    id: i + 1,
    title: `Resultado Búsqueda ${i + 1}`,
    posterUrl: `https://images.unsplash.com/photo-${1500001000000 + i * 100000}?auto=format&fit=crop&w=400&q=80`,
    match: Math.floor(Math.random() * 20 + 80) + '%',
  }));

  return (
    <div className="min-h-screen bg-[#0A0A0F] pt-24 text-white flex flex-col relative !px-4 sm:!px-[6vw] !pb-[20vh]">
      {/* Cinematic subtle glow at the top */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#E50914]/10 via-[#0A0A0F]/80 to-[#0A0A0F] pointer-events-none" />

      <div className="w-full border-b border-gray-800/60 pb-6 mb-8 top-0 z-40 sticky pt-4 backdrop-blur-md bg-[#0A0A0F]/70">
        <div className="relative max-w-4xl mx-auto flex items-center">
          <Search className="absolute left-4 text-gray-400" size={28} />
          <input 
            type="text" 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Títulos, personas, géneros..." 
            className="w-full bg-[#333] text-white text-xl md:text-2xl outline-none placeholder-gray-400 pl-14 pr-12 py-4 rounded"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-4 text-gray-400 hover:text-white">
              <X size={28} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full">
        <AnimatePresence>
          {!query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-gray-400 text-center py-20">
              <Search size={64} className="mx-auto mb-4 opacity-50" />
              <p className="text-xl">Encuentra tus películas, series o actores favoritos.</p>
            </motion.div>
          )}

          {query && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
              <h2 className="text-gray-400 mb-6 font-medium text-lg">Explorando títulos relacionados a "{query}"</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-10">
                {mockResults.map((movie) => (
                  <Link href={`/film/${movie.id}`} key={movie.id} className="poster-card block group origin-center transition-transform hover:scale-105 hover:z-10 duration-300">
                    <div className="relative aspect-[2/3] w-full bg-[#222] rounded overflow-hidden shadow-xl">
                      <img 
                        src={movie.posterUrl} 
                        alt={movie.title} 
                        className="w-full h-full object-cover group-hover:brightness-110 transition"
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-200">
                      {movie.title}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
