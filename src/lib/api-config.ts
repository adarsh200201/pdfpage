/**
 * API Configuration utility
 * Always uses Google Cloud backend for consistency
 */

export const getApiUrl = (path: string = ''): string => {
  // Always use Google Cloud backend for consistency
  // Remove local backend option to ensure consistent backend usage
  const baseUrl = 'https://pdf-backend-935131444417.asia-south1.run.app';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  // Always use Google Cloud backend for consistency
  return 'https://pdf-backend-935131444417.asia-south1.run.app';
};

export const getFullApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Utility to check if backend is available
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/health`, {
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
    useLocalBackend: false,
    apiBaseUrl: getApiBaseUrl(),
    recommendation: 'Always using Google Cloud backend for consistency. No local backend support.'
  };
};
