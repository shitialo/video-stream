# 🎥 Video Stream App

A modern, full-featured video streaming application with cloud storage powered by Cloudflare R2 and hosted on Netlify.

## ✨ Features

### Upload Features
- 📤 Drag & drop upload interface
- 📁 Click to browse files
- 📊 Real-time upload progress
- ✅ File validation (type & size)
- 👁️ Video preview before upload

### Video Player Features
- ▶️ Play/Pause controls
- 🔊 Volume control with mute
- ⚡ Multiple playback speeds (0.5x - 2x)
- 🖥️ Fullscreen mode
- 📺 Picture-in-Picture support
- ⌨️ Keyboard shortcuts
- 📍 Seek controls
- ⏱️ Time display

### Library Features
- 📚 Video grid/library view
- 🔍 Search functionality
- 🔄 Refresh videos
- 📱 Responsive design
- 🌙 Dark mode support

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- A Cloudflare account with R2 enabled
- A Netlify account

### 1. Clone and Install

```bash
npm install
```

### 2. Cloudflare R2 Setup

1. **Create a Cloudflare Account** (if you don't have one)
   - Go to https://dash.cloudflare.com/sign-up
   - Sign up for a free account

2. **Enable R2**
   - In your Cloudflare dashboard, go to R2
   - Click "Purchase R2" (free tier available)

3. **Create an R2 Bucket**
   - Click "Create bucket"
   - Name your bucket (e.g., "my-video-stream")
   - Click "Create bucket"

4. **Get Your Account ID**
   - In the R2 dashboard, you'll see your Account ID
   - Copy it for later use

5. **Create API Tokens**
   - Click "Manage R2 API Tokens"
   - Click "Create API Token"
   - Give it a name (e.g., "Video Stream App")
   - Select permissions: "Object Read & Write"
   - Click "Create API Token"
   - Copy both the **Access Key ID** and **Secret Access Key**
   - ⚠️ Save these securely - the secret key is shown only once!

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=my-video-stream
```

### 4. Run Locally

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Run the development server with Netlify functions
netlify dev
```

Open http://localhost:8888 in your browser.

### 5. Deploy to Netlify

#### Option A: Deploy via Netlify CLI

```bash
# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name (optional)
# - Build command: npm run build
# - Publish directory: dist
```

#### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to https://app.netlify.com
3. Click "Add new site" > "Import an existing project"
4. Choose GitHub and select your repository
5. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

#### Set Environment Variables in Netlify

1. Go to your site dashboard on Netlify
2. Go to "Site settings" > "Environment variables"
3. Add these variables:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`

4. Redeploy your site

## 🎮 Usage

### Uploading Videos

1. Click the **Upload** tab
2. Either:
   - Drag and drop a video file
   - Click "Browse Files" to select a video
3. Preview your video
4. Click "Upload to Cloud"
5. Wait for the upload to complete
6. You'll be automatically redirected to the Library

### Watching Videos

1. Click the **Library** tab
2. Click on any video card or "Play Video" button
3. Use the player controls or keyboard shortcuts:
   - `Space` or `K` - Play/Pause
   - `F` - Fullscreen
   - `M` - Mute
   - `←` / `→` - Seek ±5 seconds
   - `↑` / `↓` - Volume control
   - `Esc` - Close player

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** TailwindCSS
- **Video Player:** Video.js
- **Backend:** Netlify Functions (Serverless)
- **Storage:** Cloudflare R2
- **Hosting:** Netlify

## 📁 Project Structure

```
video-stream-app/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── UploadSection.jsx
│   │   ├── VideoLibrary.jsx
│   │   └── VideoPlayer.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── netlify/
│   └── functions/
│       ├── get-upload-url.js
│       ├── get-stream-url.js
│       ├── list-videos.js
│       └── package.json
├── public/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── netlify.toml
```

## 🔒 Security Notes

- API tokens are never exposed to the client
- All R2 operations use presigned URLs
- Upload and stream URLs expire after 1 hour
- Environment variables are stored securely in Netlify

## 💰 Cost Considerations

### Cloudflare R2
- **Free tier:** 10 GB storage per month
- **After free tier:** $0.015/GB per month
- **No egress fees** - Watch videos without extra charges!

### Netlify
- **Free tier:** 
  - 100 GB bandwidth per month
  - 300 build minutes per month
  - 125,000 serverless function requests

## 🐛 Troubleshooting

### Videos won't upload
- Check your R2 credentials in environment variables
- Ensure your R2 bucket exists
- Check browser console for errors
- Verify file size is under 500MB

### Videos won't play
- Check browser console for errors
- Ensure the video format is supported (MP4, WebM, OGG)
- Verify R2 credentials are correct
- Try refreshing the video library

### Functions failing
- Check Netlify function logs
- Verify all environment variables are set
- Ensure AWS SDK packages are installed

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes!

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

## 📧 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Made with ❤️ using React, Vite, Cloudflare R2, and Netlify

