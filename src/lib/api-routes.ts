const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const API_ROUTES = {
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ME: `${API_BASE_URL}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  },
  PROFILES: {
    LIST: `${API_BASE_URL}/profiles`,
    CREATE: `${API_BASE_URL}/profiles`,
    UPDATE: (id: string) => `${API_BASE_URL}/profiles/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/profiles/${id}`,
    VERIFY_PIN: (id: string) => `${API_BASE_URL}/profiles/${id}/verify-pin`,
  },
  CONTENT: {
    BASE: `${API_BASE_URL}/content`,
    LIST: `${API_BASE_URL}/content`,
    DETAIL: (id: string) => `${API_BASE_URL}/content/${id}`,
    FEATURED: `${API_BASE_URL}/content/featured`,
    TRENDING: `${API_BASE_URL}/content/trending`,
    RECENT: `${API_BASE_URL}/content/recent`,
    RELATED: (id: string) => `${API_BASE_URL}/content/${id}/related`,
  },
  ACTORS: {
    LIST: `${API_BASE_URL}/actors`,
    DETAIL: (id: string) => `${API_BASE_URL}/actors/${id}`,
  },
  CATEGORIES: {
    GENRES: `${API_BASE_URL}/categories/genres`,
    AGE_RATINGS: `${API_BASE_URL}/categories/age-ratings`,
    TAGS: `${API_BASE_URL}/categories/tags`,
  },
  PLATFORMS: {
    LIST: `${API_BASE_URL}/platforms`,
    CREATE: `${API_BASE_URL}/platforms`,
    DETAIL: (slug: string) => `${API_BASE_URL}/platforms/${slug}`,
  },
  SEARCH: {
    SEARCH: `${API_BASE_URL}/search`,
    SUGGEST: `${API_BASE_URL}/search/suggest`,
  },
  STREAM: {
    REQUEST_ACCESS: `${API_BASE_URL}/stream/request-access`,
  },
  FAVORITES: {
    LIST: `${API_BASE_URL}/favorites`,
    TOGGLE: `${API_BASE_URL}/favorites/toggle`,
  },
  HISTORY: {
    LIST: `${API_BASE_URL}/history`,
    CONTINUE: `${API_BASE_URL}/history/continue`,
    PROGRESS: `${API_BASE_URL}/history/progress`,
  },
  REVIEWS: {
    BY_CONTENT: (contentId: string) => `${API_BASE_URL}/reviews/content/${contentId}`,
    CREATE: `${API_BASE_URL}/reviews`,
  },
  ADMIN: {
    DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    USERS: `${API_BASE_URL}/admin/users`,
    SETTINGS: `${API_BASE_URL}/admin/settings`,
    VIDEOS_STATUS: `${API_BASE_URL}/admin/videos/status`,
    UPLOAD: `${API_BASE_URL}/upload`,
  },
} as const;
