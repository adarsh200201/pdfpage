// Environment variables checker
export const checkEnvironment = () => {
  console.log("🔍 [ENV-CHECK] Environment Variables:");
  console.log("VITE_API_URL:", import.meta.env.VITE_API_URL);
  console.log("VITE_APP_URL:", import.meta.env.VITE_APP_URL);
  console.log("NODE_ENV:", import.meta.env.NODE_ENV);
  console.log("MODE:", import.meta.env.MODE);
  console.log("DEV:", import.meta.env.DEV);
  console.log("PROD:", import.meta.env.PROD);

  // Test the OAuth URL construction
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const googleOAuthUrl = `${apiUrl}/auth/google`;

  console.log("🔗 [ENV-CHECK] Constructed URLs:");
  console.log("API URL:", apiUrl);
  console.log("Google OAuth URL:", googleOAuthUrl);

  return {
    apiUrl,
    googleOAuthUrl,
    hasViteApiUrl: !!import.meta.env.VITE_API_URL,
  };
};

// Run check immediately when imported
checkEnvironment();
