#!/bin/bash
# フロントエンドプロジェクトセットアップの検証テスト (RED Phase)
# このテストは現時点では失敗するはずです

set -e

echo "===== Frontend Setup Test ====="

# Test 1: frontend ディレクトリの存在確認
echo "Test 1: Checking frontend directory exists..."
if [ -d "frontend" ]; then
  echo "✓ frontend directory exists"
else
  echo "✗ frontend directory does not exist"
  exit 1
fi

# Test 2: package.json の存在確認
echo "Test 2: Checking package.json exists..."
if [ -f "frontend/package.json" ]; then
  echo "✓ package.json exists"
else
  echo "✗ package.json does not exist"
  exit 1
fi

# Test 3: React と TypeScript の依存関係確認
echo "Test 3: Checking React 19 and TypeScript dependencies..."
if grep -q '"react":' frontend/package.json && grep -q '"typescript":' frontend/package.json; then
  echo "✓ React and TypeScript are listed in package.json"
else
  echo "✗ React or TypeScript not found in package.json"
  exit 1
fi

# Test 4: vite.config.ts の存在確認
echo "Test 4: Checking vite.config.ts exists..."
if [ -f "frontend/vite.config.ts" ]; then
  echo "✓ vite.config.ts exists"
else
  echo "✗ vite.config.ts does not exist"
  exit 1
fi

# Test 5: tsconfig.json の存在確認
echo "Test 5: Checking tsconfig.json exists..."
if [ -f "frontend/tsconfig.json" ]; then
  echo "✓ tsconfig.json exists"
else
  echo "✗ tsconfig.json does not exist"
  exit 1
fi

# Test 6: index.html の存在確認
echo "Test 6: Checking index.html exists..."
if [ -f "frontend/index.html" ]; then
  echo "✓ index.html exists"
else
  echo "✗ index.html does not exist"
  exit 1
fi

# Test 7: src ディレクトリの存在確認
echo "Test 7: Checking src directory exists..."
if [ -d "frontend/src" ]; then
  echo "✓ src directory exists"
else
  echo "✗ src directory does not exist"
  exit 1
fi

# Test 8: main.tsx の存在確認
echo "Test 8: Checking main.tsx exists..."
if [ -f "frontend/src/main.tsx" ]; then
  echo "✓ main.tsx exists"
else
  echo "✗ main.tsx does not exist"
  exit 1
fi

# Test 9: App.tsx の存在確認
echo "Test 9: Checking App.tsx exists..."
if [ -f "frontend/src/App.tsx" ]; then
  echo "✓ App.tsx exists"
else
  echo "✗ App.tsx does not exist"
  exit 1
fi

echo ""
echo "===== All Tests Passed ====="
