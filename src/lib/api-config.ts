/**
 * API Configuration utility
 * Handles API URL resolution for development and production environments
 */

export const getApiUrl = (path: string = ''): string => {
  // In development, connect directly to localhost backend
  if (import.meta.env.DEV) {
    return `http://localhost:5000${path}`;
  }

  // In production, use Google Cloud Run backend directly
  const baseUrl = 'https://pdf-backend-935131444417.asia-south1.run.app';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  return import.meta.env.DEV ? 'http://localhost:5000' : 'https://pdf-backend-935131444417.asia-south1.run.app';
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};
