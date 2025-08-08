/**
 * API Configuration utility
 * Uses centralized configuration for consistent API calls
 */

export const getApiUrl = (path: string = ''): string => {
  // Smart environment detection for API URL
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Use relative path for production deployment (Netlify proxy)
  // Use full URL only for local development
  let apiUrl: string;

  if (isDevelopment && isLocalhost) {
    // Local development - use full backend URL
    apiUrl = import.meta.env.VITE_API_URL || 'https://pdf-backend-935131444417.asia-south1.run.app/api';
  } else {
    // Production deployment - use relative path for Netlify proxy
    apiUrl = '/api';
  }

  // If it's a full URL, use it directly
  if (apiUrl.startsWith('http')) {
    return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  // Otherwise, it's a relative path (production proxy)
  return `${apiUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  // Smart environment detection for API base URL
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Use relative path for production deployment (Netlify proxy)
  // Use full URL only for local development
  if (isDevelopment && isLocalhost) {
    // Local development - use full backend URL
    return import.meta.env.VITE_API_URL || 'https://pdf-backend-935131444417.asia-south1.run.app/api';
  } else {
    // Production deployment - use relative path for Netlify proxy
    return '/api';
  }
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  console.log('🔍 [API-CONFIG] Building URL:', {
    baseUrl,
    endpoint,
    cleanEndpoint,
    finalUrl: `${baseUrl}${cleanEndpoint}`,
    envApiUrl: import.meta.env.VITE_API_URL,
    isDevelopment,
    isLocalhost,
    hostname: window.location.hostname,
    mode: import.meta.env.MODE
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
