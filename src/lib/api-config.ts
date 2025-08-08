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
  // Always use relative path for security
  // Backend URL should only be configured on server/proxy level
  return '/api';
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  return `${baseUrl}${cleanEndpoint}`;
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
