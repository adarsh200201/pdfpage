/**
 * API Configuration utility
 * Handles API URL resolution for development and production environments
 */

// Check if we should use local backend (when VITE_USE_LOCAL_BACKEND is set)
const useLocalBackend = import.meta.env.VITE_USE_LOCAL_BACKEND === 'true';

export const getApiUrl = (path: string = ''): string => {
  // In development, check if we should use local backend
  if (import.meta.env.DEV && useLocalBackend) {
    return `http://localhost:5000${path}`;
  }

  // Use production backend (Google Cloud Run)
  const baseUrl = 'https://pdf-backend-935131444417.asia-south1.run.app';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getApiBaseUrl = (): string => {
  if (import.meta.env.DEV && useLocalBackend) {
    return 'http://localhost:5000';
  }
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
    useLocalBackend,
    apiBaseUrl: getApiBaseUrl(),
    recommendation: useLocalBackend 
      ? 'Run "npm run dev:full" to start both frontend and backend'
      : 'Using production backend. Set VITE_USE_LOCAL_BACKEND=true to use local backend'
  };
};
