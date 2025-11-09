# 🚀 Complete Deployment Guide

## Step-by-Step Instructions to Get Your Video Streaming App Live

### Part 1: Cloudflare R2 Setup (5-10 minutes)

#### 1.1 Create Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Enter your email and create a password
3. Verify your email address
4. Complete the onboarding

#### 1.2 Enable R2 Storage

1. In your Cloudflare dashboard, click **R2** in the left sidebar
2. Click **Purchase R2** 
   - Don't worry - there's a generous free tier!
   - Free tier: 10 GB storage per month
3. Accept the terms and enable R2

#### 1.3 Create Your R2 Bucket

1. Click **Create bucket**
2. Enter a bucket name (e.g., `my-video-stream`)
   - Use lowercase letters, numbers, and hyphens only
3. Choose a location hint (optional - choose closest to your users)
4. Click **Create bucket**
5. **Save your bucket name** - you'll need it later!

#### 1.4 Get Your Account ID

1. While in the R2 section, look at the right sidebar
2. You'll see **Account ID**
3. Click to copy it
4. **Save this** - you'll need it for environment variables

#### 1.5 Create API Tokens

1. Click **Manage R2 API Tokens** (in the R2 dashboard)
2. Click **Create API Token**
3. Configuration:
   - **Token name:** `video-stream-app` (or any name you like)
   - **Permissions:** Select "Object Read & Write"
   - **TTL:** Leave as default (or set to never expire)
   - **Specific bucket:** (Optional) Select your bucket for extra security
4. Click **Create API Token**
5. You'll see two important values:
   - **Access Key ID** (looks like: `abc123def456...`)
   - **Secret Access Key** (looks like: `xyz789uvw456...`)
6. ⚠️ **CRITICAL:** Copy both values immediately!
   - The Secret Access Key is only shown once
   - Save them in a secure location (password manager recommended)

✅ **Cloudflare R2 Setup Complete!** You should now have:
- ✓ R2 bucket name
- ✓ Account ID
- ✓ Access Key ID
- ✓ Secret Access Key

---

### Part 2: Local Development Setup (5 minutes)

#### 2.1 Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli
```

#### 2.2 Configure Environment Variables

1. Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

2. Edit `.env` with your Cloudflare credentials:

```env
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=my-video-stream
```

#### 2.3 Test Locally

```bash
# Start development server with Netlify functions
netlify dev
```

The app will open at http://localhost:8888

**Test it:**
1. Try uploading a small video file
2. Check if it appears in your library
3. Try playing the video

If everything works, proceed to deployment!

---

### Part 3: Deploy to Netlify (10 minutes)

#### Option A: Deploy via GitHub (Recommended)

##### 3.1 Push to GitHub

1. Create a new repository on GitHub
2. Initialize git and push your code:

```bash
git init
git add .
git commit -m "Initial commit: Video streaming app"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

##### 3.2 Connect to Netlify

1. Go to https://app.netlify.com
2. Click **Add new site** > **Import an existing project**
3. Click **GitHub** and authorize Netlify
4. Select your repository
5. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
6. Click **Show advanced** > **New variable**
7. Add your environment variables:
   - Variable: `R2_ACCOUNT_ID`, Value: `your_account_id`
   - Variable: `R2_ACCESS_KEY_ID`, Value: `your_access_key_id`
   - Variable: `R2_SECRET_ACCESS_KEY`, Value: `your_secret_access_key`
   - Variable: `R2_BUCKET_NAME`, Value: `your_bucket_name`
8. Click **Deploy site**

##### 3.3 Wait for Build

- Netlify will build and deploy your app
- This usually takes 2-3 minutes
- Watch the deploy logs for any errors

##### 3.4 Test Your Live Site

1. Once deployed, click on your site URL (e.g., `https://random-name-123.netlify.app`)
2. Upload a test video
3. Verify it plays correctly

✅ **Deployment Complete!**

---

#### Option B: Deploy via Netlify CLI

##### 3.1 Login to Netlify

```bash
netlify login
```

This will open your browser to authorize the CLI.

##### 3.2 Initialize Site

```bash
netlify init
```

Follow the prompts:
- **Create & configure a new site**
- Choose your team
- Site name (optional, or let Netlify generate one)
- Build command: `npm run build`
- Publish directory: `dist`

##### 3.3 Add Environment Variables

```bash
netlify env:set R2_ACCOUNT_ID "your_account_id"
netlify env:set R2_ACCESS_KEY_ID "your_access_key_id"
netlify env:set R2_SECRET_ACCESS_KEY "your_secret_access_key"
netlify env:set R2_BUCKET_NAME "your_bucket_name"
```

##### 3.4 Deploy

```bash
# Deploy to production
netlify deploy --prod
```

##### 3.5 Open Your Site

```bash
netlify open:site
```

✅ **Deployment Complete!**

---

### Part 4: Custom Domain (Optional)

#### 4.1 Add Custom Domain in Netlify

1. In your Netlify site dashboard, go to **Domain settings**
2. Click **Add custom domain**
3. Enter your domain (e.g., `videos.yourdomain.com`)
4. Follow instructions to configure DNS

#### 4.2 Enable HTTPS

- Netlify automatically provisions SSL certificates
- HTTPS is enabled by default
- Wait a few minutes for the certificate to be issued

---

### Part 5: Verification Checklist

After deployment, verify everything works:

- [ ] Site loads at your Netlify URL
- [ ] Dark mode toggle works
- [ ] Can switch between Upload and Library tabs
- [ ] Can upload a video file (try a small one first)
- [ ] Upload shows progress bar
- [ ] Video appears in library after upload
- [ ] Can click on video to play it
- [ ] Video player controls work
- [ ] Keyboard shortcuts work
- [ ] Search functionality works
- [ ] Mobile responsiveness looks good

---

### Troubleshooting

#### Problem: "Server configuration error" when uploading

**Solution:**
1. Check that all environment variables are set in Netlify
2. Go to Site settings > Environment variables
3. Verify all 4 variables are present and correct
4. Redeploy the site

#### Problem: Videos upload but won't play

**Solution:**
1. Check browser console for errors
2. Verify the video format is supported (MP4, WebM, OGG)
3. Check R2 bucket permissions
4. Try generating a new API token with full permissions

#### Problem: Function timeout errors

**Solution:**
1. Large video files may timeout
2. Consider implementing chunked uploads for files > 100MB
3. Check Netlify function logs for specific errors

#### Problem: Build fails on Netlify

**Solution:**
1. Check the build logs for specific errors
2. Ensure `package.json` and `package-lock.json` are committed
3. Verify Node.js version compatibility
4. Try clearing cache and redeploying

---

### Monitoring & Maintenance

#### View Netlify Function Logs

1. Go to your site dashboard
2. Click **Functions**
3. Click on any function to see logs
4. Check for errors or warnings

#### View R2 Usage

1. Go to Cloudflare dashboard
2. Click **R2**
3. View storage usage and requests
4. Monitor costs (if exceeding free tier)

#### Update Environment Variables

If you need to rotate credentials:

```bash
netlify env:set VARIABLE_NAME "new_value"
netlify deploy --prod
```

---

### Next Steps

🎉 **Congratulations!** Your video streaming app is now live!

**What's next?**
- Share your app with friends and family
- Upload your video collection
- Customize the branding and colors
- Add features like video descriptions, categories, or playlists
- Set up analytics to track usage

**Cost Management:**
- Monitor your R2 storage usage
- Monitor Netlify bandwidth
- Both have generous free tiers
- Set up billing alerts in Cloudflare

**Security:**
- Keep your API credentials secure
- Never commit `.env` files to Git
- Rotate API tokens periodically
- Consider adding authentication for production use

---

### Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review Netlify function logs
3. Check browser console for errors
4. Open an issue on GitHub

Happy streaming! 🎬🍿

