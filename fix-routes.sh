#!/bin/bash
# Fix routes-manifest.json - add missing dataRoutes property

MANIFEST="apps/web/.next/routes-manifest.json"

if [ -f "$MANIFEST" ]; then
  echo "Checking $MANIFEST..."
  
  # Check if dataRoutes is missing
  if ! grep -q '"dataRoutes"' "$MANIFEST"; then
    echo "Adding missing dataRoutes property..."
    
    # Add dataRoutes property before the closing brace
    sed -i 's/\(.*\)\}$/\1,"dataRoutes":[]}/' "$MANIFEST"
    
    echo "✓ Fixed routes-manifest.json"
    cat "$MANIFEST"
  else
    echo "✓ routes-manifest.json already has dataRoutes"
  fi
else
  echo "✗ Error: $MANIFEST not found!"
  exit 1
fi
