#!/usr/bin/env python3
import os
import json
import time
from datetime import date
from pathlib import Path

import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__, static_folder='.')
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


def get_og_tags(path):
    """Generate OG tags based on the requested path"""
    base_url = "https://www.tarush.ai"

    og_configs = {
        '/aureliusgpt': {
            'title': 'AureliusGPT — Small Language Models from First Principles',
            'description': 'A family of SLMs pretrained from scratch on classical philosophy texts, built without shortcuts.',
            'image': f'{base_url}/assets/aurelius-thinking.jpg',
            'url': f'{base_url}/aureliusgpt'
        },
        '/podcast': {
            'title': 'Neural Bridge Podcast — Bridging Generations Through AI',
            'description': 'Connecting younger generations to current professionals through fascinating discussions on AI.',
            'image': f'{base_url}/assets/logo.jpg',
            'url': f'{base_url}/podcast'
        },
        '/vericare': {
            'title': 'VeriCare AI — Patient Advocacy, Augmented with AI',
            'description': 'The first fully AI patient advocacy engine, built to dispute, negotiate, and reduce medical bills.',
            'image': f'{base_url}/assets/logo-mark.png',
            'url': f'{base_url}/vericare'
        },
        '/research': {
            'title': 'Tarush Gupta — Research',
            'description': 'AI research across training & evaluation, memory systems, and small language models from first principles.',
            'image': f'{base_url}/assets/logo-mark.png',
            'url': f'{base_url}/research'
        },
        '/blog': {
            'title': 'Tarush Gupta — Blog',
            'description': 'Essays and technical writeups on patient advocacy and building language models from scratch.',
            'image': f'{base_url}/assets/logo-mark.png',
            'url': f'{base_url}/blog'
        }
    }

    config = og_configs.get(path, {
        'title': 'Tarush Gupta — Builder, Founder, Developer',
        'description': 'Personal citadel showcasing my work in AI, startups, and research.',
        'image': f'{base_url}/assets/logo-mark.png',
        'url': base_url
    })

    return config


def inject_og_tags(html_content, path):
    """Inject OG tags into HTML based on the path"""
    config = get_og_tags(path)

    html_content = html_content.replace(
        'content="Tarush Gupta — Builder, Founder, Developer" id="og-title"',
        f'content="{config["title"]}" id="og-title"'
    )
    html_content = html_content.replace(
        'content="Personal citadel showcasing my work in AI, startups, and research." id="og-description"',
        f'content="{config["description"]}" id="og-description"'
    )
    html_content = html_content.replace(
        'content="https://www.tarush.ai/assets/logo-mark.png" id="og-image"',
        f'content="{config["image"]}" id="og-image"'
    )
    html_content = html_content.replace(
        'content="https://www.tarush.ai/" id="og-url"',
        f'content="{config["url"]}" id="og-url"'
    )
    html_content = html_content.replace(
        '<title>Tarush\'s Citadel</title>',
        f'<title>{config["title"]}</title>'
    )

    return html_content


# ---------------------------------------------------------------------------
# GitHub integration — bespoke, live data for the /github page.
# With GITHUB_TOKEN set we use the GraphQL API (v4) to pull the profile, the
# contribution calendar (only exposed via GraphQL), and top repositories in one
# request. Without a token we fall back to the public REST API (profile + repos;
# no calendar). Results are cached in-process so a push shows up quickly without
# hammering the API or burning rate limit. Never logs or returns the token.
# ---------------------------------------------------------------------------
GITHUB_USERNAME = os.environ.get('GITHUB_USERNAME', 'tarush-ai')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
GH_CACHE_TTL = 600  # seconds — pushes reflect within ~10 min
_gh_cache = {'data': None, 'ts': 0.0}

_GH_GRAPHQL = """
query($login: String!) {
  user(login: $login) {
    name login avatarUrl bio url
    followers { totalCount }
    following { totalCount }
    repositories(privacy: PUBLIC) { totalCount }
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount weekday }
        }
      }
    }
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { name description url stargazerCount forkCount pushedAt primaryLanguage { name color } } }
    }
    topRepos: repositories(first: 6, isFork: false, ownerAffiliations: OWNER, orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes { name description url stargazerCount forkCount pushedAt primaryLanguage { name color } }
    }
  }
}
"""


def _gh_repo(node):
    lang = node.get('primaryLanguage') or {}
    return {
        'name': node.get('name'),
        'description': node.get('description'),
        'url': node.get('url'),
        'stars': node.get('stargazerCount', 0),
        'forks': node.get('forkCount', 0),
        'pushedAt': node.get('pushedAt'),
        'language': {'name': lang.get('name'), 'color': lang.get('color')} if lang.get('name') else None,
    }


def _gh_graphql():
    headers = {
        'Authorization': f'bearer {GITHUB_TOKEN}',
        'User-Agent': 'tarush.ai-site',
        'Accept': 'application/json',
    }
    resp = requests.post(
        'https://api.github.com/graphql',
        json={'query': _GH_GRAPHQL, 'variables': {'login': GITHUB_USERNAME}},
        headers=headers, timeout=12,
    )
    resp.raise_for_status()
    payload = resp.json()
    if payload.get('errors'):
        raise RuntimeError(payload['errors'][0].get('message', 'graphql error'))
    user = (payload.get('data') or {}).get('user')
    if not user:
        raise RuntimeError('user not found')

    cal = user['contributionsCollection']['contributionCalendar']
    weeks = [
        [{'date': d['date'], 'count': d['contributionCount'], 'weekday': d['weekday']}
         for d in wk['contributionDays']]
        for wk in cal['weeks']
    ]
    pinned = [n for n in (user.get('pinnedItems') or {}).get('nodes', []) if n]
    top = [n for n in (user.get('topRepos') or {}).get('nodes', []) if n]
    repos = pinned if pinned else top

    return {
        'ok': True,
        'source': 'graphql',
        'profile': {
            'name': user.get('name') or user.get('login'),
            'login': user.get('login'),
            'avatarUrl': user.get('avatarUrl'),
            'bio': user.get('bio'),
            'url': user.get('url'),
            'followers': user['followers']['totalCount'],
            'following': user['following']['totalCount'],
            'publicRepos': user['repositories']['totalCount'],
        },
        'calendar': {'total': cal['totalContributions'], 'weeks': weeks},
        'repos': [_gh_repo(n) for n in repos],
    }


def _gh_rest():
    headers = {'User-Agent': 'tarush.ai-site', 'Accept': 'application/vnd.github+json'}
    prof = requests.get(f'https://api.github.com/users/{GITHUB_USERNAME}', headers=headers, timeout=12)
    prof.raise_for_status()
    p = prof.json()
    repos = requests.get(
        f'https://api.github.com/users/{GITHUB_USERNAME}/repos',
        params={'sort': 'pushed', 'per_page': 6, 'type': 'owner'},
        headers=headers, timeout=12,
    )
    repos.raise_for_status()
    repo_list = [{
        'name': r.get('name'),
        'description': r.get('description'),
        'url': r.get('html_url'),
        'stars': r.get('stargazers_count', 0),
        'forks': r.get('forks_count', 0),
        'pushedAt': r.get('pushed_at'),
        'language': {'name': r.get('language'), 'color': None} if r.get('language') else None,
    } for r in repos.json() if not r.get('fork')]

    return {
        'ok': True,
        'source': 'rest',
        'profile': {
            'name': p.get('name') or p.get('login'),
            'login': p.get('login'),
            'avatarUrl': p.get('avatar_url'),
            'bio': p.get('bio'),
            'url': p.get('html_url'),
            'followers': p.get('followers', 0),
            'following': p.get('following', 0),
            'publicRepos': p.get('public_repos', 0),
        },
        'calendar': None,  # contribution graph requires a token (GraphQL)
        'repos': repo_list[:6],
    }


@app.route('/api/github')
def github_data():
    now = time.time()
    if _gh_cache['data'] and now - _gh_cache['ts'] < GH_CACHE_TTL:
        return jsonify(_gh_cache['data'])
    try:
        data = _gh_graphql() if GITHUB_TOKEN else _gh_rest()
        _gh_cache['data'] = data
        _gh_cache['ts'] = now
        return jsonify(data)
    except Exception as e:
        if _gh_cache['data']:  # serve stale rather than fail the page
            return jsonify(_gh_cache['data'])
        return jsonify({'ok': False, 'error': str(e), 'username': GITHUB_USERNAME,
                        'hasToken': bool(GITHUB_TOKEN)}), 200


@app.route('/')
def serve_index():
    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()
    html_content = inject_og_tags(html_content, '/')
    return html_content


@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(path) and os.path.isfile(path):
        return send_from_directory('.', path)

    with open('index.html', 'r', encoding='utf-8') as f:
        html_content = f.read()

    normalized_path = '/' + path.strip('/')
    html_content = inject_og_tags(html_content, normalized_path)
    return html_content


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port)
