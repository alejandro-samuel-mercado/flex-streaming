import { API_ROUTES } from './api-routes';

/**
 * resellerFetch — Fetch wrapper for super-vendor and vendor panels.
 * Handles token refresh on 401 automatically, mirrors adminFetch behavior.
 */
export async function resellerFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('adminToken');

    const headers: Record<string, string> = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers as Record<string, string> ?? {}),
    };

    if (!(options.body instanceof FormData)) {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    } else {
        delete headers['Content-Type'];
    }

    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        const refreshToken = localStorage.getItem('adminRefreshToken');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(API_ROUTES.AUTH.REFRESH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken }),
                });
                const refreshJson = await refreshRes.json();

                if (refreshJson.success && refreshJson.data.accessToken) {
                    token = refreshJson.data.accessToken;
                    localStorage.setItem('adminToken', token!);
                    if (refreshJson.data.refreshToken) {
                        localStorage.setItem('adminRefreshToken', refreshJson.data.refreshToken);
                    }
                    // Keep cookie in sync — 180 days matches the refresh token TTL
                    document.cookie = `adminToken=${token}; path=/; max-age=${180 * 24 * 3600}; SameSite=Lax`;

                    const newHeaders = { ...headers, 'Authorization': `Bearer ${token}` };
                    res = await fetch(url, { ...options, headers: newHeaders });
                } else {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRefreshToken');
                    window.location.href = '/admin/login';
                }
            } catch {
                window.location.href = '/admin/login';
            }
        } else {
            window.location.href = '/admin/login';
        }
    }

    return res;
}
