#!/usr/bin/env python3
import os
import json
from datetime import date
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder=None)
CORS(app)

# ---------------------------------------------------------------------------
# Privacy-friendly pageviews
# One count per browser session (the frontend guards with sessionStorage) —
# no cookies, no IPs, no third-party scripts, no PII. Just a total + today.
# Postgres when DATABASE_URL is set (persists on Render); a JSON file otherwise.
# ---------------------------------------------------------------------------
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL and DATABASE_URL.startswith('postgres://'):
    # psycopg wants postgresql://
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
USE_DATABASE = DATABASE_URL is not None

if USE_DATABASE:
    import psycopg

    def get_db_connection():
        return psycopg.connect(DATABASE_URL)

    def init_db():
        try:
            with get_db_connection() as conn, conn.cursor() as cur:
                cur.execute('''CREATE TABLE IF NOT EXISTS visitor_count (
                    id INTEGER PRIMARY KEY DEFAULT 1,
                    count INTEGER NOT NULL DEFAULT 0,
                    CONSTRAINT single_row CHECK (id = 1))''')
                cur.execute('INSERT INTO visitor_count (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING')
                cur.execute('''CREATE TABLE IF NOT EXISTS pageview_daily (
                    day DATE PRIMARY KEY,
                    count INTEGER NOT NULL DEFAULT 0)''')
                conn.commit()
        except Exception as e:
            print(f"DB init error: {e}")

    init_db()

    def record_pageview():
        try:
            with get_db_connection() as conn, conn.cursor() as cur:
                cur.execute('UPDATE visitor_count SET count = count + 1 WHERE id = 1 RETURNING count')
                total = cur.fetchone()[0]
                cur.execute('''INSERT INTO pageview_daily (day, count) VALUES (CURRENT_DATE, 1)
                    ON CONFLICT (day) DO UPDATE SET count = pageview_daily.count + 1 RETURNING count''')
                today = cur.fetchone()[0]
                conn.commit()
                return {'total': total, 'today': today}
        except Exception as e:
            print(f"pageview error: {e}")
            return {'total': 0, 'today': 0}

    def get_stats():
        try:
            with get_db_connection() as conn, conn.cursor() as cur:
                cur.execute('SELECT count FROM visitor_count WHERE id = 1')
                r = cur.fetchone(); total = r[0] if r else 0
                cur.execute('SELECT count FROM pageview_daily WHERE day = CURRENT_DATE')
                r = cur.fetchone(); today = r[0] if r else 0
                return {'total': total, 'today': today}
        except Exception as e:
            print(f"stats error: {e}")
            return {'total': 0, 'today': 0}

else:
    VISITOR_FILE = Path('visitor_count.json')

    def _load():
        if VISITOR_FILE.exists():
            try:
                with open(VISITOR_FILE) as f:
                    d = json.load(f)
                if 'total' not in d:  # migrate legacy {"count": N}
                    d = {'total': d.get('count', 0), 'daily': {}}
                d.setdefault('daily', {})
                return d
            except Exception:
                pass
        return {'total': 0, 'daily': {}}

    def _save(d):
        with open(VISITOR_FILE, 'w') as f:
            json.dump(d, f)

    def record_pageview():
        d = _load()
        today = date.today().isoformat()
        d['total'] = d.get('total', 0) + 1
        d['daily'][today] = d['daily'].get(today, 0) + 1
        if len(d['daily']) > 60:  # keep ~2 months of daily buckets
            for k in sorted(d['daily'].keys())[:-60]:
                del d['daily'][k]
        _save(d)
        return {'total': d['total'], 'today': d['daily'][today]}

    def get_stats():
        d = _load()
        today = date.today().isoformat()
        return {'total': d.get('total', 0), 'today': d.get('daily', {}).get(today, 0)}


@app.route('/api/aurelius', methods=['POST'])
def aurelius_chat():
    try:
        data = request.json
        api_url = os.environ.get("HF_API_URL")
        api_token = os.environ.get("HF_API_TOKEN")

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
    """POST records a pageview (once per session); GET returns {total, today}."""
    try:
        stats = record_pageview() if request.method == 'POST' else get_stats()
        return jsonify({'count': stats['total'], **stats})  # 'count' kept for compat
    except Exception as e:
        print(f"Error in visitor_counter: {e}")
        return jsonify({'error': str(e), 'count': 0, 'total': 0, 'today': 0}), 500


# ---------------------------------------------------------------------------
# Static site. Pages are plain HTML files served at clean URLs (/research ->
# research.html). Only public files are served: pages, assets/ and papers/,
# never server code, .env or local data.
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent / 'site'
PUBLIC_DIRS = ('assets/', 'papers/')
PROJECT_DIRS = {'fittingcorpus'}
PROJECT_EXTENSIONS = {'.html', '.css', '.js', '.json', '.png', '.jpg', '.jpeg',
                      '.webp', '.gif', '.svg', '.ico', '.pdf', '.woff', '.woff2',
                      '.ttf', '.mp4', '.webm', '.txt', '.bib'}

# Old single-page-app routes, kept so existing links still land somewhere.
LEGACY_REDIRECTS = {
    'research': '/interests#research-interests',
    'research.html': '/interests#research-interests',
    'blog': '/writing',
    'blog/aureliusgpt': '/writing/aureliusgpt',
    'vericare': '/experience#vericare',
    'podcast': '/talks#neural-bridge',
    'internships': '/experience#internships',
    'github': 'https://github.com/tarush-ai',
    'ideas': '/',
    'aurelius': '/aureliusgpt',
}


def _page_for(path):
    """Map a URL path to an HTML page under ROOT, or None."""
    path = path.strip('/')
    if not path:
        return 'index.html'
    if path.endswith('.html'):
        path = path[:-5]
    candidate = (ROOT / f'{path}.html').resolve()
    if candidate.is_relative_to(ROOT) and candidate.is_file():
        return str(candidate.relative_to(ROOT))
    return None


@app.route('/')
def serve_index():
    return send_from_directory(ROOT, 'index.html')


@app.route('/<path:path>')
def serve_static(path):
    # Both URL roots serve the same untouched paper folder and relative assets.
    if path == 'research/fittingcorpus' or path.startswith('research/fittingcorpus/'):
        path = path.removeprefix('research/')
    folder, _, rest = path.partition('/')
    if folder in PROJECT_DIRS:
        project_root = ROOT / folder
        candidate = (project_root / rest).resolve()
        if not candidate.is_relative_to(project_root.resolve()):
            return send_from_directory(ROOT, '404.html'), 404
        if candidate.is_dir():
            if not path.endswith('/'):
                destination = request.path + '/'
                if request.query_string:
                    destination += '?' + request.query_string.decode('latin-1')
                return redirect(destination, code=308)
            rest = f'{rest.rstrip('/')}/index.html'.lstrip('/')
        if Path(rest).suffix.lower() not in PROJECT_EXTENSIONS or any(
                part.startswith('.') for part in Path(rest).parts):
            return send_from_directory(ROOT, '404.html'), 404
        return send_from_directory(project_root, rest)

    if f'{folder}/' in PUBLIC_DIRS:
        # Serve relative to the public folder itself so '..' can't climb out of it.
        return send_from_directory(ROOT / folder, rest)

    target = LEGACY_REDIRECTS.get(path.strip('/'))
    if target:
        return redirect(target, code=301)

    page = _page_for(path)
    if page:
        return send_from_directory(ROOT, page)

    return send_from_directory(ROOT, '404.html'), 404


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
