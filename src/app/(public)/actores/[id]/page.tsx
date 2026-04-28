import Link from 'next/link';

export default async function ActorProfilePage({ params }: { params: { id: string } }) {
  const actor = {
    name: 'Marcus Johnson',
    biography: 'A legendary actor known for taking characters in survival and dystopian thrillers to the edge of humanity. His performances are marked by intense realism and a terrifyingly grounded approach.',
    photoUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=800&auto=format&fit=crop',
    nationality: 'American',
    birthDate: '1984-05-12',
    filmography: [
      { id: '1', title: 'The Sentinel', year: 2026, posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=800&auto=format&fit=crop' },
      { id: '2', title: 'Apocalypse Now', year: 2024, posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop' },
    ]
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#E50914]/10 via-[#0A0A0F]/80 to-[#0A0A0F] pointer-events-none" />

      <main className="relative pt-32 max-w-6xl mx-auto w-full" style={{ paddingLeft: '6vw', paddingRight: '6vw', paddingBottom: '20vh' }}>
        <div className="flex flex-col md:flex-row gap-12">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="rounded-xl overflow-hidden aspect-[2/3] w-full max-w-sm mx-auto shadow-2xl">
              <img src={actor.photoUrl} alt={actor.name} className="w-full h-full object-cover" />
            </div>
          </div>

          <div className="w-full md:w-2/3">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
              {actor.name}
            </h1>
            
            <div className="text-gray-400 mb-6 flex flex-col gap-1 text-sm border-l-2 border-red-600 pl-4 bg-gray-900/10 py-2">
              <p><strong className="text-gray-200">Nacionalidad:</strong> {actor.nationality}</p>
              <p><strong className="text-gray-200">Nacimiento:</strong> {actor.birthDate}</p>
            </div>

            <div className="mb-12">
              <h2 className="text-xl font-bold mb-3 border-b border-gray-800 pb-2">Biografía</h2>
              <p className="text-gray-300 leading-relaxed">
                {actor.biography}
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold mb-6 border-b border-gray-800 pb-2 flex items-center justify-between">
                Filmografía
                <span className="text-sm text-[#E50914] font-bold">{actor.filmography.length} TÍTULOS</span>
              </h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {actor.filmography.map(film => (
                  <Link href={`/film/${film.id}`} key={film.id} className="group transition-transform hover:scale-105 duration-300">
                    <div className="aspect-[2/3] rounded overflow-hidden mb-2 bg-[#222]">
                      <img src={film.posterUrl} alt={film.title} className="w-full h-full object-cover group-hover:brightness-110" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200 line-clamp-1">{film.title}</h3>
                    <span className="text-xs text-gray-500">{film.year}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
