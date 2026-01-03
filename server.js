const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from root

// API endpoint for AureliusGPT
app.post('/api/aurelius', async (req, res) => {
    try {
        const { inputs, parameters } = req.body;

        // Validate input
        if (!inputs || typeof inputs !== 'string') {
            return res.status(400).json({ error: 'Invalid input message' });
        }

        // Check if token exists
        const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;
        if (!HF_TOKEN) {
            console.error('HUGGINGFACE_TOKEN not set in environment variables');
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // Call HuggingFace API (new router endpoint)
        const response = await fetch('https://router.huggingface.co/models/Tarush-AI/AureliusGPT', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs,
                parameters: parameters || {
                    max_new_tokens: 250,
                    temperature: 0.8,
                    top_p: 0.9,
                    do_sample: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('HuggingFace API error:', response.status, errorText);
            return res.status(response.status).json({ 
                error: `HuggingFace API error: ${response.status}`,
                details: errorText
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'AureliusGPT backend is running',
        hasToken: !!process.env.HUGGINGFACE_TOKEN
    });
});

// Serve index.html for all routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🏛️  AureliusGPT backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔑 HuggingFace token: ${process.env.HUGGINGFACE_TOKEN ? '✓ Set' : '✗ Missing'}`);
});

