#!/bin/bash
# Insert seed data into translations.ts

FILE="server/src/routes/translations.ts"
SEED_DATA="scripts/seed-data-clean.txt"
BACKUP="server/src/routes/translations.ts.backup"

# Backup original
cp "$FILE" "$BACKUP"

# Find line number with closing brace
LINE_NUM=$(grep -n "^    };" "$FILE" | tail -1 | cut -d: -f1)

echo "Inserting at line $LINE_NUM (before closing brace)"

# Split file at insertion point
head -n $((LINE_NUM - 1)) "$FILE" > "$FILE.tmp"

# Add section header and extracted translations
cat >> "$FILE.tmp" << 'EOF'

      // ============================================
      // EXTRACTED TRANSLATIONS
      // ============================================
EOF

# Add the seed data
cat "$SEED_DATA" >> "$FILE.tmp"

# Add the closing brace and rest of file
tail -n +$LINE_NUM "$FILE" >> "$FILE.tmp"

# Replace original
mv "$FILE.tmp" "$FILE"

echo "✅ Seed data inserted successfully!"
echo "📁 Backup saved to: $BACKUP"
