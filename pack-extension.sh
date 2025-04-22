#!/bin/bash
# pack-extension.sh
# Usage: ./pack-extension.sh
# Packs Entrata Lease Audit Assistant into extension.zip for Chrome

set -e

# Clean up any previous build
echo "Cleaning up previous build..."
rm -rf dist
mkdir dist

# Copy required files and folders
cp manifest.json dist/
cp -r src dist/

# Remove test and dev files from dist
rm -rf dist/src/js/__tests__

# Optionally: remove any other dev-only files or folders here

# Zip the contents of dist into extension.zip (contents, not the dist folder itself)
echo "Creating extension.zip..."
cd dist
zip -r ../extension.zip .
cd ..

echo "Extension packed as extension.zip!"
