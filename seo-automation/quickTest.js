import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genAI = new GoogleGenerativeAI("AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ");

async function quickSEOTest() {
  console.log('🧪 Quick SEO Test Starting...');
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `
    Create 3 SEO improvements for a PDF compression tool page:
    1. Meta title suggestion
    2. Meta description suggestion  
    3. One internal linking opportunity
    
    Keep it simple and practical.
    `;
    
    console.log('📤 Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Response received!');
    console.log('=' .repeat(50));
    console.log(text);
    console.log('=' .repeat(50));
    
    // Save to file
    fs.writeFileSync('quick-seo-test-result.txt', text);
    console.log('💾 Result saved to: quick-seo-test-result.txt');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

quickSEOTest();
