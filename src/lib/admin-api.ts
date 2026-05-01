import { API_ROUTES } from './api-routes';

export async function adminFetch(url: string, options: RequestInit = {}) {
    let token = localStorage.getItem('adminToken');
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    console.log(`[adminFetch] ${options.method || 'GET'} ${url}`);
    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
        console.warn(`[adminFetch] 401 Unauthorized for ${url}. Attempting refresh...`);
        const refreshToken = localStorage.getItem('adminRefreshToken');
        if (refreshToken) {
            try {
                const refreshRes = await fetch(API_ROUTES.AUTH.REFRESH, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ refreshToken })
                });
                const refreshJson = await refreshRes.json();
                
                if (refreshJson.success && refreshJson.data.accessToken) {
                    console.log(`[adminFetch] Refresh successful. Retrying original request...`);
                    token = refreshJson.data.accessToken;
                    localStorage.setItem('adminToken', token!);
                    if (refreshJson.data.refreshToken) {
                        localStorage.setItem('adminRefreshToken', refreshJson.data.refreshToken);
                    }

                    // Retry original request with new token
                    const newHeaders = {
                        ...headers,
                        'Authorization': `Bearer ${token}`
                    };
                    res = await fetch(url, { ...options, headers: newHeaders });
                } else {
                    console.error(`[adminFetch] Refresh failed. Redirecting to login...`, refreshJson);
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminRefreshToken');
                    window.location.href = '/admin/login';
                }
            } catch (err) {
                console.error('[adminFetch] Token refresh exception:', err);
                window.location.href = '/admin/login';
            }
        } else {
            console.warn(`[adminFetch] No refresh token found. Redirecting to login...`);
            window.location.href = '/admin/login';
        }
    }

    return res;
}
