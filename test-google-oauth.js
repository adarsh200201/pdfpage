// Test Google OAuth Configuration
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Google OAuth Configuration...\n');

// Check environment files
const envFiles = [
  'backend/.env',
  'backend/.env.production'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`📄 Checking ${file}:`);
    const content = fs.readFileSync(file, 'utf8');
    
    const googleClientId = content.match(/GOOGLE_CLIENT_ID=(.+)/);
    const googleClientSecret = content.match(/GOOGLE_CLIENT_SECRET=(.+)/);
    const googleCallbackUrl = content.match(/GOOGLE_CALLBACK_URL=(.+)/);
    
    if (googleClientId) {
      console.log(`✅ GOOGLE_CLIENT_ID: ${googleClientId[1].substring(0, 20)}...`);
    } else {
      console.log('❌ GOOGLE_CLIENT_ID: Not found');
    }
    
    if (googleClientSecret) {
      console.log(`✅ GOOGLE_CLIENT_SECRET: ${googleClientSecret[1].substring(0, 8)}...`);
    } else {
      console.log('❌ GOOGLE_CLIENT_SECRET: Not found');
    }
    
    if (googleCallbackUrl) {
      console.log(`✅ GOOGLE_CALLBACK_URL: ${googleCallbackUrl[1]}`);
    } else {
      console.log('❌ GOOGLE_CALLBACK_URL: Not found');
    }
    console.log('');
  } else {
    console.log(`❌ ${file}: File not found\n`);
  }
});

// Check frontend OAuth configuration
console.log('🔍 Frontend OAuth Configuration:');
console.log('✅ Development URL: http://localhost:5000/api/auth/google');
console.log('✅ Production URL: /api/auth/google (proxied by Netlify)');
console.log('');

// Google Cloud Console checklist
console.log('📋 Google Cloud Console Checklist:');
console.log('🔧 Required Authorized Redirect URIs:');
console.log('   • https://pdf-backend-935131444417.asia-south1.run.app/api/auth/google/callback');
console.log('   • https://pdfpage.in/api/auth/google/callback');
console.log('   • http://localhost:5000/api/auth/google/callback');
console.log('');
console.log('🔧 Required Authorized JavaScript Origins:');
console.log('   • https://pdfpage.in');
console.log('   • http://localhost:3000');
console.log('   • http://localhost:48752');
console.log('');

console.log('🚀 Next Steps:');
console.log('1. Configure redirect URIs in Google Cloud Console');
console.log('2. Clear browser cache and cookies');
console.log('3. Test OAuth flow on localhost:48752');
console.log('4. Check network tab for redirect URLs');
console.log('');

console.log('✅ OAuth configuration test completed!');
