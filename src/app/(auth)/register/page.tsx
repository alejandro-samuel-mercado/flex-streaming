'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff, UserPlus, Play } from 'lucide-react';

const registerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: data.name, email: data.email, password: data.password }),
            });
            const result = await response.json();
            if (!result.success) throw new Error(result.error ?? 'Error al registrarse');
            localStorage.setItem('accessToken', result.data.accessToken);
            localStorage.setItem('refreshToken', result.data.refreshToken);
            window.location.href = '/';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2564&auto=format&fit=crop"
                    alt="Background"
                    className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 w-full max-w-md bg-black/75 backdrop-blur-md p-10 md:p-14 rounded-md border border-gray-800/50 shadow-2xl"
            >
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 mb-10 text-[#E50914] font-bold text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
                    FlexStreaming
                </Link>

                <h1 className="auth-title">Creá tu cuenta</h1>
                <p className="auth-subtitle mb-6 text-gray-400">Gratis. Sin compromiso.</p>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="auth-error">
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <input {...register('name')} type="text" className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.name ? 'ring-2 ring-red-500' : ''}`} placeholder="Tu nombre" autoComplete="name" />
                        {errors.name && <span className="text-red-500 text-xs font-semibold">{errors.name.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <input {...register('email')} type="email" className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.email ? 'ring-2 ring-red-500' : ''}`} placeholder="Email o número de teléfono" autoComplete="email" />
                        {errors.email && <span className="text-red-500 text-xs font-semibold">{errors.email.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <input {...register('password')} type={showPassword ? 'text' : 'password'} className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.password ? 'ring-2 ring-red-500' : ''}`} placeholder="Contraseña (Mín. 8)" autoComplete="new-password" />
                            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <span className="text-red-500 text-xs font-semibold">{errors.password.message}</span>}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="relative">
                            <input {...register('confirmPassword')} type={showPassword ? 'text' : 'password'} className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.confirmPassword ? 'ring-2 ring-red-500' : ''}`} placeholder="Repetir contraseña" autoComplete="new-password" />
                        </div>
                        {errors.confirmPassword && <span className="text-red-500 text-xs font-semibold">{errors.confirmPassword.message}</span>}
                    </div>

                    <motion.button type="submit" className="w-full bg-[#E50914] text-white font-bold py-3.5 rounded mt-4 flex items-center justify-center gap-2 hover:bg-[#f40612] transition" disabled={isLoading} whileHover={{ scale: isLoading ? 1 : 1.02 }} whileTap={{ scale: isLoading ? 1 : 0.98 }}>
                        {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Crear cuenta'}
                    </motion.button>
                </form>

                <div className="mt-12">
                    <p className="text-gray-400 mb-4">
                        ¿Ya tenés cuenta?{' '}
                        <Link href="/login" className="text-white hover:underline font-medium">
                            Inicia sesión aquí.
                        </Link>
                    </p>
                    <p className="text-xs text-gray-500">
                        Al registrarte aceptas las Condiciones de uso y Privacidad de PeliPlus.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
