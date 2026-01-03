#!/usr/bin/env python3
import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='.')
CORS(app)

@app.route('/api/aurelius', methods=['POST'])
def aurelius_chat():
    try:
        # data = request.json
        # user_input = data.get('inputs', '')
        
        # Static response as inference is being figured out
        response_text = "coming soon; figuring out inference"
        
        return jsonify([{'generated_text': response_text}])

    except Exception as e:
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
