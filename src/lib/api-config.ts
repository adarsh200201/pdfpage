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
  // ALWAYS use relative path /api for all API calls
  // This ensures requests go through Netlify proxy, avoiding CORS issues
  // The proxy (netlify.toml) redirects /api/* to the backend
  return '/api';
};

export const getBackendUrl = (): string => {
  // Get backend base URL without /api suffix (for OAuth redirects)
  if (!import.meta.env.DEV && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // In development, use empty string (will use relative paths)
  return '';
};

export const getFullApiUrl = (endpoint: string): string => {
  // Remove any leading /api from the endpoint to prevent double /api/
  const cleanEndpoint = endpoint.replace(/^\/api/, '');
  const finalEndpoint = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;

  return `/api${finalEndpoint}`;
};

// Utility to check if backend is available
export const checkBackendHealth = async (retries = 3): Promise<boolean> => {
  for (let i = 0; i < retries; i++) {
    try {
      const healthUrl = getFullApiUrl('/health');
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout for cold start
      });
      if (response.ok) return true;
      
      // If 503, wait and retry (Render cold start)
      if (response.status === 503 && i < retries - 1) {
        console.log(`⏳ Backend is starting up, waiting ${(i + 1) * 5} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 5000));
        continue;
      }
    } catch (error) {
      if (i < retries - 1) {
        console.log(`⏳ Retrying backend connection (${i + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  return false;
};

// Fetch with automatic retry for cold starts
export const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  maxRetries = 2
): Promise<Response> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If 503 (service starting), wait and retry
      if (response.status === 503 && i < maxRetries - 1) {
        console.log(`⏳ Backend waking up, retrying in ${(i + 1) * 10} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (i + 1) * 10000));
        continue;
      }
      
      return response;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(`⏳ Request failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
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
