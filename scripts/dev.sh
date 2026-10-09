#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
uv sync
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi
uv run uvicorn resilionet_api.main:app --host 127.0.0.1 --port 8105 --reload &
api_pid=$!
if [[ -d apps/web/node_modules ]]; then
  (cd apps/web && npm run dev -- --host 127.0.0.1 --port 5205) &
  web_pid=$!
else
  web_pid=""
  echo "apps/web dependencies are not installed; API only on :8105" >&2
fi
trap 'kill ${api_pid} ${web_pid:-} 2>/dev/null || true' EXIT
wait
