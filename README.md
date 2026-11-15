# tarush.ai

Plain HTML portfolio and standalone fittingcorpus project page, served by Flask.

## Layout

- `site/`: **all public pages and assets**. Edit this directory.
- `site/fittingcorpus/`: self-contained paper page, PDFs, figures and chart data.
- `server.py`: clean URLs, paper aliases, and AureliusGPT/visitor APIs.
- `scripts/`: validation and optional paper asset refresh.
- `tests/`: isolated routing checks.
- `docs/`: deployment and paper instructions.
- `context/`, `.local-review/`, `.env`: private local material, ignored and excluded from the deployment image.

## Run locally

```sh
uv sync --frozen
uv run flask --app server run --port 5001 --debug
```

Open http://127.0.0.1:5001. Flask loads `.env` locally. To preview without credentials or database access, unset `DATABASE_URL` and set `PYTHON_DOTENV_DISABLED=1`.

## Validate

```sh
uv run python -m unittest discover -s tests
uv run python scripts/check_site.py
```

## Deploy

Use the included Dockerfile with any container host, or the native Python commands
in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). The complete site needs a Python server
for AureliusGPT and the visitor API; do not upload this repository wholesale to a
static host. Deployment does **not** need the research repository or a paper rebuild.

The new paper page is served from `site/fittingcorpus/` at both `/fittingcorpus/`
and `/research/fittingcorpus/`. Its relative links are preserved.

To refresh paper data from the separate research checkout, see
[docs/PAPER_PAGE.md](docs/PAPER_PAGE.md).
