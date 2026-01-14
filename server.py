#!/usr/bin/env python3
import os
import requests
import json
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

# Visitor counter file
VISITOR_COUNT_FILE = Path('visitor_count.json')

def get_visitor_count():
    """Get current visitor count from file"""
    if VISITOR_COUNT_FILE.exists():
        try:
            with open(VISITOR_COUNT_FILE, 'r') as f:
                data = json.load(f)
                return data.get('count', 0)
        except:
            return 0
    return 0

def increment_visitor_count():
    """Increment and save visitor count"""
    count = get_visitor_count()
    count += 1
    
    with open(VISITOR_COUNT_FILE, 'w') as f:
        json.dump({'count': count}, f)
    
    return count

@app.route('/api/aurelius', methods=['POST'])
def aurelius_chat():
    try:
        data = request.json
        api_url = os.environ.get("HF_API_URL")
        api_token = os.environ.get("HF_API_TOKEN")

        print(f"DEBUG: Received request for Aurelius. URL: {api_url}") # Debug log
        # print(f"DEBUG: Input data: {data}") # Debug log

        if not api_url or not api_token:
            return jsonify({'error': 'Server misconfigured: Missing HF_API_URL or HF_API_TOKEN'}), 500

        headers = {
            "Authorization": f"Bearer {api_token}",
            "Content-Type": "application/json"
        }

        response = requests.post(api_url, headers=headers, json=data)
        
        if response.status_code != 200:
            return jsonify({
                'error': f"Upstream API Error: {response.status_code}", 
                'details': response.text
            }), response.status_code

        return jsonify(response.json())

    except Exception as e:
        print(f"Error in aurelius_chat: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/justify', methods=['POST'])
def justify_response():
    try:
        data = request.json
        user_prompt = data.get('user_prompt', '')
        model_response = data.get('model_response', '')
        
        if not user_prompt or not model_response:
            return jsonify({'error': 'Missing user_prompt or model_response'}), 400
        
        # Initialize OpenAI client
        client = OpenAI()
        
        prompt = "Your responsibility is to justify the output of a toy (845k param) model fitted on Meditations by Marcus Aurelius. Please read the user's prompt, the model's response, and give the model a score out of 100 of prediction given it's status as a toy model. Generate a short report of its accuracy, identifying potential semantic, linguistic, and Stoic-meaning based connections in the generation."
        
        text = f"User prompt: {user_prompt}\n\nModel response: {model_response}"
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": text}
            ]
        )
        
        justification = response.choices[0].message.content
        
        return jsonify({'justification': justification})
        
    except Exception as e:
        print(f"Error in justify_response: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'backend': 'python'})

@app.route('/api/visitors', methods=['POST', 'GET'])
def visitor_counter():
    """Track and return visitor count"""
    try:
        if request.method == 'POST':
            # Increment count for new visitor
            count = increment_visitor_count()
        else:
            # Just return current count
            count = get_visitor_count()
        
        return jsonify({'count': count})
    except Exception as e:
        print(f"Error in visitor_counter: {e}")
        return jsonify({'error': str(e), 'count': 0}), 500

def get_og_tags(path):
    """Generate OG tags based on the requested path"""
    base_url = "https://www.tarush.ai"
    
    og_configs = {
        '/aureliusgpt': {
            'title': 'AureliusGPT — Small Language Models from First Principles',
            'description': 'A family of SLMs pretrained from scratch on classical philosophy texts, built without shortcuts.',
            'image': f'{base_url}/aurelius-thinking.jpg',
            'url': f'{base_url}/aureliusgpt'
        },
        '/podcast': {
            'title': 'Neural Bridge Podcast — Bridging Generations Through AI',
            'description': 'Connecting younger generations to current professionals through fascinating discussions on AI.',
            'image': f'{base_url}/logo.jpg',
            'url': f'{base_url}/podcast'
        },
        '/vericare': {
            'title': 'VeriCare AI — Patient Advocacy, Augmented with AI',
            'description': 'The first fully AI patient advocacy engine, built to dispute, negotiate, and reduce medical bills.',
            'image': f'{base_url}/favicon.png',
            'url': f'{base_url}/vericare'
        }
    }
    
    # Default to homepage
    config = og_configs.get(path, {
        'title': 'Tarush Gupta — Builder, Founder, Developer',
        'description': 'Personal citadel showcasing my work in AI, startups, and research.',
        'image': f'{base_url}/favicon.png',
        'url': base_url
    })
    
    return config

def inject_og_tags(html_content, path):
    """Inject OG tags into HTML based on the path"""
    config = get_og_tags(path)
    
    # Replace the OG tag values
    html_content = html_content.replace(
        'content="Tarush Gupta — Builder, Founder, Developer" id="og-title"',
        f'content="{config["title"]}" id="og-title"'
    )
    html_content = html_content.replace(
        'content="Personal citadel showcasing my work in AI, startups, and research." id="og-description"',
        f'content="{config["description"]}" id="og-description"'
    )
    html_content = html_content.replace(
        'content="https://www.tarush.ai/favicon.png" id="og-image"',
        f'content="{config["image"]}" id="og-image"'
    )
    html_content = html_content.replace(
        'content="https://www.tarush.ai/" id="og-url"',
        f'content="{config["url"]}" id="og-url"'
    )
    
    # Also update the document title
    html_content = html_content.replace(
        '<title>Tarush\'s Citadel</title>',
        f'<title>{config["title"]}</title>'
    )
    
    return html_content

@app.route('/')
def serve_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    html_content = inject_og_tags(html_content, '/')
    return html_content

@app.route('/<path:path>')
def serve_static(path):
    # Check if file exists in the current directory
    if os.path.exists(path) and os.path.isfile(path):
        return send_from_directory('.', path)
    
    # For SPA routes, serve index.html with appropriate OG tags
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Normalize path for OG tag lookup
    normalized_path = '/' + path.strip('/')
    html_content = inject_og_tags(html_content, normalized_path)
    
    return html_content

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
