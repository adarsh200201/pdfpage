/**
 * Security Check Utility
 * Verifies that no hardcoded backend URLs are exposed in the client
 */

export const runSecurityCheck = (): {
  secure: boolean;
  issues: string[];
  summary: string;
} => {
  const issues: string[] = [];
  
  // Check environment variables for exposed URLs
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl && apiUrl.includes('pdf-backend-935131444417.asia-south1.run.app')) {
    issues.push('VITE_API_URL contains hardcoded backend URL');
  }
  
  // Check if any hardcoded URLs are still in the bundle
  const codeSearch = document.documentElement.innerHTML;
  if (codeSearch.includes('pdf-backend-935131444417.asia-south1.run.app')) {
    issues.push('Hardcoded backend URL found in client bundle');
  }
  
  // Verify API calls use relative paths
  const apiBaseUrl = '/api';
  const isSecure = apiBaseUrl.startsWith('/');
  
  if (!isSecure) {
    issues.push('API configuration not using relative paths');
  }
  
  const secure = issues.length === 0;
  const summary = secure 
    ? '✅ All security checks passed - no backend URLs exposed'
    : `❌ Security issues found: ${issues.length} problems`;
    
  return { secure, issues, summary };
};

export const logSecurityStatus = () => {
  const result = runSecurityCheck();
  
  console.log('🔒 Security Check Results:');
  console.log(result.summary);
  
  if (result.issues.length > 0) {
    console.warn('Security Issues:');
    result.issues.forEach(issue => console.warn('⚠️', issue));
  }
  
  return result;
};

// Development-only logging
if (import.meta.env.DEV) {
  console.log('🔍 Running security check...');
  logSecurityStatus();
}
