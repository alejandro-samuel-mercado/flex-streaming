import React from 'react';
import { 
    Film, Tv, Monitor, Clapperboard, Play, Star, 
    Mic, Layout, Sparkles, BookOpen, Baby, 
    Users, MousePointer, FlaskConical, Clock, 
    Heart, Globe, Camera, Ghost, Theater
} from 'lucide-react';

export const CONTENT_TYPE_LABELS: Record<string, string> = {
    MOVIE: 'Película',
    SERIES: 'Serie',
    ANIME: 'Anime',
    ANIMATION: 'Animación',
    DOCUMENTARY: 'Documental',
    BIOGRAPHY: 'Biografía',
    REALITY_SHOW: 'Reality Show',
    TALK_SHOW: 'Talk Show',
    VARIETY_SHOW: 'Programa de Variedades',
    STAND_UP: 'Stand-up Comedy',
    SPECIAL: 'Especial',
    EDUCATIONAL: 'Contenido Educativo',
    KIDS: 'Infantil',
    FAMILY: 'Familiar',
    INTERACTIVE: 'Contenido Interactivo',
    EXPERIMENTAL: 'Experimental / Artístico',
    DOCUDRAMA: 'Docudrama',
    NOVELA: 'Telenovela',
    SHORT: 'Cortometraje',
};

export const getContentTypeLabel = (type?: string): string => {
    return CONTENT_TYPE_LABELS[type || ''] || type || 'Contenido';
};

export const getContentTypeIcon = (type: string, size = 18) => {
    switch (type) {
        case 'MOVIE': return <Film size={size} />;
        case 'SERIES': return <Tv size={size} />;
        case 'ANIME': return <Monitor size={size} />;
        case 'ANIMATION': return <Play size={size} />;
        case 'DOCUMENTARY': return <Globe size={size} />;
        case 'BIOGRAPHY': return <Star size={size} />;
        case 'REALITY_SHOW': return <Camera size={size} />;
        case 'TALK_SHOW': return <Mic size={size} />;
        case 'VARIETY_SHOW': return <Layout size={size} />;
        case 'STAND_UP': return <Mic size={size} />;
        case 'SPECIAL': return <Sparkles size={size} />;
        case 'EDUCATIONAL': return <BookOpen size={size} />;
        case 'KIDS': return <Baby size={size} />;
        case 'FAMILY': return <Users size={size} />;
        case 'INTERACTIVE': return <MousePointer size={size} />;
        case 'EXPERIMENTAL': return <FlaskConical size={size} />;
        case 'DOCUDRAMA': return <Theater size={size} />;
        case 'NOVELA': return <Heart size={size} />;
        case 'SHORT': return <Clock size={size} />;
        default: return <Play size={size} />;
    }
};

export const CONTENT_TYPES_LIST = Object.keys(CONTENT_TYPE_LABELS);
