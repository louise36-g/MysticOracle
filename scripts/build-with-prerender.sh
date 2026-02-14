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

# Step 3: Pre-render (with graceful failure)
echo ""
echo "[3/4] Pre-rendering static pages..."
node scripts/prerender.js || PRERENDER_EXIT=$?
PRERENDER_EXIT=${PRERENDER_EXIT:-0}

if [ $PRERENDER_EXIT -ne 0 ]; then
    echo "  ⚠ Pre-render had errors (exit code: $PRERENDER_EXIT)"
    echo "  → SPA will still work, but some pages won't have static HTML"
    # Don't exit - SPA is still functional
else
    echo "  ✓ Pre-render complete"
fi

# Step 4: Verify build output
echo ""
echo "[4/4] Verifying build..."
if [ ! -f "dist/index.html" ]; then
    echo "  ✗ CRITICAL: dist/index.html missing!"
    exit 1
fi
echo "  ✓ index.html present"

# Count pre-rendered files
STATIC_COUNT=$(find dist -name "*.html" ! -name "index.html" | wc -l | tr -d ' ')
echo "  ✓ ${STATIC_COUNT} static HTML pages generated"

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="
