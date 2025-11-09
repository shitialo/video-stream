# 🚀 Deploy from GitHub to Netlify - Step by Step

You've committed your code to GitHub. Now let's deploy it to Netlify!

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- ✅ Code committed to GitHub
- ✅ Cloudflare R2 account with credentials ready
- ✅ R2 bucket created
- ✅ Netlify account (or create one - it's free!)

---

## 🎯 Step 1: Create/Login to Netlify Account

1. Go to **https://app.netlify.com**
2. Click **Sign up** (or **Log in** if you have an account)
3. Choose **Sign up with GitHub** (recommended - easier integration!)
4. Authorize Netlify to access your GitHub account
5. Complete the signup process

---

## 🔗 Step 2: Connect Your GitHub Repository

1. Once logged in, you'll see your Netlify dashboard
2. Click **Add new site** (top right)
3. Select **Import an existing project**
4. Choose **GitHub** as your Git provider
5. If prompted, authorize Netlify to access your GitHub repositories
6. **Find and select your repository** from the list
7. Click on your repository name

---

## ⚙️ Step 3: Configure Build Settings

Netlify should automatically detect your settings from `netlify.toml`, but let's verify:

### Build Configuration:
- **Branch to deploy:** `main` (or `master` - whatever your main branch is)
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

**Important:** Make sure these match exactly:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

If Netlify auto-detected these, you're good! If not, click **Show advanced** and set them.

---

## 🔐 Step 4: Add Environment Variables

**This is CRITICAL!** Your app won't work without these.

1. Before clicking "Deploy site", click **Show advanced** (or **Advanced build settings**)
2. Click **New variable** to add each environment variable:

### Add These 4 Environment Variables:

#### Variable 1:
- **Key:** `R2_ACCOUNT_ID`
- **Value:** Your Cloudflare R2 Account ID
- Click **Create variable**

#### Variable 2:
- **Key:** `R2_ACCESS_KEY_ID`
- **Value:** Your Cloudflare R2 Access Key ID
- Click **Create variable**

#### Variable 3:
- **Key:** `R2_SECRET_ACCESS_KEY`
- **Value:** Your Cloudflare R2 Secret Access Key
- Click **Create variable**

#### Variable 4:
- **Key:** `R2_BUCKET_NAME`
- **Value:** Your R2 bucket name (e.g., `my-video-stream`)
- Click **Create variable**

### ⚠️ Double-Check:
Make sure all 4 variables are added before deploying!

---

## 🚀 Step 5: Deploy!

1. Once all environment variables are added, click **Deploy site**
2. Netlify will start building your site
3. You'll see a build log showing progress
4. Wait 2-3 minutes for the build to complete

### What's happening:
- ✅ Installing dependencies (`npm install`)
- ✅ Building your React app (`npm run build`)
- ✅ Setting up Netlify functions
- ✅ Deploying to CDN

---

## ✅ Step 6: Verify Deployment

### Check Build Status:

1. Watch the build log
2. Look for:
   - ✅ "Build script success"
   - ✅ "Functions directory is ready"
   - ✅ "Site is live"

### If Build Fails:

**Common Issues:**
- ❌ Missing environment variables → Add them and redeploy
- ❌ Build errors → Check the build log for specific errors
- ❌ Function errors → Check that AWS SDK packages are in package.json

**To Fix:**
- Go to **Site settings** > **Environment variables**
- Verify all variables are set
- Go to **Deploys** tab
- Click **Trigger deploy** > **Clear cache and deploy site**

---

## 🎉 Step 7: Test Your Live Site!

1. Once deployed, click on your site URL (e.g., `https://random-name-123.netlify.app`)
2. Your site should load!

### Test These Features:

1. **Homepage loads** ✅
2. **Dark mode toggle works** ✅
3. **Can switch to Upload tab** ✅
4. **Upload a test video** (small file first!)
5. **Video appears in Library** ✅
6. **Can play video** ✅

### If Upload Doesn't Work:

- Check browser console (F12) for errors
- Verify all environment variables are set correctly
- Check Netlify function logs (see Step 8)

---

## 📊 Step 8: Monitor Your Site

### View Function Logs:

1. In Netlify dashboard, go to **Functions** (left sidebar)
2. You'll see your 3 functions:
   - `get-upload-url`
   - `get-stream-url`
   - `list-videos`
3. Click on any function to see logs
4. Check for errors when testing uploads

### View Site Analytics:

1. Go to **Analytics** (if enabled)
2. See visitor stats, bandwidth usage, etc.

---

## 🔄 Step 9: Automatic Deploys

**Great news!** Every time you push to GitHub, Netlify will automatically deploy!

### How it works:
- Push code to `main` branch → Auto-deploy
- Pull requests → Deploy previews (optional)

### Test it:
1. Make a small change to your code
2. Commit and push to GitHub
3. Watch Netlify automatically build and deploy!

---

## 🎨 Step 10: Custom Domain (Optional)

Want a custom domain? (e.g., `videos.yourdomain.com`)

1. Go to **Domain settings** in Netlify
2. Click **Add custom domain**
3. Enter your domain
4. Follow DNS configuration instructions
5. Netlify automatically provisions SSL certificate

---

## 🐛 Troubleshooting

### Issue: "Server configuration error" when uploading

**Solution:**
1. Go to **Site settings** > **Environment variables**
2. Verify all 4 variables are set:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
3. Check that values are correct (no extra spaces)
4. Go to **Deploys** > **Trigger deploy** > **Clear cache and deploy site**

### Issue: Videos upload but won't play

**Solution:**
1. Check browser console (F12) for errors
2. Verify R2 bucket has the uploaded files
3. Check function logs in Netlify
4. Ensure video format is supported (MP4, WebM, etc.)

### Issue: Build fails

**Solution:**
1. Check build logs for specific error
2. Ensure `package.json` is committed
3. Verify Node.js version (Netlify uses Node 18 by default)
4. Check that all dependencies are in `package.json`

### Issue: Functions not working

**Solution:**
1. Check Functions tab for errors
2. Verify AWS SDK packages are in root `package.json`
3. Check function logs
4. Ensure environment variables are set

---

## 📝 Quick Reference

### Your Site URLs:
- **Production URL:** `https://your-site-name.netlify.app`
- **Admin URL:** `https://app.netlify.com/sites/your-site-name`

### Important Netlify Pages:
- **Site dashboard:** Main overview
- **Deploys:** View deployment history
- **Functions:** View serverless function logs
- **Domain settings:** Custom domain configuration
- **Site settings:** Environment variables, build settings

### Environment Variables Location:
- **Netlify Dashboard** > **Your Site** > **Site settings** > **Environment variables**

---

## ✅ Success Checklist

After deployment, verify:
- [ ] Site loads at Netlify URL
- [ ] Can upload videos
- [ ] Videos appear in library
- [ ] Can play videos
- [ ] Player controls work
- [ ] Search works
- [ ] Dark mode works
- [ ] Functions are visible in Functions tab
- [ ] No errors in browser console
- [ ] No errors in function logs

---

## 🎊 You're Live!

Congratulations! Your video streaming app is now deployed and accessible worldwide!

### What's Next?
- Share your app with friends
- Upload your video collection
- Customize the branding
- Add more features
- Set up a custom domain

### Need Help?
- Check function logs for errors
- Review browser console
- See troubleshooting section above
- Check Netlify documentation: https://docs.netlify.com

---

**🎬 Happy Streaming!**

