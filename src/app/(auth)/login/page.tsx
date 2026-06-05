'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, Suspense } from 'react';
import { Eye, EyeOff, LogIn, Play, User, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_ROUTES } from '@/lib/api-routes';

const loginSchema = z.object({
    username: z.string().min(1, 'Ingresá tu usuario'),
    password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginContent() {
    const { login, user } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect') || '/';
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            router.push(redirectUrl);
        }
    }, [user, router, redirectUrl]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(API_ROUTES.AUTH.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error ?? 'Error al iniciar sesión');

            const user = result.data.user;
            const allowedAdminRoles = ['ADMIN', 'VENDOR', 'SUPER_VENDOR'];
            
            login(result.data.accessToken, result.data.refreshToken, user);

            if (user && allowedAdminRoles.includes(user.role)) {
                // It's an admin/vendor logging in from the public page
                localStorage.setItem('adminToken', result.data.accessToken);
                localStorage.setItem('adminRefreshToken', result.data.refreshToken);
                document.cookie = `adminToken=${result.data.accessToken}; path=/; max-age=${180 * 24 * 3600}; SameSite=Lax`;
                
                let adminRedirect = '/admin';
                if (user.role === 'VENDOR') adminRedirect = '/vendor';
                if (user.role === 'SUPER_VENDOR') adminRedirect = '/super-vendor';
                
                // Use location.href for a clean state when moving to admin panel
                window.location.href = adminRedirect;
            } else {
                window.location.href = redirectUrl;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const posterImages = [
        'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1574375927938-d5a98e8d7e28?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1626278664285-f796b9ee7806?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1535016120-3b1a6e3e1eb0?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1604014237800-1c9102c219da?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1596727147705-61a532a659bd?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?q=80&w=400&fit=crop',
        'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=400&fit=crop',
    ];

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#02040A] overflow-hidden font-sans" style={{ padding: '24px' }}>

            {/* 1. Movie Poster Collage Background */}
            <div className="absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center">
                <div className="flex flex-wrap w-[150vw] h-[150vh] opacity-15 transform -rotate-12 scale-110">
                    {[...Array(50)].map((_, i) => (
                        <div key={i} className="w-[10vw] h-[15vw] p-1">
                            <img
                                src={posterImages[i % posterImages.length]}
                                alt=""
                                className="w-full h-full object-cover rounded-md filter contrast-125 saturate-50"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. Waves, Flashes and Neon Effects (Ondas y Destellos) */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Dark overlay to ensure text is readable */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#02040A]/80 via-[#02040A]/60 to-[#02040A]/95 mix-blend-multiply"></div>

                {/* Animated Neon Waves (Cyan and Orange) */}
                <div className="absolute inset-0 opacity-40 mix-blend-screen bg-[radial-gradient(ellipse_at_20%_20%,rgba(0,229,255,0.25)_0%,transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(255,107,0,0.2)_0%,transparent_50%)] animate-[bgBreathe_10s_ease-in-out_infinite_alternate]" />

                {/* Huge glowing flashes */}
                <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-[#00E5FF] opacity-10 blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-[#FF6B00] opacity-10 blur-[150px]"></div>
            </div>

            {/* Back Button */}
            <div className="absolute top-8 left-[7%] z-50">
                <Link href="/" className="flex items-center justify-center rounded-full bg-[#030612]/50 backdrop-blur-md border border-[#00E5FF]/20 text-white hover:bg-[#00E5FF]/20 hover:border-[#00E5FF] hover:text-[#00E5FF] transition-all" style={{ width: '48px', height: '48px', boxShadow: '0 0 15px rgba(0,229,255,0.2)' }}>
                    <ArrowLeft size={24} />
                </Link>
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-[500px]"
            >
                <div
                    className="bg-[#0A0F24]/80 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.9),0_0_40px_rgba(0,229,255,0.08)_inset]"
                    style={{
                        borderTopColor: 'rgba(0, 229, 255, 0.4)',
                        borderLeftColor: 'rgba(0, 229, 255, 0.2)',
                        padding: 'clamp(24px, 6vw, 48px)',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* Logo */}
                    <Link href="/" className="flex flex-col items-center justify-center gap-2 group" style={{ marginBottom: '40px' }}>
                        <div className="flex items-center justify-center" style={{ height: '50px' }}>
                            <img src="/logo-nuba.png" alt="Nuba" className="h-full w-auto object-contain filter drop-shadow-[0_0_15px_rgba(0,229,255,0.6)] group-hover:drop-shadow-[0_0_25px_rgba(0,229,255,1)] transition-all duration-300" />
                            <span className="hidden text-[#00E5FF] font-black tracking-[4px]" style={{ fontSize: '32px', fontFamily: 'var(--font-display, Bebas Neue, sans-serif)', textShadow: '0 0 20px rgba(0,229,255,0.8)' }}>
                                NUBA
                            </span>
                        </div>
                    </Link>

                    <h1 className="font-black text-white text-center" style={{ fontSize: '28px', marginBottom: '8px', letterSpacing: '-0.5px' }}>Bienvenido de vuelta</h1>
                    <p className="text-gray-400 font-medium text-center" style={{ fontSize: '15px', marginBottom: '40px' }}>Iniciá sesión para continuar la experiencia</p>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ backgroundColor: 'rgba(255,0,85,0.1)', borderLeft: '4px solid #FF0055', color: '#FF0055', padding: '16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold' }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col" style={{ gap: '24px' }}>
                        <div className="flex flex-col" style={{ gap: '8px' }}>
                            <div className="relative flex items-center">
                                <User className="absolute text-gray-500 pointer-events-none" style={{ left: '20px' }} size={22} />
                                <input
                                    {...register('username')}
                                    type="text"
                                    className={`w-full bg-[#030612]/90 text-white rounded-2xl border border-white/10 outline-none focus:border-[#00E5FF]/60 focus:bg-[#0A0F24] focus:shadow-[0_0_20px_rgba(0,229,255,0.15)_inset] transition-all placeholder-gray-600 font-medium ${errors.username ? 'border-[#FF0055] ring-1 ring-[#FF0055]/50' : ''}`}
                                    style={{ padding: '18px 20px 18px 56px', fontSize: '16px' }}
                                    placeholder="Usuario"
                                    autoComplete="username"
                                />
                            </div>
                            {errors.username && <span className="text-[#FF0055] font-bold drop-shadow-[0_0_5px_rgba(255,0,85,0.5)]" style={{ fontSize: '12px', paddingLeft: '8px' }}>{errors.username.message}</span>}
                        </div>

                        <div className="flex flex-col" style={{ gap: '8px' }}>
                            <div className="relative flex items-center">
                                <Lock className="absolute text-gray-500 pointer-events-none" style={{ left: '20px' }} size={22} />
                                <input
                                    {...register('password')}
                                    type={showPassword ? 'text' : 'password'}
                                    className={`w-full bg-[#030612]/90 text-white rounded-2xl border border-white/10 outline-none focus:border-[#00E5FF]/60 focus:bg-[#0A0F24] focus:shadow-[0_0_20px_rgba(0,229,255,0.15)_inset] transition-all placeholder-gray-600 font-medium ${errors.password ? 'border-[#FF0055] ring-1 ring-[#FF0055]/50' : ''}`}
                                    style={{ padding: '18px 56px 18px 56px', fontSize: '16px' }}
                                    placeholder="Contraseña"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute text-gray-500 hover:text-[#00E5FF] transition-colors"
                                    style={{ right: '20px' }}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-[#FF0055] font-bold drop-shadow-[0_0_5px_rgba(255,0,85,0.5)]" style={{ fontSize: '12px', paddingLeft: '8px' }}>{errors.password.message}</span>}
                        </div>

                        <motion.button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#00E5FF] to-[#0099AA] text-[#02040A] font-black flex items-center justify-center gap-2 hover:from-[#4DEDFF] hover:to-[#00E5FF] transition-all uppercase"
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                marginTop: '8px',
                                boxShadow: '0 10px 30px rgba(0,229,255,0.4), 0 2px 0 rgba(255,255,255,0.4) inset',
                                letterSpacing: '2px',
                                fontSize: '16px'
                            }}
                            disabled={isLoading}
                            whileHover={{ scale: isLoading ? 1 : 1.02, translateY: -2 }}
                            whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : (
                                <span className="drop-shadow-sm">INICIAR SESIÓN</span>
                            )}
                        </motion.button>

                        <div className="flex justify-between items-center text-gray-400" style={{ marginTop: '16px', fontSize: '14px', padding: '0 8px' }}>
                            <label className="flex items-center cursor-pointer group hover:text-white transition-colors" style={{ gap: '12px' }}>
                                <div className="relative flex items-center justify-center">
                                    <input type="checkbox" className="peer appearance-none bg-[#030612]/80 border border-white/20 checked:bg-[#00E5FF] checked:border-[#00E5FF] transition-all cursor-pointer shadow-inner" style={{ width: '22px', height: '22px', borderRadius: '6px' }} />
                                    <svg className="absolute text-[#02040A] opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" style={{ width: '14px', height: '14px' }} viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="font-medium">Recuérdame</span>
                            </label>
                            <Link href="/forgot-password" className="hover:text-[#00E5FF] font-medium transition-colors hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]">¿Olvidaste tu contraseña?</Link>
                        </div>
                    </form>


                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#02040A]">
                <div className="w-8 h-8 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
