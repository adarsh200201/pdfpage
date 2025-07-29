// OAuth Flow Test Script
console.log('🔍 Testing Google OAuth Configuration...');

// Test environment variables
const requiredEnvVars = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET', 
  'GOOGLE_CALLBACK_URL',
  'FRONTEND_URL'
];

console.log('\n📋 Environment Variables Check:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    // Mask sensitive data
    const maskedValue = envVar.includes('SECRET') 
      ? value.substring(0, 8) + '...' 
      : value;
    console.log(`✅ ${envVar}: ${maskedValue}`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
  }
});

console.log('\n🔗 Expected OAuth URLs:');
console.log('Development OAuth URL: http://localhost:5000/api/auth/google');
console.log('Development Callback: http://localhost:5000/api/auth/google/callback');
console.log('Production OAuth URL: https://pdfpage.in/api/auth/google');
console.log('Production Callback: https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback');

console.log('\n📝 Required Google Cloud Console Redirect URIs:');
console.log('- https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback');
console.log('- https://pdfpage.in/api/auth/google/callback');
console.log('- http://localhost:5000/api/auth/google/callback');

console.log('\n🧪 Test Steps:');
console.log('1. Visit http://localhost:3000/test-oauth.html');
console.log('2. Click "Test Google Login"');
console.log('3. Check console for any errors');
console.log('4. Verify redirect URLs in network tab');

console.log('\n✅ OAuth test configuration ready!');
