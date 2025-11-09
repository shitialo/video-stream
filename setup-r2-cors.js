/**
 * Script to configure CORS on Cloudflare R2 bucket
 * 
 * Usage:
 * 1. Install node-fetch: npm install node-fetch@2
 * 2. Update the variables below with your credentials
 * 3. Run: node setup-r2-cors.js
 * 
 * Or use the Cloudflare Dashboard (easier - see FIX_CORS.md)
 */

const fetch = require('node-fetch');

// ⚠️ UPDATE THESE VALUES:
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID || 'your_account_id_here';
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'your_bucket_name_here';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || 'your_api_token_here';
const NETLIFY_URL = process.env.NETLIFY_URL || 'https://inspiring-lamington-662fc8.netlify.app';

// CORS Configuration
const corsConfig = [
  {
    AllowedOrigins: [
      NETLIFY_URL,
      'https://*.netlify.app',  // All Netlify sites
      'http://localhost:8888',  // Local Netlify dev
      'http://localhost:3000'   // Local Vite dev
    ],
    AllowedMethods: [
      'GET',
      'PUT',
      'POST',
      'HEAD',
      'DELETE'
    ],
    AllowedHeaders: [
      '*'
    ],
    ExposeHeaders: [
      'ETag',
      'x-amz-meta-*'
    ],
    MaxAgeSeconds: 3600
  }
];

async function setupCORS() {
  console.log('🚀 Setting up CORS for R2 bucket...\n');
  console.log(`Account ID: ${ACCOUNT_ID}`);
  console.log(`Bucket Name: ${BUCKET_NAME}`);
  console.log(`Netlify URL: ${NETLIFY_URL}\n`);

  // Validate inputs
  if (ACCOUNT_ID === 'your_account_id_here' || 
      BUCKET_NAME === 'your_bucket_name_here' || 
      API_TOKEN === 'your_api_token_here') {
    console.error('❌ Error: Please update the variables at the top of this file!');
    console.error('   Or set environment variables:');
    console.error('   - R2_ACCOUNT_ID');
    console.error('   - R2_BUCKET_NAME');
    console.error('   - CLOUDFLARE_API_TOKEN');
    console.error('   - NETLIFY_URL (optional)');
    process.exit(1);
  }

  try {
    const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`;
    
    console.log('📡 Sending request to Cloudflare API...');
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(corsConfig)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ API Error:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }
    
    if (data.success) {
      console.log('✅ CORS configured successfully!');
      console.log('\n📋 Configuration:');
      console.log(JSON.stringify(corsConfig, null, 2));
      console.log('\n🎉 Your R2 bucket is now ready for uploads!');
      console.log('   Try uploading a video from your Netlify site.');
    } else {
      console.error('❌ Error configuring CORS:');
      if (data.errors) {
        data.errors.forEach(error => {
          console.error(`   - ${error.message}`);
        });
      }
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Verify your API token has R2 permissions');
    console.error('   2. Check that your Account ID is correct');
    console.error('   3. Verify your bucket name is correct');
    console.error('   4. Make sure node-fetch@2 is installed: npm install node-fetch@2');
    process.exit(1);
  }
}

setupCORS();

