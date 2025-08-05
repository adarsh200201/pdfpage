#!/usr/bin/env node

/**
 * Script to update favicon files with the correct PdfPage logo
 * Downloads the official logo from Builder.io and generates all required favicon sizes
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Official logo URL from Builder.io
const LOGO_BASE_URL = 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee';

// Favicon files to update with exact working URLs
const FAVICON_FILES = [
  {
    name: 'favicon-16x16.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=16'
  },
  {
    name: 'favicon-32x32.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=32'
  },
  {
    name: 'favicon-48x48.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=48'
  },
  {
    name: 'apple-touch-icon.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=180'
  },
  {
    name: 'android-chrome-192x192.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=192'
  },
  {
    name: 'android-chrome-512x512.png',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=png&width=512'
  },
  {
    name: 'favicon.ico',
    url: 'https://cdn.builder.io/api/v1/image/assets%2Ffcbdb28308084edfa1fffc265e57f46e%2F5791d498f9994470ae52d766d30e56ee?format=ico&width=32'
  }
];

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

/**
 * Download a file from URL
 */
function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading: ${path.basename(outputPath)}`);
    
    const file = fs.createWriteStream(outputPath);
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(outputPath)}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(outputPath, () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Removed generateLogoUrl function - using direct URLs now

/**
 * Update all favicon files
 */
async function updateFavicons() {
  console.log('🎯 Starting favicon update process...');
  console.log(`📁 Public directory: ${PUBLIC_DIR}`);
  
  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    console.error(`❌ Public directory not found: ${PUBLIC_DIR}`);
    process.exit(1);
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const favicon of FAVICON_FILES) {
    try {
      const outputPath = path.join(PUBLIC_DIR, favicon.name);

      await downloadFile(favicon.url, outputPath);
      successCount++;

      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Failed to download ${favicon.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Update Summary:');
  console.log(`✅ Successfully updated: ${successCount} files`);
  console.log(`❌ Failed: ${errorCount} files`);
  
  if (successCount > 0) {
    console.log('\n🎉 Favicon update completed!');
    console.log('📝 Next steps:');
    console.log('1. Clear browser cache');
    console.log('2. Test the website in different browsers');
    console.log('3. Check Google Search Console for updated favicon');
    console.log('4. Wait 24-48 hours for search engines to update');
  }
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some files failed to update. Please check the errors above.');
    process.exit(1);
  }
}

// Run the update
updateFavicons().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
