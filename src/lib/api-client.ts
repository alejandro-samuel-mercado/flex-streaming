import { API_ORIGIN, API_ROUTES } from './api-routes';

// ── Mutex — prevents multiple concurrent 401 handlers from racing ─────────────
let _userRefreshPromise: Promise<string | null> | null = null;

/**
 * Silently rotates the user accessToken using the stored refreshToken.
 * Returns the new accessToken on success, null if the refresh token is
 * missing / expired / revoked (which means the user must log in again).
 */
async function refreshUserToken(): Promise<string | null> {
  if (_userRefreshPromise) return _userRefreshPromise;

  _userRefreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) return null;

      const res = await fetch(API_ROUTES.AUTH.REFRESH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return null;

      const data = await res.json();
      if (data.success && data.data?.accessToken) {
        const newAccess: string = data.data.accessToken;
        localStorage.setItem('accessToken', newAccess);
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        // Keep the cookie in sync — 180 days matches the refresh token TTL
        const COOKIE_MAX_AGE = 180 * 24 * 60 * 60;
        document.cookie = `accessToken=${newAccess}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
        return newAccess;
      }
      return null;
    } catch {
      return null;
    } finally {
      _userRefreshPromise = null;
    }
  })();

  return _userRefreshPromise;
}

/**
 * Authenticated fetch for end-user routes.
 *
 * - Automatically injects `Authorization: Bearer <token>` and `X-Profile-Id`.
 * - On 401, silently attempts token refresh and retries once.
 * - On network errors (no response), does NOT clear local tokens.
 */
export async function userFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isServer = typeof window === 'undefined';
  const finalUrl = isServer && url.startsWith('/') ? `${API_ORIGIN}${url}` : url;

  let token = isServer ? null : localStorage.getItem('accessToken');
  const profileId = isServer ? null : localStorage.getItem('profileId');

  const buildHeaders = (t: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    };
    if (t) h['Authorization'] = `Bearer ${t}`;
    if (profileId) h['X-Profile-Id'] = profileId;
    return h;
  };

  let res = await fetch(finalUrl, { ...options, headers: buildHeaders(token) });

  // Auto-refresh on 401
  if (res.status === 401 && !isServer) {
    const newToken = await refreshUserToken();
    if (newToken) {
      res = await fetch(finalUrl, { ...options, headers: buildHeaders(newToken) });
    } else {
      // Refresh failed — clear tokens and let the caller handle the 401
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('profileId');
      document.cookie = 'accessToken=; path=/; max-age=0;';
    }
  }

  return res;
}

/**
 * Simple fetch wrapper for public (unauthenticated) routes.
 * Kept for backward compatibility.
 */
export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isServer = typeof window === 'undefined';
  const finalUrl = isServer && url.startsWith('/') ? `${API_ORIGIN}${url}` : url;

  const res = await fetch(finalUrl, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'API Request failed');
  }

  return data;
}
