import { API_ROUTES } from './api-routes';

/**
 * Mutex for token refresh — prevents multiple concurrent 401 handlers
 * from all trying to refresh the token simultaneously.
 */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAdminToken(): Promise<string | null> {
    // If a refresh is already in progress, wait for it instead of starting another
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        try {
            const refreshToken = localStorage.getItem('adminRefreshToken');
            if (!refreshToken) {
                console.warn('[adminFetch] No refresh token found.');
                return null;
            }

            console.log('[adminFetch] Refreshing access token...');
            const refreshRes = await fetch(API_ROUTES.AUTH.REFRESH, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            const refreshJson = await refreshRes.json();

            if (refreshJson.success && refreshJson.data.accessToken) {
                console.log('[adminFetch] Refresh successful.');
                localStorage.setItem('adminToken', refreshJson.data.accessToken);
                if (refreshJson.data.refreshToken) {
                    localStorage.setItem('adminRefreshToken', refreshJson.data.refreshToken);
                }
                // Keep cookie in sync — 180 days matches the refresh token TTL
                document.cookie = `adminToken=${refreshJson.data.accessToken}; path=/; max-age=${180 * 24 * 3600}; SameSite=Lax`;
                return refreshJson.data.accessToken;
            } else {
                console.error('[adminFetch] Refresh failed:', refreshJson);
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminRefreshToken');
                window.location.href = '/admin/login';
                return null;
            }
        } catch (err) {
            console.error('[adminFetch] Token refresh exception:', err);
            window.location.href = '/admin/login';
            return null;
        } finally {
            // Clear the mutex so next 401 can attempt a new refresh
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

export async function adminFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('adminToken');
    
    const headers: any = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    // If body is FormData, don't set Content-Type (browser will do it with boundary)
    if (!(options.body instanceof FormData)) {
        if (!headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }
    } else {
        // If it's FormData, ensure Content-Type is NOT set
        delete headers['Content-Type'];
    }

    console.log(`[adminFetch] ${options.method || 'GET'} ${url}`);
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        console.warn(`[adminFetch] 401 Unauthorized for ${url}. Attempting refresh...`);
        const newToken = await refreshAdminToken();
        
        if (newToken) {
            console.log(`[adminFetch] Retrying original request with new token...`);
            const newHeaders = {
                ...headers,
                'Authorization': `Bearer ${newToken}`
            };
            res = await fetch(url, { ...options, headers: newHeaders });
        }
    }

    return res;
}
