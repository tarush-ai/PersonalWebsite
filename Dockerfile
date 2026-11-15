FROM python:3.14-slim
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:0.7.17 /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev
COPY server.py ./
COPY site/ ./site/
ENV PATH="/app/.venv/bin:$PATH" PORT=8080 PYTHONDONTWRITEBYTECODE=1
EXPOSE 8080
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 1 --threads 4 --timeout 120 server:app"]
