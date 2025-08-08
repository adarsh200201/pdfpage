#!/usr/bin/env node

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Quick test to verify Gemini API is working
 */

async function testGeminiAPI() {
  console.log('🧪 Testing Gemini AI API...');
  
  try {
    const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Analyze this simple HTML for SEO and suggest one improvement:
    <html>
      <head><title>PDF Tools</title></head>
      <body><h1>Welcome</h1><p>Convert your PDFs</p></body>
    </html>
    `;

    console.log('📤 Sending test prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    console.log('✅ Gemini API Response:');
    console.log('=' .repeat(50));
    console.log(response.text());
    console.log('=' .repeat(50));
    console.log('🎉 Test successful! Gemini AI is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if the API key is correct');
    console.log('2. Verify internet connection');
    console.log('3. Ensure @google/generative-ai is installed');
  }
}

testGeminiAPI();
