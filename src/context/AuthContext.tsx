'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API_ROUTES } from '@/lib/api-routes';

interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: string;
    profiles?: any[];
    endUserAccount?: {
        id: string;
        status: string;
        type: string;
        endDate: string;
        maxDevices: number;
        plan?: {
            id: string;
            name: string;
            durationDays: number;
        }
    }
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    login: (accessToken: string, refreshToken: string, userData?: AuthUser) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(API_ROUTES.AUTH.ME, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const result = await res.json();
            if (result.success && result.data) {
                setUser(result.data);
                // Ensure profile ID is set for history/favorites if not present
                if (result.data.profiles?.length > 0 && !localStorage.getItem('profileId')) {
                    localStorage.setItem('profileId', result.data.profiles[0].id);
                }
            } else {
                // Token might be expired
                localStorage.removeItem('accessToken');
                setUser(null);
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = (accessToken: string, refreshToken: string, userData?: AuthUser) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        document.cookie = `accessToken=${accessToken}; path=/; max-age=${8 * 3600}; SameSite=Lax`;
        
        if (userData) {
            setUser(userData);
            setLoading(false);
        } else {
            fetchUser();
        }
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('profileId');
        document.cookie = 'accessToken=; path=/; max-age=0;';
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
