#!/bin/bash

# Start both Mastra backend (port 4111) and Vite frontend (port 5000)
npx concurrently \
  --names "backend,frontend" \
  --prefix-colors "cyan,magenta" \
  "mastra dev" \
  "sleep 5 && cd web && npx vite --host 0.0.0.0 --port 5000"
