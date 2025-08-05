/**
 * API Configuration utility
 * Uses centralized configuration for consistent API calls
 */

export const getApiUrl = (path: string = ''): string => {
  // Use centralized API configuration for consistency
  const apiUrl = import.meta.env.VITE_API_URL || "/api";

  // If it's a full URL (development), use it directly
  if (apiUrl.startsWith('http')) {
    return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // Otherwise, it's a relative path (production proxy)
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  // Use centralized API configuration for consistency
  const apiUrl = import.meta.env.VITE_API_URL || "/api";

  // If it's a full URL (development), return it
  if (apiUrl.startsWith('http')) {
    return apiUrl;
  }

  // Otherwise, it's a relative path (production proxy)
  return apiUrl;
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  console.log('🔍 [API-CONFIG] Building URL:', {
    baseUrl,
    endpoint,
    cleanEndpoint,
    finalUrl: `${baseUrl}${cleanEndpoint}`,
    envApiUrl: import.meta.env.VITE_API_URL
  });

  return `${baseUrl}${cleanEndpoint}`;
};

// Utility to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const healthUrl = getFullApiUrl('/api/health');
    const response = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(3000) // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Get development info for debugging
export const getDevInfo = () => {
  if (!import.meta.env.DEV) return null;

  return {
    isDev: true,
    apiUrl: import.meta.env.VITE_API_URL,
    apiBaseUrl: getApiBaseUrl(),
    isProxy: !import.meta.env.VITE_API_URL?.startsWith('http'),
    recommendation: 'Using centralized API configuration. Proxy in production, direct URL in development.'
  };
};
