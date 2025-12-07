/**
 * API Configuration utility
 * Uses centralized configuration for consistent API calls
 */

export const getApiUrl = (path: string = ''): string => {
  // Use relative paths for all environments for security
  // Backend URL should only be configured on server/proxy level
  const apiUrl = '/api';

  // Always use relative path (production proxy)
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  // In production, use full backend URL for OAuth and other external integrations
  // In development, use relative path (proxied by Vite)
  if (!import.meta.env.DEV && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to relative path for development
  return '/api';
};

export const getFullApiUrl = (endpoint: string): string => {
  // Remove any leading /api from the endpoint to prevent double /api/
  const cleanEndpoint = endpoint.replace(/^\/api/, '');
  const finalEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;

  return `/api${finalEndpoint}`;
};

// Utility to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = getFullApiUrl('/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Get development info for debugging (no sensitive URLs exposed)
export const getDevInfo = () => {
  if (!import.meta.env.DEV) return null;

  return {
    isDev: true,
    apiBaseUrl: getApiBaseUrl(),
    isProxy: true,
    recommendation: 'Using secure relative paths with proxy configuration.'
  };
};
