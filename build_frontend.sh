#!/bin/bash
# Build React frontend and copy to backend/static/ for single-deployment serving
# Usage: ./build_frontend.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_DIR="$SCRIPT_DIR/backend"
STATIC_DIR="$BACKEND_DIR/static"

echo "📦 Building React frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "📁 Copying build to backend/static/..."
rm -rf "$STATIC_DIR"
cp -r "$FRONTEND_DIR/dist" "$STATIC_DIR"

echo "✅ Done! Frontend built and copied to backend/static/"
echo "   Start the backend with: cd backend && uvicorn main:app --reload"
