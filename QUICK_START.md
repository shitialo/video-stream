# ⚡ Quick Start Guide

Get your video streaming app running in 5 minutes!

## 🎯 What You Need

1. **Node.js 18+** installed
2. **Cloudflare R2** credentials (Account ID, Access Keys, Bucket Name)
3. That's it!

## 🚀 3 Steps to Run Locally

### Step 1: Install Dependencies

```bash
npm install
npm install -g netlify-cli
```

### Step 2: Configure Credentials

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Cloudflare R2 credentials:

```env
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=your_bucket_name
```

### Step 3: Run the App

```bash
netlify dev
```

Open http://localhost:8888 and start uploading videos! 🎉

---

## 🌐 Deploy to Netlify

### Quick Deploy (5 minutes)

```bash
# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Add environment variables
netlify env:set R2_ACCOUNT_ID "your_value"
netlify env:set R2_ACCESS_KEY_ID "your_value"
netlify env:set R2_SECRET_ACCESS_KEY "your_value"
netlify env:set R2_BUCKET_NAME "your_value"

# Deploy to production
netlify deploy --prod
```

Done! Your app is now live! 🚀

---

## 📚 Need More Help?

- **Full deployment guide:** See `DEPLOYMENT_GUIDE.md`
- **Cloudflare R2 setup:** See `DEPLOYMENT_GUIDE.md` Part 1
- **Troubleshooting:** See `README.md`

---

## 🎬 Features

✅ Drag & drop video upload  
✅ Progress tracking  
✅ Advanced video player (Video.js)  
✅ Multiple playback speeds  
✅ Keyboard shortcuts  
✅ Picture-in-Picture  
✅ Search & filter  
✅ Dark mode  
✅ Fully responsive  

Enjoy your video streaming app! 🍿

