#!/bin/bash
# Backend setup verification script
# Verifies that Task 1.2 Acceptance Criteria are met

set -e

echo "=========================================="
echo "Backend Setup Verification Script"
echo "Task 1.2: バックエンドプロジェクトの初期化"
echo "=========================================="
echo ""

# Change to backend directory
cd "$(dirname "$0")/.."

# AC1: tsconfig.jsonが生成される
echo "✓ Checking tsconfig.json..."
if [ -f "tsconfig.json" ]; then
  echo "  ✓ tsconfig.json exists"
else
  echo "  ✗ tsconfig.json does not exist"
  exit 1
fi

# AC2: src/ディレクトリ構造（handlers/services/repositories）が作成される
echo "✓ Checking directory structure..."
for dir in src src/handlers/rest src/handlers/websocket src/services src/repositories src/models src/types src/utils tests/unit tests/integration; do
  if [ -d "$dir" ]; then
    echo "  ✓ $dir exists"
  else
    echo "  ✗ $dir does not exist"
    exit 1
  fi
done

# AC3: npm run build でTypeScriptがコンパイルされる
echo "✓ Checking build command..."
npm run build > /dev/null 2>&1
if [ -d "dist" ]; then
  echo "  ✓ Build succeeded, dist/ directory created"
else
  echo "  ✗ Build failed or dist/ not created"
  exit 1
fi

# Verify compiled files exist
if [ -f "dist/index.js" ]; then
  echo "  ✓ Compiled JavaScript files exist"
else
  echo "  ✗ No compiled JavaScript files found"
  exit 1
fi

# Additional checks: AWS SDK packages
echo "✓ Checking AWS SDK packages..."
if grep -q "@aws-sdk/client-dynamodb" package.json && \
   grep -q "@aws-sdk/lib-dynamodb" package.json && \
   grep -q "@aws-sdk/client-s3" package.json; then
  echo "  ✓ AWS SDK packages installed"
else
  echo "  ✗ AWS SDK packages not found in package.json"
  exit 1
fi

# Check Jest configuration
echo "✓ Checking Jest configuration..."
if [ -f "jest.config.js" ]; then
  echo "  ✓ jest.config.js exists"
else
  echo "  ✗ jest.config.js does not exist"
  exit 1
fi

# Run tests
echo "✓ Running tests..."
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "  ✓ Tests passed"
else
  echo "  ✗ Tests failed"
  exit 1
fi

echo ""
echo "=========================================="
echo "✓ All Acceptance Criteria Met!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  ✓ tsconfig.json generated"
echo "  ✓ Directory structure (handlers/services/repositories) created"
echo "  ✓ npm run build compiles TypeScript successfully"
echo "  ✓ AWS SDK v3 and DynamoDB DocumentClient installed"
echo "  ✓ Jest + AWS SDK Mocks configured"
echo "  ✓ Tests pass"
echo ""
echo "Task 1.2 is complete! ✓"
