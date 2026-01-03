#!/usr/bin/env python3
"""
AureliusGPT Backend Server
Secure Python backend using official HuggingFace Hub library
"""

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

# Initialize HuggingFace client
HF_TOKEN = os.environ.get('HUGGINGFACE_TOKEN')
if not HF_TOKEN:
    print("⚠️  WARNING: HUGGINGFACE_TOKEN not set in environment variables")

# Initialize InferenceClient
client = InferenceClient(token=HF_TOKEN) if HF_TOKEN else None

@app.route('/api/aurelius', methods=['POST'])
def aurelius_chat():
    """Chat endpoint for AureliusGPT"""
    try:
        if not client:
            return jsonify({
                'error': 'Server configuration error',
                'message': 'HuggingFace token not configured'
            }), 500

        data = request.json
        user_input = data.get('inputs', '')
        parameters = data.get('parameters', {})

        if not user_input:
            return jsonify({'error': 'No input provided'}), 400

        # Set default parameters
        max_new_tokens = parameters.get('max_new_tokens', 250)
        temperature = parameters.get('temperature', 0.8)
        top_p = parameters.get('top_p', 0.9)

        print(f"📝 Generating response for: {user_input[:50]}...")

        # Call HuggingFace model
        try:
            response = client.text_generation(
                prompt=user_input,
                model="Tarush-AI/AureliusGPT",
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                return_full_text=False
            )

            print(f"✅ Generated response: {response[:50]}...")

            # Return in format expected by frontend
            return jsonify([{
                'generated_text': response
            }])

        except Exception as hf_error:
            error_msg = str(hf_error)
            print(f"❌ HuggingFace error: {error_msg}")
            
            # Check for specific errors
            if "404" in error_msg or "not found" in error_msg.lower():
                return jsonify({
                    'error': 'Model not found or not accessible',
                    'message': 'The AureliusGPT model may need to be made public or enabled for Inference API',
                    'details': error_msg
                }), 404
            elif "loading" in error_msg.lower():
                return jsonify({
                    'error': 'Model is loading',
                    'message': 'The model is currently loading. Please wait 20-30 seconds and try again.',
                    'details': error_msg
                }), 503
            else:
                return jsonify({
                    'error': 'HuggingFace API error',
                    'message': error_msg
                }), 500

    except Exception as e:
        print(f"❌ Server error: {str(e)}")
        return jsonify({
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'AureliusGPT Python backend is running',
        'hasToken': HF_TOKEN is not None,
        'backend': 'Python/Flask',
        'huggingface_hub': 'official library'
    })

@app.route('/')
def serve_index():
    """Serve index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files"""
    try:
        return send_from_directory('.', path)
    except:
        # For SPA routing, return index.html
        return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🏛️  AureliusGPT Python backend starting on port {port}")
    print(f"🔑 HuggingFace token: {'✓ Set' if HF_TOKEN else '✗ Missing'}")
    print(f"📊 Health check: http://localhost:{port}/api/health")
    
    app.run(host='0.0.0.0', port=port, debug=False)

