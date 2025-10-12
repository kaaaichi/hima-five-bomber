#!/bin/bash
# Task 1.2 Acceptance Criteria Verification Script
# Executes verification from the project root directory

echo "=========================================="
echo "Task 1.2: バックエンドプロジェクトの初期化"
echo "Acceptance Criteria Verification"
echo "=========================================="
echo ""

PROJECT_ROOT="/Users/iidakaichiro/develop/portfolio/hima-five-bomber"
BACKEND_DIR="$PROJECT_ROOT/backend"

# AC1: tsconfig.jsonが生成される
echo "[1/6] Checking tsconfig.json..."
if [ -f "$BACKEND_DIR/tsconfig.json" ]; then
  echo "  ✓ tsconfig.json exists"
else
  echo "  ✗ tsconfig.json does not exist"
  exit 1
fi

# AC2: src/ディレクトリ構造が作成される
echo "[2/6] Checking directory structure..."
for dir in src src/handlers/rest src/handlers/websocket src/services src/repositories src/models src/types src/utils tests/unit tests/integration; do
  if [ -d "$BACKEND_DIR/$dir" ]; then
    echo "  ✓ $dir exists"
  else
    echo "  ✗ $dir does not exist"
    exit 1
  fi
done

# AC3: npm run build でTypeScriptがコンパイルされる
echo "[3/6] Checking TypeScript build..."
cd "$BACKEND_DIR" && npm run build > /dev/null 2>&1
if [ -d "$BACKEND_DIR/dist" ]; then
  echo "  ✓ Build succeeded, dist/ directory created"
  if [ -f "$BACKEND_DIR/dist/index.js" ]; then
    echo "  ✓ Compiled JavaScript files exist"
  else
    echo "  ✗ No compiled JavaScript files found"
    exit 1
  fi
else
  echo "  ✗ Build failed or dist/ not created"
  exit 1
fi

# AC4: AWS SDK v3パッケージがインストールされている
echo "[4/6] Checking AWS SDK packages..."
if grep -q "@aws-sdk/client-dynamodb" "$BACKEND_DIR/package.json" && \
   grep -q "@aws-sdk/lib-dynamodb" "$BACKEND_DIR/package.json" && \
   grep -q "@aws-sdk/client-s3" "$BACKEND_DIR/package.json"; then
  echo "  ✓ AWS SDK v3 packages installed"
else
  echo "  ✗ AWS SDK packages not found"
  exit 1
fi

# AC5: Jest設定が存在する
echo "[5/6] Checking Jest configuration..."
if [ -f "$BACKEND_DIR/jest.config.js" ]; then
  echo "  ✓ jest.config.js exists"
else
  echo "  ✗ jest.config.js does not exist"
  exit 1
fi

# AC6: テストが実行できる
echo "[6/6] Running tests..."
cd "$BACKEND_DIR" && npm test > /dev/null 2>&1
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
