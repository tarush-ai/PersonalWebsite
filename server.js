const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;

// OG tag configurations for different routes
const ogConfigs = {
  '/aureliusgpt': {
    title: 'AureliusGPT — Small Language Models from First Principles',
    description: 'A family of SLMs pretrained from scratch on classical philosophy texts, built without shortcuts.',
    image: 'https://www.tarush.ai/aurelius-thinking.jpg',
    url: 'https://www.tarush.ai/aureliusgpt'
  },
  '/podcast': {
    title: 'Neural Bridge Podcast — Bridging Generations Through AI',
    description: 'Connecting younger generations to current professionals through fascinating discussions on AI.',
    image: 'https://www.tarush.ai/logo.jpg',
    url: 'https://www.tarush.ai/podcast'
  },
  '/vericare': {
    title: 'VeriCare AI — Patient Advocacy, Augmented with AI',
    description: 'The first fully AI patient advocacy engine, built to dispute, negotiate, and reduce medical bills.',
    image: 'https://www.tarush.ai/favicon.png',
    url: 'https://www.tarush.ai/vericare'
  }
};

// Default OG config for homepage
const defaultOgConfig = {
  title: 'Tarush Gupta — Builder, Founder, Developer',
  description: 'Personal citadel showcasing my work in AI, startups, and research.',
  image: 'https://www.tarush.ai/favicon.png',
  url: 'https://www.tarush.ai/'
};

// Function to inject OG tags into HTML
function injectOgTags(html, pathname) {
  const config = ogConfigs[pathname] || defaultOgConfig;
  
  // Replace OG tag values
  let modifiedHtml = html
    .replace(
      'content="Tarush Gupta — Builder, Founder, Developer" id="og-title"',
      `content="${config.title}" id="og-title"`
    )
    .replace(
      'content="Personal citadel showcasing my work in AI, startups, and research." id="og-description"',
      `content="${config.description}" id="og-description"`
    )
    .replace(
      'content="https://www.tarush.ai/favicon.png" id="og-image"',
      `content="${config.image}" id="og-image"`
    )
    .replace(
      'content="https://www.tarush.ai/" id="og-url"',
      `content="${config.url}" id="og-url"`
    )
    .replace(
      '<title>Tarush\'s Citadel</title>',
      `<title>${config.title}</title>`
    );
  
  return modifiedHtml;
}

// Serve static files
app.use(express.static('.', {
  setHeaders: (res, filepath) => {
    // Don't cache HTML files
    if (filepath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// API proxy for HuggingFace Aurelius model
app.post('/api/aurelius', async (req, res) => {
  try {
    const apiUrl = process.env.HF_API_URL;
    const apiToken = process.env.HF_API_TOKEN;
    
    if (!apiUrl || !apiToken) {
      return res.status(500).json({ 
        error: 'Server misconfigured: Missing HF_API_URL or HF_API_TOKEN' 
      });
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `Upstream API Error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error in aurelius_chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// API for Stoic justification (if OpenAI key is available)
app.post('/api/justify', async (req, res) => {
  try {
    const { user_prompt, model_response } = req.body;
    
    if (!user_prompt || !model_response) {
      return res.status(400).json({ error: 'Missing user_prompt or model_response' });
    }
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const prompt = "Your responsibility is to justify the output of a toy (845k param) model fitted on Meditations by Marcus Aurelius. Please read the user's prompt, the model's response, and give the model a score out of 100 of prediction given it's status as a toy model. Generate a short report of its accuracy, identifying potential semantic, linguistic, and Stoic-meaning based connections in the generation.";
    
    const text = `User prompt: ${user_prompt}\n\nModel response: ${model_response}`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text }
        ]
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `OpenAI API Error: ${response.status}`,
        details: errorText
      });
    }
    
    const data = await response.json();
    const justification = data.choices[0].message.content;
    
    res.json({ justification });
  } catch (error) {
    console.error('Error in justify_response:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', backend: 'node' });
});

// Catch-all route for SPA with dynamic OG tags
app.get('*', (req, res) => {
  const requestedPath = req.path;
  
  // Check if requesting a static file
  const filePath = path.join(__dirname, requestedPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  
  // For SPA routes, serve index.html with injected OG tags
  const indexPath = path.join(__dirname, 'index.html');
  fs.readFile(indexPath, 'utf8', (err, html) => {
    if (err) {
      return res.status(500).send('Error loading page');
    }
    
    // Inject OG tags based on the requested path
    const modifiedHtml = injectOgTags(html, requestedPath);
    res.send(modifiedHtml);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT}`);
});

