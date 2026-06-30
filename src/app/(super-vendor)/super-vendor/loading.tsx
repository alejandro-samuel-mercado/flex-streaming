
import { Loader2 } from 'lucide-react';

export default function AdminLoading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] !gap-4 animate-in fade-in duration-500">
            <div className="relative">
                <Loader2 className="animate-spin text-[var(--color-primary)]" size={42} strokeWidth={1.5} />
                <div className="absolute inset-0 blur-xl bg-[var(--color-primary)] opacity-20 animate-pulse"></div>
            </div>
            <div className="flex flex-col items-center !gap-1">
                <h3 className="text-white font-medium text-lg tracking-wide">Cargando sección</h3>
                <p className="text-[var(--adm-muted)] text-sm">Preparando datos del panel...</p>
            </div>
        </div>
    );
}
