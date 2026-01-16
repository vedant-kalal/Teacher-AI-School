#!/usr/bin/env bash

set -e

INNGEST_CONFIG=".config/inngest/inngest.yaml"

echo "🐍 Starting Python AI Teacher backend on port 8001..."
cd python_backend && python3 main.py &
PYTHON_PID=$!
cd ..
echo "🐍 Python server started with PID $PYTHON_PID"

sleep 2

if [[ ! -f  "${INNGEST_CONFIG}" ]]; then
    mkdir -p "$(dirname "${INNGEST_CONFIG}")"
    if [[ -z "${DATABASE_URL}" ]]; then
        printf 'postgres-uri: "%s"' "${DATABASE_URL}" > "${INNGEST_CONFIG}"
    else
        printf 'sqlite-dir: "/home/runner/workspace/.local/share/inngest"' > "${INNGEST_CONFIG}"
    fi
fi

cleanup() {
    echo "🛑 Stopping Python server..."
    kill $PYTHON_PID 2>/dev/null || true
}
trap cleanup EXIT

exec inngest-cli dev -u http://localhost:5000/api/inngest --host 127.0.0.1 --port 3000 --config "${INNGEST_CONFIG}"
