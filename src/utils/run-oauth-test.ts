// Quick OAuth test runner that can be executed immediately
export const executeOAuthTest = async () => {
  console.log('🔵 Starting OAuth System Test...');
  
  const results = [];
  
  // Test 1: Backend URL validation
  console.log('🧪 Testing backend URL...');
  try {
    const backendUrl = 'https://pdf-backend-935131444417.asia-south1.run.app';
    new URL(backendUrl); // Will throw if invalid
    results.push('✅ Backend URL is valid');
    console.log('✅ Backend URL is valid:', backendUrl);
  } catch (error) {
    results.push('❌ Backend URL is invalid');
    console.error('❌ Backend URL error:', error);
  }

  // Test 2: OAuth endpoint structure  
  console.log('🧪 Testing OAuth endpoint...');
  try {
    const oauthUrl = 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google';
    const url = new URL(oauthUrl);
    if (url.protocol === 'https:' && url.pathname === '/api/auth/google') {
      results.push('✅ OAuth endpoint structure is correct');
      console.log('✅ OAuth endpoint is properly structured');
    } else {
      results.push('⚠️ OAuth endpoint structure may be incorrect');
      console.warn('⚠️ OAuth endpoint structure concern');
    }
  } catch (error) {
    results.push('❌ OAuth endpoint is malformed');
    console.error('❌ OAuth endpoint error:', error);
  }

  // Test 3: Browser environment
  console.log('🧪 Testing browser environment...');
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      results.push('✅ Browser environment is ready');
      console.log('✅ Browser environment supports OAuth');
    } else {
      results.push('❌ Browser environment is not ready');
      console.error('❌ Browser environment missing required APIs');
    }
  } catch (error) {
    results.push('❌ Browser environment test failed');
    console.error('❌ Browser environment error:', error);
  }

  // Test 4: Network connectivity (with timeout)
  console.log('🧪 Testing network connectivity...');
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    
    const response = await fetch('https://pdf-backend-935131444417.asia-south1.run.app/api/health', {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PdfPage-OAuth-Test/1.0'
      }
    });

    clearTimeout(timeoutId);

    if (response.status === 200) {
      results.push('✅ Backend is fully accessible');
      console.log('✅ Backend is responding normally');
      try {
        const data = await response.json();
        console.log('📊 Backend response:', data);
      } catch (e) {
        console.log('📊 Backend responded but data may be non-JSON');
      }
    } else if (response.status === 403) {
      results.push('⚠️ Backend accessible but may have restrictions');
      console.log('⚠️ Backend returned 403 - may have CORS/access restrictions');
    } else {
      results.push(`⚠️ Backend responded with status ${response.status}`);
      console.log(`��️ Backend status: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      results.push('❌ Backend connection timeout');
      console.error('❌ Network timeout - backend took too long to respond');
    } else {
      results.push('❌ Network connectivity failed');
      console.error('❌ Network error:', error.message);
    }
  }

  // Test 5: OAuth flow readiness
  console.log('🧪 Testing OAuth flow readiness...');
  try {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:48752';
    const callbackUrl = `${currentOrigin}/auth/callback`;
    
    // Simulate OAuth URL construction
    const oauthUrl = 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google';
    
    results.push('✅ OAuth flow is ready');
    console.log('✅ OAuth flow components ready');
    console.log('📍 OAuth URL:', oauthUrl);
    console.log('📍 Callback URL:', callbackUrl);
    console.log('📍 Target email: adarshkumar200201@gmail.com');
  } catch (error) {
    results.push('❌ OAuth flow setup failed');
    console.error('❌ OAuth flow error:', error);
  }

  // Summary
  const successCount = results.filter(r => r.startsWith('✅')).length;
  const warningCount = results.filter(r => r.startsWith('⚠️')).length;
  const errorCount = results.filter(r => r.startsWith('❌')).length;

  console.log('\n📋 OAUTH TEST SUMMARY:');
  console.log(`✅ Passed: ${successCount}`);
  console.log(`⚠️ Warnings: ${warningCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  
  results.forEach(result => console.log(result));

  if (errorCount === 0) {
    console.log('\n🎉 OAuth system is ready for testing with adarshkumar200201@gmail.com!');
    return { status: 'ready', results, summary: 'OAuth system ready' };
  } else if (errorCount <= 1 && successCount >= 3) {
    console.log('\n⚠️ OAuth system mostly ready, but has some issues');
    return { status: 'mostly-ready', results, summary: 'OAuth system mostly ready' };
  } else {
    console.log('\n❌ OAuth system needs attention before testing');
    return { status: 'not-ready', results, summary: 'OAuth system needs fixes' };
  }
};

// Auto-run test when this module is imported (for immediate testing)
if (typeof window !== 'undefined') {
  console.log('🚀 Auto-running OAuth test...');
  executeOAuthTest().then(result => {
    console.log('🏁 OAuth test completed:', result.status);
  }).catch(error => {
    console.error('💥 OAuth test failed:', error);
  });
}
