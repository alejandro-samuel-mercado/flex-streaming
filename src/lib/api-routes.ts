const getApiBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
        if (window.location.hostname.includes('unixxtech.online')) {
            return 'https://api-streamflex.unixxtech.online/api';
        }
    }
    return 'http://localhost:4000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Robust calculation of API_ORIGIN: remove the trailing /api or /api/ safely
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export const API_ROUTES = {
    AUTH: {
        REGISTER: `${API_BASE_URL}/auth/login`,
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
        UPDATE: (id: string) => `${API_BASE_URL}/content/${id}`,
        DELETE: (id: string) => `${API_BASE_URL}/content/${id}`,
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
        UPDATE_GENRE: (id: string) => `${API_BASE_URL}/categories/genres/${id}`,
        DELETE_GENRE: (id: string) => `${API_BASE_URL}/categories/genres/${id}`,
        AGE_RATINGS: `${API_BASE_URL}/categories/age-ratings`,
        TAGS: `${API_BASE_URL}/categories/tags`,
        UPDATE_TAG: (id: string) => `${API_BASE_URL}/categories/tags/${id}`,
        DELETE_TAG: (id: string) => `${API_BASE_URL}/categories/tags/${id}`,
        CONTENT_TYPES: `${API_BASE_URL}/categories/content-types`,
    },
    PLATFORMS: {
        LIST: `${API_BASE_URL}/platforms`,
        CREATE: `${API_BASE_URL}/platforms`,
        DETAIL: (slug: string) => `${API_BASE_URL}/platforms/${slug}`,
        UPDATE: (id: string) => `${API_BASE_URL}/platforms/${id}`,
        DELETE: (id: string) => `${API_BASE_URL}/platforms/${id}`,
    },
    SEARCH: {
        SEARCH: `${API_BASE_URL}/search`,
        SUGGEST: `${API_BASE_URL}/search/suggest`,
    },
    STREAM: {
        REQUEST_ACCESS: `${API_BASE_URL}/stream/request-access`,
    },
    FAVORITES: {
        BASE: `${API_BASE_URL}/favorites`,
        LIST: `${API_BASE_URL}/favorites`,
        TOGGLE: `${API_BASE_URL}/favorites/toggle`,
    },
    LIKES: {
        BASE: `${API_BASE_URL}/likes`,
        TOGGLE: `${API_BASE_URL}/likes/toggle`,
        CHECK: (id: string) => `${API_BASE_URL}/likes/check/${id}`,
    },
    HISTORY: {
        BASE: `${API_BASE_URL}/history`,
        LIST: `${API_BASE_URL}/history`,
        CONTINUE: `${API_BASE_URL}/history/continue`,
        PROGRESS: `${API_BASE_URL}/history/progress`,
    },
    REVIEWS: {
        BY_CONTENT: (contentId: string) => `${API_BASE_URL}/reviews/content/${contentId}`,
        CREATE: `${API_BASE_URL}/reviews`,
    },
    PLANS: {
        LIST: `${API_BASE_URL}/plans`,
    },
    HOMEPAGE: {
        DATA: `${API_BASE_URL}/homepage`,
    },
    ADMIN: {
        BASE: `${API_BASE_URL}/admin`,
        DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
        USERS: `${API_BASE_URL}/admin/users`,
        SETTINGS: `${API_BASE_URL}/admin/settings`,
        VIDEOS_STATUS: `${API_BASE_URL}/admin/videos/status`,
        VIDEOS_RETRY_FAILED: `${API_BASE_URL}/admin/videos/retry-failed`,
        JOB_LOGS: (jobId: string) => `${API_BASE_URL}/admin/videos/job/${jobId}/logs`,
        UPLOAD: {
            BASE: `${API_BASE_URL}/upload`,
            CHUNK: `${API_BASE_URL}/upload/chunk`,
            COMPLETE: `${API_BASE_URL}/upload/complete`,
            DELETE_VIDEO: (id: string) => `${API_BASE_URL}/upload/video/${id}`,
            RETRY_VIDEO: (id: string) => `${API_BASE_URL}/upload/video/${id}/retry`,
            SUBTITLE: `${API_BASE_URL}/upload/subtitle`,
            DELETE_SUBTITLE: (id: string) => `${API_BASE_URL}/upload/subtitle/${id}`,
        },
    },
    SUBSCRIPTION_PLANS: {
        BASE: `${API_BASE_URL}/subscription-plans`,
        ALL: `${API_BASE_URL}/subscription-plans/all`,
        BY_ID: (id: string) => `${API_BASE_URL}/subscription-plans/${id}`,
        TOGGLE: (id: string) => `${API_BASE_URL}/subscription-plans/${id}/toggle`,
    },
    CREDIT_PACKAGES: {
        BASE: `${API_BASE_URL}/credit-packages`,
        ALL: `${API_BASE_URL}/credit-packages/all`,
        BY_ID: (id: string) => `${API_BASE_URL}/credit-packages/${id}`,
        TOGGLE: (id: string) => `${API_BASE_URL}/credit-packages/${id}/toggle`,
        APPLY: (id: string) => `${API_BASE_URL}/credit-packages/${id}/apply`,
    },
    RESELLER: {
        SUPER_VENDORS: `${API_BASE_URL}/reseller/vendors/super`,
        VENDORS: `${API_BASE_URL}/reseller/vendors/regular`,
        LIST: `${API_BASE_URL}/reseller/vendors`,
        BY_ID: (id: string) => `${API_BASE_URL}/reseller/vendors/${id}`,
        STATUS: (id: string) => `${API_BASE_URL}/reseller/vendors/${id}/status`,
        ASSIGN_CREDITS: (id: string) => `${API_BASE_URL}/reseller/vendors/${id}/credits`,
        CREDIT_HISTORY: (id: string) => `${API_BASE_URL}/reseller/vendors/${id}/credits/history`,
        TRANSACTIONS: `${API_BASE_URL}/reseller/transactions`,
    },
    END_USERS: {
        BASE: `${API_BASE_URL}/end-users`,
        BY_ID: (id: string) => `${API_BASE_URL}/end-users/${id}`,
        PASSWORD: (id: string) => `${API_BASE_URL}/end-users/${id}/password`,
        ADD_PLAN: (id: string) => `${API_BASE_URL}/end-users/${id}/plan`,
        PAUSE: (id: string) => `${API_BASE_URL}/end-users/${id}/pause`,
        DEVICES: (id: string) => `${API_BASE_URL}/end-users/${id}/devices`,
        DEVICE: (id: string, deviceId: string) => `${API_BASE_URL}/end-users/${id}/devices/${deviceId}`,
        HISTORY: (id: string) => `${API_BASE_URL}/end-users/${id}/history`,
    },
    TMDB: {
        SEARCH: `${API_BASE_URL}/admin/tmdb/search`,
        DETAILS: (type: string, id: string | number) => `${API_BASE_URL}/admin/tmdb/details/${type}/${id}`,
    },
    MEDIA_SCANNER: {
        DIRECTORIES: `${API_BASE_URL}/admin/media-scanner/directories`,
        SCAN: `${API_BASE_URL}/admin/media-scanner/scan`,
        SCAN_RESULT: `${API_BASE_URL}/admin/media-scanner/scan-result`,
        IMPORT: `${API_BASE_URL}/admin/media-scanner/import`,
        STATUS: `${API_BASE_URL}/admin/media-scanner/status`,
        APPLY_TMDB: `${API_BASE_URL}/admin/media-scanner/apply-tmdb`,
        DRAIN_AND_RESET: `${API_BASE_URL}/admin/media-scanner/drain-and-reset`,
    },
    BACKUP: {
        LIST: `${API_BASE_URL}/admin/backup/list`,
        CREATE: `${API_BASE_URL}/admin/backup/create`,
        IMPORT: `${API_BASE_URL}/admin/backup/import`,
        DOWNLOAD: (filename: string) => `${API_BASE_URL}/admin/backup/download/${filename}`,
        DELETE: (filename: string) => `${API_BASE_URL}/admin/backup/${filename}`,
        SETTINGS: `${API_BASE_URL}/admin/backup/settings`,
    },
} as const;

// Robust helper to resolve media URLs (thumbnails, etc.)
export const resolveImageUrl = (url: string | null | undefined) => {
    if (!url) return 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=2574&auto=format&fit=crop';
    if (url.startsWith('http')) return url;

    // Normalize the URL to start with a slash
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_ORIGIN}${normalizedUrl}`;
};


