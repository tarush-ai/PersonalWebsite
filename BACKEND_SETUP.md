# Backend Setup Guide

Your AureliusGPT now has a secure backend! The HuggingFace token is kept server-side and never exposed to the browser.

## 🏗️ Architecture

```
Frontend (Browser)
    ↓ sends user message
Backend API (/api/aurelius)
    ↓ adds HuggingFace token
HuggingFace API
    ↓ returns AI response
Backend → Frontend → User
```

**Your token is now 100% secure!** ✅

## 📁 New Files

- `server.js` - Node.js/Express backend
- `package.json` - Dependencies
- `.env.example` - Environment variable template

## 🚀 Local Development

### Step 1: Install Dependencies

```bash
cd /Users/tarushgupta/Desktop/PersonalWebsite
npm install
```

### Step 2: Create `.env` File

```bash
cp .env.example .env
```

Then edit `.env` and add your token:
```
HUGGINGFACE_TOKEN=hf_your_actual_token_here
```

### Step 3: Run the Server

```bash
npm start
```

Visit: `http://localhost:3000`

## 🌐 Deploying to Render

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add secure backend for AureliusGPT"
git push origin main
```

### Step 2: Update Render Settings

Since you already have a static site on Render, you need to **change it to a Web Service**:

**Option A: Delete and Recreate (Recommended)**
1. Go to your Render dashboard
2. Delete the existing static site
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure as below

**Option B: Contact Render Support**
Ask them to convert your static site to a web service.

### Step 3: Configure Web Service

**Build & Deploy Settings:**
- **Name**: `tarush-ai`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

**Environment Variables:**
Click "Environment" and add:
- **Key**: `HUGGINGFACE_TOKEN`
- **Value**: Your HuggingFace API token (from https://huggingface.co/settings/tokens)

### Step 4: Deploy!

Click "Create Web Service" and Render will:
1. Install dependencies
2. Start your backend server
3. Serve your frontend
4. Keep your token secure!

## 🔍 Testing Your Backend

### Health Check

Visit: `https://tarush-ai.onrender.com/api/health`

You should see:
```json
{
  "status": "ok",
  "message": "AureliusGPT backend is running",
  "hasToken": true
}
```

If `hasToken` is `false`, your environment variable isn't set correctly.

### Test the Chat

1. Go to your website
2. Navigate to AureliusGPT
3. Send a message
4. The backend handles everything securely!

## 🔐 Security Benefits

**Before (Static Site):**
- ❌ Token visible in browser source code
- ❌ Anyone can extract and abuse your token
- ❌ Can't control or monitor requests

**After (Backend):**
- ✅ Token stored server-side only
- ✅ Never visible in browser
- ✅ Can add rate limiting if needed
- ✅ Can log/monitor usage
- ✅ Can add authentication later

## 📊 Monitoring

### Check Logs on Render
1. Go to your web service on Render
2. Click "Logs" tab
3. See real-time requests and any errors

### Monitor HuggingFace Usage
1. Go to https://huggingface.co/settings/tokens
2. Check your API usage
3. Set up alerts if desired

## 🛠️ Customization

### Add Rate Limiting

Edit `server.js` and add:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

Then install: `npm install express-rate-limit`

### Add Request Logging

The backend already logs to console. View logs in Render dashboard.

### Change Model Parameters

Edit `server.js` around line 32 to adjust:
- `max_new_tokens` - Response length
- `temperature` - Creativity (0-1)
- `top_p` - Diversity

## 🆘 Troubleshooting

### "Server configuration error"
- Environment variable not set
- Go to Render → Environment → Add `HUGGINGFACE_TOKEN`

### "Model is loading"
- HuggingFace models can take 20-30 seconds to load on first request
- Wait and try again

### "Cannot read property of undefined"
- Check Render logs for detailed error
- Ensure all npm dependencies installed

### Local dev not working
- Did you run `npm install`?
- Did you create `.env` with your token?
- Check console for errors

## 📝 Environment Variables Needed

On Render, set these:

| Variable | Value |
|----------|-------|
| `HUGGINGFACE_TOKEN` | Your HuggingFace API token |
| `PORT` | (Optional, Render sets automatically) |

## ✅ Final Checklist

Before going live:
- [ ] Pushed all code to GitHub
- [ ] Created Web Service on Render (not static site)
- [ ] Set `HUGGINGFACE_TOKEN` environment variable
- [ ] Deployed successfully
- [ ] Tested health check endpoint
- [ ] Tested chat functionality
- [ ] Verified token not visible in browser source

---

**Your AureliusGPT is now production-ready with enterprise-grade security!** 🏛️🔒

The token is safe, the interface is beautiful, and Marcus Aurelius awaits your questions.

