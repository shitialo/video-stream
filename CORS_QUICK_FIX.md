# 🚨 CORS Error - Quick Fix (2 Minutes)

## The Problem
Your browser is blocking uploads because R2 doesn't allow requests from your Netlify domain.

## The Solution
Configure CORS on your R2 bucket to allow your Netlify site.

---

## ✅ Step-by-Step Fix

### Step 1: Go to Cloudflare Dashboard
1. Open https://dash.cloudflare.com
2. Click **R2** in the left sidebar
3. Click on your bucket name (e.g., `movies`)

### Step 2: Open CORS Settings
1. Click the **Settings** tab
2. Scroll down to **CORS Policy** section
3. Click **Edit CORS Policy** or **Add CORS Policy**

### Step 3: Add This Configuration

**Copy and paste this JSON:**

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

### Step 4: Save
1. Click **Save** or **Update**
2. Wait 10-30 seconds for changes to apply

### Step 5: Test
1. Go back to your Netlify site
2. Try uploading a video
3. It should work now! ✅

---

## 🎯 What Each Setting Does

- **AllowedOrigins**: Which websites can access your R2 bucket
  - Your Netlify URL: `https://inspiring-lamington-662fc8.netlify.app`
  - All Netlify sites: `https://*.netlify.app` (wildcard)
  - Local development: `http://localhost:8888` and `http://localhost:3000`

- **AllowedMethods**: Which HTTP methods are allowed
  - `PUT`: For uploading files
  - `GET`: For streaming/downloading files
  - `POST`, `HEAD`, `DELETE`: For other operations

- **AllowedHeaders**: Which headers can be sent
  - `*`: Allows all headers

- **ExposeHeaders**: Which headers the browser can read
  - `ETag`: For file verification
  - `x-amz-meta-*`: For custom metadata

- **MaxAgeSeconds**: How long browsers cache CORS settings (1 hour)

---

## 🔄 If You Add a Custom Domain Later

Just add your custom domain to the `AllowedOrigins` array:

```json
"AllowedOrigins": [
  "https://inspiring-lamington-662fc8.netlify.app",
  "https://your-custom-domain.com",  // Add this
  "https://*.netlify.app",
  "http://localhost:8888"
]
```

---

## ✅ That's It!

After saving the CORS configuration, your uploads will work immediately.

**No code changes needed** - just this one-time configuration in Cloudflare!

---

## 🆘 Still Not Working?

1. **Wait 1-2 minutes** - Changes can take a moment to propagate
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Clear browser cache**
4. **Check that you saved the CORS config** - Go back to Settings and verify it's there
5. **Verify your Netlify URL** is in the AllowedOrigins list

---

**Once CORS is configured, you're all set! 🎉**

