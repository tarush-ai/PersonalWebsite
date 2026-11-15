# Deployment

## Container (recommended)

Build from the repository root:

```sh
docker build -t tarush-site .
docker run --rm -p 8080:8080 tarush-site
```

The service binds to `PORT` (8080 by default). Health check: `GET /`.
The Docker build only includes the server, dependency manifest/lock and `site/`.
No credentials, college applications, old designs or research source are copied.

## Native Python host

Use Python 3.14, matching `.python-version` and the lockfile.

- Build: `uv sync --frozen --no-dev`
- Start: `uv run gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120 server:app`
- Health check: `/`

Set secrets through the hosting provider, not committed files. Inspect server.py for
the optional model API environment variables. With no model credentials, the portfolio
and paper still serve, but model requests cannot complete. Optional `DATABASE_URL`
provides persistent visitor counts; without it counts use an ephemeral local JSON file.
Keep one worker for the local JSON counter. No platform-specific account setup or
production deployment has been performed by these files.

## Release checks

Run both checks in README. Verify `/`, `/experience`, `/research`, `/aureliusgpt`,
`/fittingcorpus/`, and `/research/fittingcorpus/`. Both paper paths must load relative
CSS, JavaScript, figures and PDFs. Private paths such as `/context/`, `/.env`, and
`/scripts/check_site.py` must return 404.
