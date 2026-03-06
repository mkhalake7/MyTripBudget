#!/usr/bin/env bash
# Build script for Render.com deployment
# Installs Python + Node dependencies, builds React, copies to backend/static/

set -o errexit

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

echo "📦 Installing Node dependencies..."
npm ci --prefix frontend

echo "🔨 Building React frontend..."
npm run build --prefix frontend

echo "📁 Copying build to backend/static/..."
rm -rf backend/static
cp -r frontend/dist backend/static

echo "✅ Build complete!"
