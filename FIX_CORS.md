# 🔧 Fix CORS Error - Quick Guide

You're getting a CORS error because your R2 bucket needs CORS configuration. Here's how to fix it:

## 🚀 Quick Fix (2 Options)

### Option 1: Configure CORS via Cloudflare Dashboard (Easiest - 2 minutes)

1. **Go to Cloudflare Dashboard**
   - Visit https://dash.cloudflare.com
   - Navigate to **R2** > Your bucket

2. **Open Bucket Settings**
   - Click on your bucket name
   - Click **Settings** tab
   - Scroll down to **CORS Policy**

3. **Add CORS Configuration**
   - Click **Edit CORS Policy**
   - Click **Add CORS Policy** or edit existing
   - Use this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://inspiring-lamington-662fc8.netlify.app",
      "https://*.netlify.app",
      "http://localhost:8888",
      "http://localhost:3000"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "HEAD",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-*"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

4. **Save Configuration**
   - Click **Save** or **Update**
   - Wait a few seconds for changes to propagate

5. **Test Again**
   - Go back to your Netlify site
   - Try uploading a video
   - It should work now! ✅

---

### Option 2: Configure CORS via API (Advanced)

If you prefer using the API, use the script below.

#### Step 1: Get Your Cloudflare API Token

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit Cloudflare Workers** template
4. Add R2 permissions
5. Copy the token

#### Step 2: Run the CORS Configuration Script

Save this as `setup-cors.js`:

```javascript
const fetch = require('node-fetch');

const ACCOUNT_ID = 'your_account_id';
const BUCKET_NAME = 'your_bucket_name';
const API_TOKEN = 'your_api_token';
const NETLIFY_URL = 'https://inspiring-lamington-662fc8.netlify.app';

const corsConfig = [
  {
    AllowedOrigins: [
      NETLIFY_URL,
      'https://*.netlify.app',
      'http://localhost:8888',
      'http://localhost:3000'
    ],
    AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
    AllowedHeaders: ['*'],
    ExposeHeaders: ['ETag', 'x-amz-meta-*'],
    MaxAgeSeconds: 3600
  }
];

async function setupCORS() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/cors`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(corsConfig)
      }
    );

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ CORS configured successfully!');
    } else {
      console.error('❌ Error:', data.errors);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

setupCORS();
```

#### Step 3: Run the Script

```bash
node setup-cors.js
```

---

## 🔍 Verify CORS is Working

After configuring CORS:

1. **Check Browser Console**
   - Upload a video
   - No CORS errors should appear

2. **Check Network Tab**
   - OPTIONS request should return 200
   - Response should include CORS headers

---

## 🌐 Add Your Custom Domain (If You Have One)

If you add a custom domain later, update the CORS configuration to include it:

```json
{
  "AllowedOrigins": [
    "https://inspiring-lamington-662fc8.netlify.app",
    "https://your-custom-domain.com",
    "https://*.netlify.app",
    "http://localhost:8888"
  ],
  ...
}
```

---

## 🐛 Still Having Issues?

### Issue: CORS still not working after configuration

**Solutions:**
1. Wait 1-2 minutes for changes to propagate
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check that your Netlify URL is in AllowedOrigins
5. Verify CORS config is saved correctly

### Issue: CORS works but upload fails

**Check:**
1. Verify R2 credentials are correct
2. Check bucket permissions
3. Verify file size is under limits
4. Check browser console for other errors

---

## 📝 Quick Reference

**Your Netlify URL:**
```
https://inspiring-lamington-662fc8.netlify.app
```

**CORS Configuration Location:**
- Cloudflare Dashboard > R2 > Your Bucket > Settings > CORS Policy

**Required Origins:**
- Your Netlify URL
- `https://*.netlify.app` (for all Netlify sites)
- `http://localhost:8888` (for local development)
- `http://localhost:3000` (for local development)

---

**Once CORS is configured, your uploads should work perfectly! ✅**

