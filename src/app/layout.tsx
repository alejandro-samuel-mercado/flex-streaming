import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/layout/ThemeProvider';

export const metadata: Metadata = {
    title: {
        default: 'FlexStreaming— Streaming & Alquiler de Películas',
        template: '%s | FlexStreaming',
    },
    description: 'La mejor plataforma de streaming y alquiler de películas, series, animes y más. Contenido premium para toda Latinoamérica.',
    keywords: ['streaming', 'películas', 'series', 'anime', 'alquiler', 'latinoamérica'],
    openGraph: {
        type: 'website',
        locale: 'es_LA',
        siteName: 'PeliPlus',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" data-theme="dark" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}
