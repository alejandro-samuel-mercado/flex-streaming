'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Key } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

type ForgotForm = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true);
    // Simulating API Call
    setTimeout(() => {
      setIsLoading(false);
      setSuccessMsg('Si existe una cuenta asociada a este correo, recibirás un enlace de recuperación pronto.');
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1574267432553-4b4628081c31?q=80&w=2564&auto=format&fit=crop" 
          alt="Background" 
          className="w-full h-full object-cover opacity-50 grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/60 to-black/90"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md bg-black/75 backdrop-blur-md p-10 md:p-14 rounded-md border border-gray-800/50 shadow-2xl"
      >
        <Link href="/" className="flex items-center gap-2 mb-10 text-[#E50914] font-bold text-3xl" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          PELIPLUS
        </Link>

        <h1 className="auth-title">Recuperar contraseña</h1>
        <p className="auth-subtitle mb-6 text-gray-400">Ingresá tu correo electrónico y te enviaremos instrucciones.</p>

        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 mb-6 rounded bg-green-500/20 border border-green-500/50 text-green-200 text-sm">
            {successMsg}
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <input 
              {...register('email')} 
              type="email" 
              className={`w-full bg-[#333] text-white px-4 py-3.5 rounded outline-none focus:ring-2 focus:ring-gray-400 transition placeholder-gray-400 ${errors.email ? 'ring-2 ring-red-500' : ''}`} 
              placeholder="tu@email.com" 
              autoComplete="email" 
            />
            {errors.email && <span className="text-red-500 text-xs font-semibold">{errors.email.message}</span>}
          </div>

          <motion.button 
            type="submit" 
            className="w-full bg-[#E50914] text-white font-bold py-3.5 rounded mt-2 flex items-center justify-center gap-2 hover:bg-[#f40612] transition" 
            disabled={isLoading} 
            whileHover={{ scale: isLoading ? 1 : 1.02 }} 
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
          >
            {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Key size={18} /> Enviar enlace</>}
          </motion.button>
        </form>

        <div className="mt-12">
          <p className="text-gray-400 mb-4">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/login" className="text-white hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
