# Python Backend Setup (Recommended)

The Node.js backend wasn't working because HuggingFace changed their API. This Python backend uses the **official `huggingface_hub` library** which is more reliable.

## 🐍 Local Development

### Step 1: Install Python Dependencies

```bash
cd /Users/tarushgupta/Desktop/PersonalWebsite

# Create virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your token:
```
HUGGINGFACE_TOKEN=hf_your_actual_token_here
```

### Step 3: Run the Server

```bash
python server.py
```

Visit: `http://localhost:5000`

## 🚀 Deploy to Render

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Switch to Python backend for HuggingFace compatibility"
git push origin main
```

### Step 2: Configure Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. If you have an existing service, **delete it**
3. Click **"New +" → "Web Service"**
4. Connect your GitHub repository
5. Configure:

**Build & Deploy:**
- **Name**: `tarush-ai`
- **Environment**: `Python 3`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python server.py`
- **Instance Type**: Free

**Environment Variables:**
- **Key**: `HUGGINGFACE_TOKEN`
- **Value**: Your HuggingFace API token

### Step 3: Deploy!

Click "Create Web Service" and Render will deploy your Python backend.

## 🧪 Testing

### Local Test

```bash
# Health check
curl http://localhost:5000/api/health

# Test chat (replace with your actual token in .env first)
curl -X POST http://localhost:5000/api/aurelius \
  -H "Content-Type: application/json" \
  -d '{"inputs": "What is stoicism?", "parameters": {"max_new_tokens": 50}}'
```

### Production Test

```bash
# Health check
curl https://tarush-ai.onrender.com/api/health

# The chat interface should work automatically
```

## 🔧 Advantages Over Node.js

1. ✅ **Official HuggingFace support** - Uses `huggingface_hub` library
2. ✅ **Better error handling** - More detailed error messages
3. ✅ **More reliable** - HuggingFace is Python-first
4. ✅ **Easier to maintain** - Official library gets updates first
5. ✅ **Same security** - Token stays server-side

## 📝 Files Added

- `server.py` - Flask backend with HuggingFace integration
- `requirements.txt` - Python dependencies
- `runtime.txt` - Python version for Render
- Updated `.gitignore` - Python-specific ignores

## 🆘 Troubleshooting

### "Module not found"
```bash
pip install -r requirements.txt
```

### "Token not configured"
Make sure `.env` file exists with `HUGGINGFACE_TOKEN=...`

### "Model not found or not accessible"
Your model might need to be:
1. Made **public** on HuggingFace
2. **Enabled for Inference API** in model settings
3. Check at: https://huggingface.co/Tarush-AI/AureliusGPT/settings

### Model is loading (503 error)
Wait 20-30 seconds. HuggingFace models sleep when not in use and take time to wake up.

## 🎯 Next Steps

1. ✅ Install Python dependencies
2. ✅ Add your token to `.env`
3. ✅ Test locally with `python server.py`
4. ✅ Deploy to Render as a Web Service
5. ✅ Test the live chat interface

---

**Your AureliusGPT is now using the official, recommended HuggingFace integration!** 🏛️🐍

