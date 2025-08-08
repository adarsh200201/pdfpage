#!/usr/bin/env node

/**
 * Test script to verify production API connectivity
 * Run this to check if proxy configuration is working
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testing Production API Connectivity...');
console.log('=' .repeat(50));

// Test endpoints
const tests = [
  {
    name: 'Backend Health Check',
    url: 'https://pdf-backend-935131444417.asia-south1.run.app/api/health',
    description: 'Direct backend connectivity'
  },
  {
    name: 'Production Frontend Health',
    url: 'https://pdfpage.in/api/health',
    description: 'Proxy through production frontend'
  },
  {
    name: 'Google OAuth Endpoint',
    url: 'https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google',
    description: 'OAuth redirect endpoint (should redirect)'
  },
  {
    name: 'Production OAuth Proxy',
    url: 'https://pdfpage.in/api/auth/google',
    description: 'OAuth through production proxy (should redirect)'
  }
];

/**
 * Test a single endpoint
 */
function testEndpoint(test) {
  return new Promise((resolve) => {
    const isHttps = test.url.startsWith('https:');
    const client = isHttps ? https : http;
    
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Purpose: ${test.description}`);
    
    const startTime = Date.now();
    
    const req = client.get(test.url, (res) => {
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`   ⏱️  Response Time: ${duration}ms`);
      
      if (res.headers.location) {
        console.log(`   🔄 Redirect: ${res.headers.location}`);
      }
      
      // Check for important headers
      if (res.headers['content-type']) {
        console.log(`   📄 Content-Type: ${res.headers['content-type']}`);
      }
      
      let result = {
        name: test.name,
        url: test.url,
        status: res.statusCode,
        success: res.statusCode < 400,
        duration,
        redirect: res.headers.location
      };
      
      // Read response body for health endpoints
      if (test.url.includes('/health')) {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            console.log(`   💓 Health: ${data.status || 'Unknown'}`);
            result.health = data;
          } catch (e) {
            console.log(`   📝 Response: ${body.substring(0, 100)}...`);
          }
          resolve(result);
        });
      } else {
        resolve(result);
      }
    });
    
    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   ⏱️  Failed after: ${duration}ms`);
      
      resolve({
        name: test.name,
        url: test.url,
        error: error.message,
        success: false,
        duration
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      console.log(`   ⏰ Timeout: Request took longer than 10 seconds`);
      resolve({
        name: test.name,
        url: test.url,
        error: 'Timeout',
        success: false,
        duration: 10000
      });
    });
  });
}

/**
 * Run all tests
 */
async function runTests() {
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    results.push(result);
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(30));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`❌ Failed: ${failed.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log('\n🚨 Failed Tests:');
    failed.forEach(f => {
      console.log(`   • ${f.name}: ${f.error || f.status}`);
    });
  }
  
  if (successful.length > 0) {
    console.log('\n✅ Successful Tests:');
    successful.forEach(s => {
      console.log(`   • ${s.name}: ${s.status} (${s.duration}ms)`);
    });
  }
  
  // Specific recommendations
  console.log('\n💡 Recommendations:');
  
  const backendHealth = results.find(r => r.name === 'Backend Health Check');
  const proxyHealth = results.find(r => r.name === 'Production Frontend Health');
  
  if (backendHealth?.success && !proxyHealth?.success) {
    console.log('   🔧 Backend is working but proxy is not');
    console.log('   → Check Netlify _redirects configuration');
    console.log('   → Verify deployment includes proxy rules');
  } else if (!backendHealth?.success) {
    console.log('   🚨 Backend server appears to be down');
    console.log('   → Check Google Cloud Run backend deployment');
  } else if (backendHealth?.success && proxyHealth?.success) {
    console.log('   🎉 Both backend and proxy are working correctly!');
    console.log('   → Authentication should work properly now');
  }
  
  console.log('\n🔍 Next Steps:');
  console.log('   1. If proxy tests fail, redeploy with updated _redirects');
  console.log('   2. Test authentication: https://pdfpage.in/auth/google');
  console.log('   3. Check browser network tab for 404 errors');
  
  return results;
}

// Run the tests
runTests().catch(console.error);
