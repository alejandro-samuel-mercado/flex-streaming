'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { motion, AnimatePresence } from 'framer-motion';

const schema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Contraseña requerida'),
});

type LoginForm = z.infer<typeof schema>;

export default function AdminLoginPage() {
    const router = useRouter();
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) router.replace('/admin');
    }, [router]);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: LoginForm) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(API_ROUTES.AUTH.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error ?? 'Credenciales inválidas');
            // Check if user has ADMIN role
            const user = json.data.user;
            if (user && user.role !== 'ADMIN') throw new Error('No tienes permisos de administrador');
            localStorage.setItem('adminToken', json.data.accessToken);
            localStorage.setItem('adminRefreshToken', json.data.refreshToken);
            router.replace('/admin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            {/* Animated starfield background */}
            <div className="admin-login-bg">
                <div className="admin-login-stars" />
                <div className="admin-login-nebula" />
                <div className="admin-login-glow-orb orb-1" />
                <div className="admin-login-glow-orb orb-2" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="admin-login-card"
            >
                {/* Shield icon + branding */}
                <div className="admin-login-header">
                    <motion.div
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                        className="admin-login-icon-wrap"
                    >
                        <Shield size={28} strokeWidth={1.5} />
                    </motion.div>
                    <div>
                        <h1 className="admin-login-title">FlexStreaming</h1>
                        <p className="admin-login-subtitle">Panel de Administración</p>
                    </div>
                </div>

                <div className="admin-login-divider" />

                <form onSubmit={handleSubmit(onSubmit)} className="admin-login-form" noValidate>
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                key="error"
                                initial={{ opacity: 0, y: -8, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, y: -8, height: 0 }}
                                className="admin-login-error"
                            >
                                <span>⚠</span> {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="admin-form-field">
                        <label className="admin-form-label">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            className={`admin-form-input${errors.email ? ' error' : ''}`}
                            placeholder="admin@peliplus.com"
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && <span className="admin-form-error">{errors.email.message}</span>}
                    </div>

                    <div className="admin-form-field">
                        <label className="admin-form-label">Contraseña</label>
                        <div className="admin-form-input-wrap">
                            <input
                                {...register('password')}
                                type={showPw ? 'text' : 'password'}
                                className={`admin-form-input${errors.password ? ' error' : ''}`}
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button type="button" className="admin-form-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className="admin-form-error">{errors.password.message}</span>}
                    </div>

                    <motion.button
                        type="submit"
                        className="admin-login-btn"
                        disabled={loading}
                        whileHover={{ scale: loading ? 1 : 1.015 }}
                        whileTap={{ scale: loading ? 1 : 0.985 }}
                    >
                        {loading ? (
                            <span className="admin-login-spinner" />
                        ) : (
                            'Iniciar sesión'
                        )}
                    </motion.button>
                </form>

                <p className="admin-login-hint">
                    Usuario de prueba: <strong>admin@peliplus.com</strong> / <strong>admin123</strong>
                </p>
            </motion.div>
        </div>
    );
}
