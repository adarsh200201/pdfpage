/**
 * API Configuration utility
 * Handles API URL resolution for development and production environments
 */

export const getApiUrl = (path: string = ''): string => {
  // In development, connect directly to localhost backend
  if (import.meta.env.DEV) {
    return `http://localhost:5000${path}`;
  }
  
  // In production, use Netlify proxy (no domain needed)
  // Netlify will handle proxying /api/* to backend
  return path.startsWith('/') ? path : `/${path}`;
};

export const getApiBaseUrl = (): string => {
  return import.meta.env.DEV ? 'http://localhost:5000' : '';
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
