'use client';
import React, { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES, resolveImageUrl } from '@/lib/api-routes';
import { Loader2, Check, X, FileWarning } from 'lucide-react';

export default function RequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(API_ROUTES.REQUESTS.ADMIN_LIST);
            const data = await res.json();
            if (data.success) {
                setRequests(data.data.requests || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, []);

    const updateStatus = async (id: string, status: string) => {
        try {
            await adminFetch(API_ROUTES.REQUESTS.ADMIN_STATUS(id), {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });
            loadRequests();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="adm-container">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <FileWarning size={32} className="text-yellow-400" />
                        Solicitudes y Reportes
                    </h1>
                    <p className="text-[var(--adm-muted)] mt-2">Gestiona las solicitudes de contenido y reportes de fallas de los usuarios.</p>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[var(--color-primary)]" /></div>
            ) : (
                <div className="bg-[#0A0A0F] border border-white/10 rounded-2xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Tipo</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Usuario</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Referencia</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Mensaje</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Estado</th>
                                <th className="p-4 text-xs font-bold text-white/50 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {requests.map((req) => (
                                <tr key={req.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${req.type === 'REQUEST' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {req.type === 'REQUEST' ? 'SOLICITUD' : 'REPORTE'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-white font-medium">{req.user?.name || req.user?.username}</p>
                                        <p className="text-xs text-white/50">{new Date(req.createdAt).toLocaleDateString()}</p>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {req.tmdbPoster && <img src={resolveImageUrl(req.tmdbPoster)} className="w-8 h-12 object-cover rounded-md" />}
                                            <div className="max-w-[150px]">
                                                <p className="text-sm text-white font-semibold truncate" title={req.tmdbTitle || req.content?.title}>{req.tmdbTitle || req.content?.title || 'N/A'}</p>
                                                {req.tmdbType && <p className="text-xs text-white/50 uppercase">{req.tmdbType}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <p className="text-sm text-white/70 line-clamp-2 max-w-[300px]" title={req.message}>{req.message || '-'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-white/50 uppercase">{req.status}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {req.status === 'PENDING' && (
                                                <>
                                                    <button onClick={() => updateStatus(req.id, 'RESOLVED')} className="p-2 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded-lg transition-colors" title="Marcar Resuelto">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => updateStatus(req.id, 'REJECTED')} className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg transition-colors" title="Rechazar">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-white/50">
                                        No hay solicitudes ni reportes registrados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
