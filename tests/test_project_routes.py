"""Isolated routing checks; no credentials, model calls or visitor writes."""
import os
os.environ['PYTHON_DOTENV_DISABLED'] = '1'
os.environ.pop('DATABASE_URL', None)
import tempfile
import unittest
from pathlib import Path
import server

class ProjectRoutes(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original_root = server.ROOT
        server.ROOT = Path(self.temp.name)
        (server.ROOT / '404.html').write_text('not found')
        folder = server.ROOT / 'fittingcorpus'
        (folder / 'assets').mkdir(parents=True)
        (folder / 'index.html').write_text('<a href="assets/style.css">Paper</a>')
        (folder / 'assets/style.css').write_text('body {}')
        (folder / '.secret.json').write_text('private')
        (folder / 'server.py').write_text('private')
        (server.ROOT / 'private.txt').write_text('private')
        (folder / 'escape.txt').symlink_to(server.ROOT / 'private.txt')
        self.client = server.app.test_client()

    def tearDown(self):
        server.ROOT = self.original_root
        self.temp.cleanup()

    def test_redirect_preserves_query(self):
        response = self.client.get('/fittingcorpus?ref=paper')
        self.assertEqual(response.status_code, 308)
        self.assertEqual(response.headers['Location'], '/fittingcorpus/?ref=paper')

    def test_html_and_relative_asset_unchanged(self):
        with self.client.get('/fittingcorpus/') as response:
            self.assertEqual(response.data, b'<a href="assets/style.css">Paper</a>')
        with self.client.get('/fittingcorpus/assets/style.css') as response:
            self.assertEqual(response.data, b'body {}')

    def test_private_files_and_escape_blocked(self):
        for path in ['.secret.json', 'server.py', '../private.txt', 'escape.txt', 'missing.css']:
            with self.subTest(path=path):
                with self.client.get('/fittingcorpus/' + path) as response:
                    self.assertEqual(response.status_code, 404)

    def test_research_alias_preserves_source_assets_and_guards(self):
        response = self.client.get('/research/fittingcorpus?ref=paper')
        self.assertEqual(response.headers['Location'], '/research/fittingcorpus/?ref=paper')
        for suffix in ['', 'assets/style.css', '.secret.json', 'server.py', '../private.txt', 'escape.txt']:
            with self.subTest(suffix=suffix):
                with self.client.get('/research/fittingcorpus/' + suffix) as alias:
                    with self.client.get('/fittingcorpus/' + suffix) as original:
                        self.assertEqual(alias.status_code, original.status_code)
                        self.assertEqual(alias.data, original.data)

if __name__ == '__main__':
    unittest.main()
