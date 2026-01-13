#!/bin/bash
# Translation Refactor - Batch Processing Script
# This script helps identify and process remaining files with hardcoded translations

echo "=== Translation Refactor Progress ==="
echo ""

# Count total files with language ternaries
echo "Files remaining with 'language === 'en' ?' patterns:"
find ./components -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; | wc -l

echo ""
echo "=== Files by Category ==="
echo ""

echo "Profile Components:"
find ./components/profile -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Admin Components:"
find ./components/admin -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Reading Components:"
find ./components/reading -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Blog Components:"
find ./components/blog -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Tarot Components:"
find ./components/tarot -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Rewards Components:"
find ./components/rewards -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo "Legal Components:"
find ./components/legal -name "*.tsx" -type f -exec grep -l "language === 'en' ?" {} \; 2>/dev/null | wc -l

echo ""
echo "=== Top 10 files by translation count ==="
for file in $(find ./components -name "*.tsx" -type f); do
  count=$(grep -c "language === 'en' ?" "$file" 2>/dev/null || echo 0)
  if [ "$count" -gt 0 ]; then
    echo "$count $file"
  fi
done | sort -rn | head -10

echo ""
echo "=== Completed Files (3 commits) ==="
echo "✓ App.tsx (18 strings)"
echo "✓ Header.tsx, SubNav.tsx, Footer.tsx (navigation)"
echo "✓ FAQ.tsx (6 strings with plural logic)"
