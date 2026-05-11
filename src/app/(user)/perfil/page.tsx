'use client';
// Force HMR and Tailwind rescan

import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { User, Calendar, CreditCard, Clock, Monitor, Settings, LogOut, ChevronRight, Play } from 'lucide-react';
import Link from 'next/link';
import { resolveImageUrl, API_ROUTES } from '@/lib/api-routes';

export default function ProfilePage() {
    const { user, logout, loading } = useAuth();
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        if (user && user.profiles?.[0]) {
            const fetchHistory = async () => {
                try {
                    const res = await fetch(API_ROUTES.HISTORY.BASE, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                            'X-Profile-Id': localStorage.getItem('profileId') || user.profiles![0].id
                        }
                    });
                    const result = await res.json();
                    if (result.success && result.data) {
                        setHistory(result.data.data || []);
                    }
                } catch (err) {
                    console.error('Error fetching history:', err);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchHistory();
        }
    }, [user]);

    if (loading) return (
        <div className="min-h-screen bg-[#02040A] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!user) {
        if (typeof window !== 'undefined') window.location.href = '/login';
        return null;
    }

    const endUser = user.endUserAccount;
    const isInactivePending = endUser?.status === 'INACTIVE' && endUser?.planId;
    const remainingDays = endUser?.endDate
        ? Math.max(0, Math.ceil((new Date(endUser.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : isInactivePending && endUser?.plan
            ? (endUser.plan.durationDays + (endUser.plan.bonusDays ?? 0))
            : 0;

    return (
        <div className="!min-h-screen !bg-[#02040A] !text-white !pt-24 !pb-12 !px-4 sm:!px-8">
            <div className="!max-w-6xl !mx-auto">

                {/* Header / User Hero */}
                <div className="!relative !mb-12 !rounded-[40px] !overflow-hidden !bg-gradient-to-br !from-[#0A0F24] !to-[#02040A] !border !border-white/5 !p-8 sm:!p-12 !shadow-2xl">
                    <div className="!absolute !top-0 !right-0 !w-64 !h-64 !bg-[var(--color-primary)] !opacity-5 !blur-[120px] !-mr-32 !-mt-32"></div>

                    <div className="!flex !flex-col md:!flex-row !items-center !gap-8 !relative !z-10">
                        <div className="!w-32 !h-32 !rounded-full !bg-gradient-to-tr !from-[var(--color-primary)] !to-cyan-400 !flex !items-center !justify-center !text-black !text-5xl !font-black !shadow-[0_0_30px_rgba(0,229,255,0.3)]">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="!flex-1 !text-center md:!text-left">
                            <h1 className="!text-4xl !font-black !tracking-tight !mb-2 !uppercase">{user.name}</h1>
                            <p className="!text-gray-400 !font-medium !mb-6">{user.email}</p>
                            <div className="!flex !flex-wrap !justify-center md:!justify-start !gap-4">
                                <span className="!bg-white/5 !border !border-white/10 !px-4 !py-2 !rounded-full !text-xs !font-bold !uppercase !tracking-widest !flex !items-center !gap-2">
                                    <User size={14} className="!text-[var(--color-primary)]" /> {user.role}
                                </span>
                                {endUser && (
                                    <span className={`!px-4 !py-2 !rounded-full !text-xs !font-bold !uppercase !tracking-widest !flex !items-center !gap-2 !border ${endUser.status === 'ACTIVE' ? '!bg-green-500/10 !border-green-500/50 !text-green-500' : '!bg-red-500/10 !border-red-500/50 !text-red-500'}`}>
                                        {endUser.status}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={logout} className="!bg-red-500/10 hover:!bg-red-500 !text-red-500 hover:!text-white !border !border-red-500/20 !px-6 !py-3 !rounded-2xl !transition-all !font-bold !flex !items-center !gap-2">
                            <LogOut size={18} /> Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="!grid !grid-cols-1 lg:!grid-cols-3 !gap-8">

                    {/* Left Column: Plan & Details */}
                    <div className="lg:!col-span-1 !space-y-8">

                        {/* Plan Card */}
                        <div className="!bg-[#0A0F24]/60 !backdrop-blur-xl !border !border-white/5 !rounded-3xl !p-8 !shadow-xl">
                            <div className="!flex !items-center !gap-3 !mb-6">
                                <div className="!p-2 !bg-purple-500/20 !rounded-lg !text-purple-500"><CreditCard size={20} /></div>
                                <h3 className="!font-black !uppercase !tracking-widest !text-sm">Suscripción Activa</h3>
                            </div>

                            {endUser?.plan ? (
                                <>
                                    <div className="!mb-6 !flex !flex-col !items-start">
                                        <div className="!flex !items-end !gap-2">
                                            <p className="!text-6xl !font-black !text-[var(--color-primary)] !leading-none">{remainingDays}</p>
                                            <p className="!text-xl !font-black !text-white !mb-1">días</p>
                                        </div>
                                        
                                        <div className="!flex !flex-wrap !items-center !gap-3 !mt-4">
                                            <p className="!text-xs !text-gray-400 !font-bold !uppercase !tracking-widest">
                                                Plan: <span className="!text-white">{endUser.plan.name}</span>
                                            </p>
                                            
                                            {remainingDays > (endUser.plan.durationDays + (endUser.plan.bonusDays || 0)) * 1.5 && (
                                                <span className="!text-[10px] !font-bold !uppercase !bg-[var(--color-primary)]/20 !text-[var(--color-primary)] !border !border-[var(--color-primary)]/30 !px-2 !py-0.5 !rounded-full">
                                                    Acumulado x{Math.round(remainingDays / (endUser.plan.durationDays + (endUser.plan.bonusDays || 0)))}
                                                </span>
                                            )}
                                        </div>

                                        {isInactivePending && (
                                            <span className="!mt-4 !text-[10px] !font-bold !uppercase !bg-yellow-500/20 !text-yellow-400 !border !border-yellow-500/30 !px-3 !py-1 !rounded-full">Pendiente activar</span>
                                        )}
                                    </div>

                                    <div className="!space-y-4">
                                        <div className="!flex !justify-between !items-center !py-3 !border-b !border-white/5">
                                            <span className="!text-gray-400 !text-sm">Vence el</span>
                                            <span className="!font-bold !text-sm">
                                                {endUser.endDate
                                                    ? new Date(endUser.endDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
                                                    : isInactivePending
                                                        ? 'Al activar tu cuenta'
                                                        : '—'
                                                }
                                            </span>
                                        </div>
                                        <div className="!flex !justify-between !items-center !py-3">
                                            <span className="!text-gray-400 !text-sm">Dispositivos</span>
                                            <span className="!font-bold !text-sm">{endUser.maxDevices} Máx.</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="!text-center !py-4">
                                    <p className="!text-gray-500 !text-sm !mb-4">No tienes un plan activo</p>
                                    <Link href="/planes" className="!block !w-full !py-3 !bg-[var(--color-primary)] !text-black !font-black !rounded-xl !text-center !text-xs !uppercase !tracking-widest hover:!scale-105 !transition-all">Ver Planes</Link>
                                </div>
                            )}
                        </div>

                        {/* Web Info / Help */}
                        <div className="!bg-[#0A0F24]/40 !border !border-white/5 !rounded-3xl !p-8">
                            <h3 className="!font-black !uppercase !tracking-widest !text-xs !text-gray-500 !mb-6">Información de la web</h3>
                            <ul className="!space-y-4">
                                <li><Link href="/terminos" className="!flex !items-center !justify-between !text-sm hover:!text-[var(--color-primary)] !transition-colors">Términos y Condiciones <ChevronRight size={14} /></Link></li>
                                <li><Link href="/privacidad" className="!flex !items-center !justify-between !text-sm hover:!text-[var(--color-primary)] !transition-colors">Privacidad <ChevronRight size={14} /></Link></li>

                            </ul>
                        </div>
                    </div>

                    {/* Right Column: History */}
                    <div className="lg:!col-span-2">
                        <div className="!bg-[#0A0F24]/40 !border !border-white/5 !rounded-3xl !p-8 !min-h-[400px]">
                            <div className="!flex !items-center !justify-between !mb-8">
                                <div className="!flex !items-center !gap-3">
                                    <div className="!p-2 !bg-cyan-500/20 !rounded-lg !text-cyan-500"><Clock size={20} /></div>
                                    <h3 className="!font-black !uppercase !tracking-widest !text-sm">Historial de Reproducción</h3>
                                </div>
                                <Link href="/historial" className="!text-xs !font-black !text-[var(--color-primary)] !uppercase !tracking-widest hover:!underline">Ver todo</Link>
                            </div>

                            {loadingHistory ? (
                                <div className="!flex !flex-col !items-center !justify-center !py-20 !gap-4">
                                    <div className="!w-8 !h-8 !border-2 !border-[var(--color-primary)] !border-t-transparent !rounded-full !animate-spin"></div>
                                    <p className="!text-xs !text-gray-500 !font-bold !uppercase !tracking-widest">Cargando historial...</p>
                                </div>
                            ) : history.length > 0 ? (
                                <div className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-4">
                                    {history.slice(0, 4).map((item: any) => (
                                        <Link key={item.id} href={`/film/${item.contentId}`} className="!flex !gap-4 !group !bg-white/5 hover:!bg-white/10 !p-3 !rounded-2xl !border !border-transparent hover:!border-white/10 !transition-all">
                                            <div className="!w-20 !h-28 !rounded-xl !overflow-hidden !flex-shrink-0 !relative">
                                                <img src={resolveImageUrl(item.content?.thumbnails?.[0]?.url)} className="!w-full !h-full !object-cover" alt="" />
                                                <div className="!absolute !inset-0 !bg-black/40 !opacity-0 group-hover:!opacity-100 !flex !items-center !justify-center !transition-opacity">
                                                    <Play size={24} fill="white" />
                                                </div>
                                            </div>
                                            <div className="!flex !flex-col !justify-center !py-1">
                                                <p className="!font-bold !text-white !line-clamp-1 group-hover:!text-[var(--color-primary)] !transition-colors !mb-1">{item.content?.translations?.[0]?.title || 'Contenido'}</p>
                                                <p className="!text-[10px] !text-gray-500 !uppercase !font-black !tracking-widest !mb-2">{item.content?.type}</p>
                                                <div className="!w-full !bg-white/10 !h-1 !rounded-full !overflow-hidden">
                                                    <div className="!bg-[var(--color-primary)] !h-full" style={{ width: `${(item.progress / (item.duration || 1)) * 100}%` }}></div>
                                                </div>
                                                 <p className="!text-[10px] !text-gray-400 !mt-2">
                                                     Visto el {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Recientemente'}
                                                 </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="!flex !flex-col !items-center !justify-center !py-20 !text-center">
                                    <Monitor size={48} className="!text-white/10 !mb-4" />
                                    <p className="!text-gray-500 !font-medium !mb-6">Aún no has visto nada. ¡Empieza a explorar!</p>
                                    <Link href="/explorar" className="!px-8 !py-3 !bg-white/5 hover:!bg-white/10 !border !border-white/10 !rounded-xl !font-bold !transition-all !text-xs !uppercase !tracking-widest">Ir a Explorar</Link>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
