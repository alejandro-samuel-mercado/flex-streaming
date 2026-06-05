'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { API_ROUTES } from '@/lib/api-routes';

// 180 days in seconds — matches the backend refresh token TTL
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60;

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
        planId?: string | null;
        endDate: string | null;
        maxDevices: number;
        plan?: {
            id: string;
            name: string;
            durationDays: number;
            bonusDays?: number;
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

/**
 * Silently attempts to rotate the accessToken using the stored refreshToken.
 * Returns the new accessToken on success, or null if the refresh token is
 * missing / expired / revoked.
 */
async function silentRefresh(): Promise<string | null> {
    const storedRefresh = localStorage.getItem('refreshToken');
    if (!storedRefresh) return null;

    try {
        const res = await fetch(API_ROUTES.AUTH.REFRESH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefresh }),
        });

        // If the server is unreachable or returns a non-JSON body, treat as a
        // transient network error — do NOT clear local tokens.
        if (!res.ok) return null;

        const data = await res.json();
        if (data.success && data.data?.accessToken) {
            const newAccess: string = data.data.accessToken;
            localStorage.setItem('accessToken', newAccess);
            if (data.data.refreshToken) {
                localStorage.setItem('refreshToken', data.data.refreshToken);
            }
            // Keep the cookie in sync with the new access token
            document.cookie = `accessToken=${newAccess}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
            return newAccess;
        }
        return null;
    } catch {
        // Network error — keep the session alive locally, retry next time.
        return null;
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    // Prevent concurrent fetchUser calls (e.g. StrictMode double-invoke)
    const fetchingRef = useRef(false);

    const fetchUser = useCallback(async () => {
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        const token = localStorage.getItem('accessToken');
        if (!token) {
            setUser(null);
            setLoading(false);
            fetchingRef.current = false;
            return;
        }

        try {
            const res = await fetch(API_ROUTES.AUTH.ME, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // ── 401: access token expired — try silent refresh ────────────────
            if (res.status === 401) {
                const newToken = await silentRefresh();
                if (newToken) {
                    // Retry /me with the fresh token
                    const retryRes = await fetch(API_ROUTES.AUTH.ME, {
                        headers: { 'Authorization': `Bearer ${newToken}` }
                    });
                    const retryResult = await retryRes.json();
                    if (retryResult.success && retryResult.data) {
                        setUser(retryResult.data);
                        _syncProfileId(retryResult.data);
                    } else {
                        // Even the new token was rejected — full logout
                        _clearTokens();
                        setUser(null);
                    }
                } else {
                    // refresh token is gone / expired — user must log in again
                    _clearTokens();
                    setUser(null);
                }
                setLoading(false);
                fetchingRef.current = false;
                return;
            }

            // ── Non-401 network/server error — keep session alive ─────────────
            if (!res.ok) {
                // Don't clear tokens on 5xx or network failures; just leave
                // the user state as-is. Next navigation will retry.
                setLoading(false);
                fetchingRef.current = false;
                return;
            }

            // ── 200 OK ────────────────────────────────────────────────────────
            const result = await res.json();
            if (result.success && result.data) {
                setUser(result.data);
                _syncProfileId(result.data);
            } else {
                _clearTokens();
                setUser(null);
            }
        } catch {
            // Pure network error (offline, DNS failure, etc.)
            // Keep the existing user state so the UI doesn't flicker to logged-out.
            // setUser is intentionally NOT called here.
        } finally {
            setLoading(false);
            fetchingRef.current = false;
        }
    }, []);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const login = (accessToken: string, refreshToken: string, userData?: AuthUser) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        // Cookie lasts 180 days — same as the refresh token TTL on the server
        document.cookie = `accessToken=${accessToken}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

        if (userData) {
            setUser(userData);
            setLoading(false);
        } else {
            fetchUser();
        }
    };

    const logout = () => {
        _clearTokens();
        setUser(null);
        window.location.href = '/login';
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshUser: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function _syncProfileId(userData: AuthUser) {
    if (userData.profiles && userData.profiles.length > 0) {
        const storedProfileId = localStorage.getItem('profileId');
        const isValidProfile = userData.profiles.some((p: any) => p.id === storedProfileId);
        if (!storedProfileId || !isValidProfile) {
            localStorage.setItem('profileId', userData.profiles[0].id);
        }
    }
}

function _clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('profileId');
    document.cookie = 'accessToken=; path=/; max-age=0;';
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
