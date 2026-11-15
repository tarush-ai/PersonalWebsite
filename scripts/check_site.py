#!/usr/bin/env python3
"""Check public HTML links against Flask without credentials or API requests."""
import os
import sys
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit, unquote

os.environ['PYTHON_DOTENV_DISABLED'] = '1'
os.environ.pop('DATABASE_URL', None)
REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))
import server

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs, self.ids = [], []
        self.feed(text)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ('href', 'src'):
            if key in attrs:
                self.refs.append(attrs[key])

client = server.app.test_client()
errors = []
count = 0
for path in server.ROOT.rglob('*.html'):
    relative = path.relative_to(server.ROOT).as_posix()
    url = '/' + relative
    page = Page(path.read_text())
    if len(page.ids) != len(set(page.ids)):
        errors.append(f'{relative}: duplicate IDs')
    for ref in page.refs:
        parts = urlsplit(urljoin('http://local' + url, ref))
        if parts.netloc != 'local' or parts.scheme not in ('http', 'https'):
            continue
        response = client.get(parts.path, follow_redirects=True)
        count += 1
        if response.status_code != 200:
            errors.append(f'{relative}: {ref}: HTTP {response.status_code}')
        elif parts.fragment and response.mimetype == 'text/html':
            if unquote(parts.fragment) not in Page(response.get_data(as_text=True)).ids:
                errors.append(f'{relative}: missing anchor {ref}')
for prefix in ('/fittingcorpus/', '/research/fittingcorpus/'):
    for path in (server.ROOT / 'fittingcorpus').rglob('*'):
        if path.is_file():
            url = prefix + path.relative_to(server.ROOT / 'fittingcorpus').as_posix()
            response = client.get(url)
            if response.status_code != 200 or response.data != path.read_bytes():
                errors.append(f'Paper alias differs: {url}')
for path in ('/.env', '/context/RESEARCHDIRECTIONS.md', '/scripts/check_site.py', '/.local-review/page-review.md', '/server.py'):
    if client.get(path).status_code != 404:
        errors.append(f'Private path exposed: {path}')
print(f'{count} internal references checked; paper aliases and private paths checked.')
for error in errors:
    print(error)
sys.exit(bool(errors))
