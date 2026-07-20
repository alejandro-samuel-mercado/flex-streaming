export const MOCK_GENRES = [
    { id: 'adventure', name: 'Aventura' },
    { id: 'action', name: 'Acción' },
    { id: 'comedy', name: 'Comedia' },
    { id: 'crime', name: 'Crimen' },
    { id: 'drama', name: 'Drama' },
    { id: 'fantasy', name: 'Fantasía' },
    { id: 'horror', name: 'Terror' },
    { id: 'scifi', name: 'Ciencia Ficción' },
    { id: 'animation', name: 'Animación' },
    { id: 'documentary', name: 'Documental' },
    { id: 'family', name: 'Familia' },
    { id: 'mystery', name: 'Misterio' },
    { id: 'romance', name: 'Romance' },
    { id: 'thriller', name: 'Suspenso' }
];

export const MOCK_FILMS = [
    {
        id: 'mock-1',
        slug: 'dune-part-two',
        title: 'Dune: Part Two',
        rating: 8.8,
        releaseYear: 2024,
        type: 'MOVIE',
        duration: 166,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'action', name: 'Acción' } }]
    },
    {
        id: 'mock-2',
        slug: 'poor-things',
        title: 'Poor Things',
        rating: 8.4,
        releaseYear: 2023,
        type: 'MOVIE',
        duration: 141,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'comedy', name: 'Comedia' } }]
    },
    {
        id: 'mock-3',
        slug: 'oppenheimer',
        title: 'Oppenheimer',
        rating: 8.6,
        releaseYear: 2023,
        type: 'MOVIE',
        duration: 180,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'drama', name: 'Drama' } }]
    },
    {
        id: 'mock-4',
        slug: 'shogun',
        title: 'Shōgun',
        rating: 9.1,
        releaseYear: 2024,
        type: 'SERIES',
        duration: 60,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'drama', name: 'Drama' } }]
    },
    {
        id: 'mock-5',
        slug: 'mission-impossible-dead-reckoning',
        title: 'Mission: Impossible',
        rating: 7.9,
        releaseYear: 2023,
        type: 'MOVIE',
        duration: 163,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1509225770129-fbcf8a696c00?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1509225770129-fbcf8a696c00?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'action', name: 'Acción' } }]
    },
    {
        id: 'mock-6',
        slug: 'lilo-stitch',
        title: 'Lilo & Stitch',
        rating: 8.1,
        releaseYear: 2002,
        type: 'MOVIE',
        duration: 85,
        thumbnails: [
            { type: 'POSTER', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=600' },
            { type: 'BACKDROP', url: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=1600' }
        ],
        genres: [{ genre: { id: 'adventure', name: 'Aventura' } }]
    }
];
