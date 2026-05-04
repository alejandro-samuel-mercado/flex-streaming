import { API_ORIGIN } from './api-routes';

export async function fetchApi<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isServer = typeof window === 'undefined';
  
  // Use absolute URL on the server, allow relative on the client if proxying
  const finalUrl = isServer && url.startsWith('/') 
    ? `${API_ORIGIN}${url}`
    : url;

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
