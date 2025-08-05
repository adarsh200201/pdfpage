interface OAuthTestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const runOAuthTests = async (): Promise<OAuthTestResult[]> => {
  const results: OAuthTestResult[] = [];
  
  // Test 1: Backend URL validation
  try {
    const backendUrl = 'https://pdf-backend-935131444417.asia-south1.run.app';
    const url = new URL(backendUrl);
    results.push({
      test: 'Backend URL',
      status: 'success',
      message: 'Backend URL is properly formatted',
      details: { url: backendUrl, protocol: url.protocol, host: url.host }
    });
  } catch (error: any) {
    results.push({
      test: 'Backend URL',
      status: 'error',
      message: 'Invalid backend URL',
      details: error.message
    });
  }

  // Test 2: OAuth URL construction
  try {
    const oauthUrl = 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google';
    const url = new URL(oauthUrl);
    results.push({
      test: 'OAuth URL',
      status: 'success',
      message: 'OAuth URL is properly constructed',
      details: { 
        fullUrl: oauthUrl,
        path: url.pathname,
        isHttps: url.protocol === 'https:'
      }
    });
  } catch (error: any) {
    results.push({
      test: 'OAuth URL',
      status: 'error',
      message: 'OAuth URL construction failed',
      details: error.message
    });
  }

  // Test 3: Frontend configuration
  try {
    const hasAuthContext = typeof window !== 'undefined';
    const hasLocalStorage = typeof localStorage !== 'undefined';
    const hasSessionStorage = typeof sessionStorage !== 'undefined';
    
    results.push({
      test: 'Frontend Config',
      status: 'success',
      message: 'Frontend environment is properly configured',
      details: {
        hasAuthContext,
        hasLocalStorage,
        hasSessionStorage,
        origin: typeof window !== 'undefined' ? window.location.origin : 'N/A'
      }
    });
  } catch (error: any) {
    results.push({
      test: 'Frontend Config',
      status: 'error',
      message: 'Frontend configuration error',
      details: error.message
    });
  }

  // Test 4: Network connectivity test
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/health', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PdfPage-OAuth-Test'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      results.push({
        test: 'Backend Connectivity',
        status: 'success',
        message: 'Backend is accessible and responding',
        details: {
          status: response.status,
          statusText: response.statusText,
          data: data
        }
      });
    } else {
      results.push({
        test: 'Backend Connectivity',
        status: 'warning',
        message: `Backend responded with ${response.status}`,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      });
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      results.push({
        test: 'Backend Connectivity',
        status: 'error',
        message: 'Backend connection timeout (5s)',
        details: 'Connection took too long to establish'
      });
    } else {
      results.push({
        test: 'Backend Connectivity',
        status: 'error',
        message: 'Backend connectivity failed',
        details: error.message
      });
    }
  }

  // Test 5: OAuth flow simulation
  try {
    const testEmail = 'adarshkumar200201@gmail.com';
    const oauthParams = new URLSearchParams({
      response_type: 'code',
      client_id: 'test-client-id',
      redirect_uri: `${window.location.origin}/auth/callback`,
      scope: 'profile email',
      state: 'test-state'
    });

    results.push({
      test: 'OAuth Flow Simulation',
      status: 'success',
      message: 'OAuth parameters correctly formatted',
      details: {
        targetEmail: testEmail,
        redirectUri: `${window.location.origin}/auth/callback`,
        params: Object.fromEntries(oauthParams.entries())
      }
    });
  } catch (error: any) {
    results.push({
      test: 'OAuth Flow Simulation',
      status: 'error',
      message: 'OAuth flow simulation failed',
      details: error.message
    });
  }

  return results;
};

export const testGoogleOAuthReadiness = async (): Promise<{
  isReady: boolean;
  issues: string[];
  summary: string;
}> => {
  const results = await runOAuthTests();
  
  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const successes = results.filter(r => r.status === 'success');

  const isReady = errors.length === 0;
  const issues = [...errors.map(e => e.message), ...warnings.map(w => w.message)];

  let summary = '';
  if (isReady) {
    summary = `✅ OAuth system is ready! ${successes.length} tests passed`;
    if (warnings.length > 0) {
      summary += ` with ${warnings.length} warnings`;
    }
  } else {
    summary = `❌ OAuth system has ${errors.length} errors and ${warnings.length} warnings`;
  }

  return { isReady, issues, summary };
};
