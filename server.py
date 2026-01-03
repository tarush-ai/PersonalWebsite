#!/usr/bin/env python3
import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

@app.route('/api/aurelius', methods=['POST'])
def aurelius_chat():
    try:
        data = request.json
        api_url = os.environ.get("HF_API_URL")
        api_token = os.environ.get("HF_API_TOKEN")

        print(f"DEBUG: Received request for Aurelius. URL: {api_url}") # Debug log
        print(f"DEBUG: Input data: {data}") # Debug log

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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'backend': 'python'})

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    try:
        return send_from_directory('.', path)
    except:
        return send_from_directory('.', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
