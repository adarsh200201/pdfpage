#!/usr/bin/env node

/**
 * Google OAuth Test Script
 * Tests the OAuth endpoints and configuration
 */

const https = require('https');
const http = require('http');

console.log('🧪 Testing Google OAuth Configuration...\n');

// Test 1: Backend Health Check
function testBackendHealth() {
  return new Promise((resolve) => {
    console.log('1️⃣ Testing Backend Health...');
    
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('   ✅ Backend is running and healthy');
          resolve(true);
        } else {
          console.log('   ❌ Backend health check failed');
          resolve(false);
        }
      });
    });
    
    req.on('error', () => {
      console.log('   ❌ Backend is not running on port 5000');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Backend health check timed out');
      resolve(false);
    });
  });
}

// Test 2: OAuth Endpoint Check
function testOAuthEndpoint() {
  return new Promise((resolve) => {
    console.log('\n2️⃣ Testing OAuth Endpoint...');
    
    const req = http.get('http://localhost:5000/api/auth/google', (res) => {
      if (res.statusCode === 302) {
        const location = res.headers.location;
        if (location && location.includes('accounts.google.com')) {
          console.log('   ✅ OAuth endpoint redirects to Google correctly');
          console.log(`   📍 Redirect URL: ${location.substring(0, 100)}...`);
          
          // Check if callback URL is localhost
          if (location.includes('localhost:5000')) {
            console.log('   ✅ Callback URL is correctly set to localhost');
          } else {
            console.log('   ⚠️  Callback URL might not be localhost');
          }
          resolve(true);
        } else {
          console.log('   ❌ OAuth endpoint does not redirect to Google');
          resolve(false);
        }
      } else {
        console.log(`   ❌ OAuth endpoint returned status ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('   ❌ Failed to connect to OAuth endpoint');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ OAuth endpoint test timed out');
      resolve(false);
    });
  });
}

// Test 3: Frontend Accessibility
function testFrontend() {
  return new Promise((resolve) => {
    console.log('\n3️⃣ Testing Frontend Accessibility...');
    
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('   ✅ Frontend is accessible on port 3000');
        resolve(true);
      } else {
        console.log(`   ❌ Frontend returned status ${res.statusCode}`);
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log('   ❌ Frontend is not running on port 3000');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log('   ❌ Frontend accessibility test timed out');
      resolve(false);
    });
  });
}

// Run all tests
async function runTests() {
  const results = {
    backend: await testBackendHealth(),
    oauth: await testOAuthEndpoint(),
    frontend: await testFrontend()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`OAuth Endpoint: ${results.oauth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Access: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = results.backend && results.oauth && results.frontend;
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Google OAuth should be working correctly.');
    console.log('\n🔗 To test the complete flow:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Click on any "Sign in with Google" button');
    console.log('   3. Complete the Google authentication');
    console.log('   4. You should be redirected back and signed in');
  } else {
    console.log('\n❌ Some tests failed. Please check the configuration.');
    
    if (!results.backend) {
      console.log('   • Start the backend: cd backend && npm run dev');
    }
    if (!results.frontend) {
      console.log('   • Start the frontend: npm run dev');
    }
    if (!results.oauth) {
      console.log('   • Check backend OAuth configuration in .env file');
    }
  }
  
  console.log('\n📚 For more details, see: GOOGLE_OAUTH_FIX_COMPLETE.md');
}

// Run the tests
runTests().catch(console.error);
