#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "CelestiArcana Production Build"
echo "=========================================="

# Step 1: Clean slate
echo ""
echo "[1/4] Cleaning previous build..."
rm -rf dist
echo "  ✓ Cleaned dist directory"

# Step 2: Vite build
echo ""
echo "[2/4] Running Vite build..."
npm run build:vite
if [ $? -ne 0 ]; then
    echo "  ✗ Vite build failed!"
    exit 1
fi
echo "  ✓ Vite build complete"

# Step 3: Pre-render (required for SEO)
echo ""
echo "[3/4] Pre-rendering static pages..."
if ! node scripts/prerender.js; then
    echo "  ✗ Pre-render FAILED!"
    echo "  → Deployment blocked to protect SEO"
    echo "  → Previous deployment remains live"
    exit 1
fi
echo "  ✓ Pre-render complete"

# Step 4: Verify build output
echo ""
echo "[4/4] Verifying build..."
if [ ! -f "dist/index.html" ]; then
    echo "  ✗ CRITICAL: dist/index.html missing!"
    exit 1
fi
echo "  ✓ index.html present"

# Count and verify pre-rendered files
STATIC_COUNT=$(find dist -name "*.html" ! -name "index.html" | wc -l | tr -d ' ')
echo "  ✓ ${STATIC_COUNT} static HTML pages generated"

# Minimum threshold - we expect at least 100 pages (7 static + 78 tarot + ~25 blog)
MIN_PAGES=100
if [ "$STATIC_COUNT" -lt "$MIN_PAGES" ]; then
    echo "  ✗ Too few pages generated (expected at least $MIN_PAGES)"
    echo "  → Deployment blocked to protect SEO"
    exit 1
fi

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
