import Link from 'next/link';

export default async function MyListPage() {
  // Simulación de datos para la completitud visual
  const myFavorites = Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    title: `Mi Título Favorito ${i + 1}`,
    posterUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 200000}?auto=format&fit=crop&w=400&q=80`,
    match: Math.floor(Math.random() * 20 + 80) + '%',
  }));

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-16 relative">
      {/* Cinematic glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-purple-900/10 via-[#0A0A0F]/80 to-[#0A0A0F] pointer-events-none" />

      <div className="relative pt-32 max-w-[1600px] mx-auto w-full" style={{ paddingLeft: '6vw', paddingRight: '6vw', paddingBottom: '20vh' }}>
        <div className="mb-12">
          <h1 className="text-6xl font-bold tracking-tighter text-white" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
            Mi Lista
          </h1>
          <p className="text-gray-400 mt-2 text-sm max-w-lg">
            Tus títulos guardados para ver más tarde.
          </p>
        </div>

        {myFavorites.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-10">
            {myFavorites.map((movie) => (
              <Link href={`/film/${movie.id}`} key={movie.id} className="poster-card block group origin-center transition-transform hover:scale-105 hover:z-10 duration-300">
                <div className="relative aspect-[2/3] w-full bg-[#141414] rounded overflow-hidden shadow-xl">
                  <img 
                    src={movie.posterUrl} 
                    alt={movie.title} 
                    className="w-full h-full object-cover group-hover:brightness-110 transition"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-1">
                  <h3 className="font-semibold text-sm text-gray-200 line-clamp-1">{movie.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 border border-gray-800/50 rounded-lg bg-black/20 backdrop-blur-md">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
            <h2 className="text-xl font-medium text-white mb-2">Aún no agregaste títulos.</h2>
            <p>Añade películas y series a tu lista para encontrarlas fácilmente después.</p>
            <Link href="/explorar/peliculas" className="mt-6 bg-white text-black px-6 py-2 rounded font-bold hover:bg-gray-200 transition">
              Descubrir contenido
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
