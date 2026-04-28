'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Eye, EyeOff, LogIn, Play } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error ?? 'Error al iniciar sesión');
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

        <h1 className="auth-title">Bienvenido de vuelta</h1>
        <p className="auth-subtitle">Iniciá sesión para continuar</p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="auth-error"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <input
              {...register('email')}
              type="email"
              className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.email ? 'ring-2 ring-red-500' : ''}`}
              placeholder="Email o número de teléfono"
              autoComplete="email"
            />
            {errors.email && <span className="text-red-500 text-xs font-semibold">{errors.email.message}</span>}
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.password ? 'ring-2 ring-red-500' : ''}`}
                placeholder="Contraseña"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="text-red-500 text-xs font-semibold">{errors.password.message}</span>}
          </div>

          <motion.button
            type="submit"
            className="w-full bg-[#E50914] text-white font-bold py-3.5 rounded mt-4 flex items-center justify-center gap-2 hover:bg-[#f40612] transition"
            disabled={isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Iniciar sesión'
            )}
          </motion.button>
          
          <div className="flex justify-between items-center text-sm text-gray-400 mt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded bg-gray-700 border-none" />
              Recuérdame
            </label>
            <Link href="/forgot-password" className="hover:underline">¿Necesitas ayuda?</Link>
          </div>
        </form>

        <div className="mt-12">
          <p className="text-gray-400 mb-4">
            ¿Primera vez en PeliPlus?{' '}
            <Link href="/register" className="text-white hover:underline font-medium">
              Suscríbete ahora.
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Esta página está protegida por Google reCAPTCHA para comprobar que no eres un robot.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
