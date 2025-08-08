@echo off
echo 🚀 Setting up Gemini AI SEO Automation for PdfPage.in
echo ================================================

cd seo-automation

echo 📦 Installing dependencies...
npm install @google/generative-ai simple-git

echo ✅ Dependencies installed!

echo 🧪 Testing Gemini API connection...
node -e "
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI('AIzaSyC-Ozu3VLqNiVdavv7Zz92F2AKMNGaxpzQ');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
console.log('✅ Gemini API connection successful!');
"

echo 🎯 Running SEO automation...
npm run seo

echo 🎉 Setup complete!
echo 📊 Check seo-automation/seo-report.json for results
echo 📁 Generated assets are in seo-automation/generated/

pause
