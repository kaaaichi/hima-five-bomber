# Docker Build ガイド

## 概要

このドキュメントでは、backendアプリケーションをDockerイメージとしてビルドする方法を説明します。

## 前提条件

- Docker 20.10以上
- プロジェクトルート（`hima-five-bomber`）にいること

## ディレクトリ構成

```
hima-five-bomber/
├── backend/
│   ├── Dockerfile          # Dockerビルド定義
│   ├── .dockerignore       # ビルドコンテキストから除外するファイル
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
└── shared/                 # 共有パッケージ（backendから参照）
    ├── package.json
    ├── tsconfig.json
    ├── index.ts
    └── types/
```

## sharedパッケージの扱い

backendは`@five-bomber/shared`パッケージに依存しています（`package.json`で`"file:../shared"`として参照）。

Dockerイメージには以下の方法でsharedパッケージが含まれます：

### Multi-stage buildの仕組み

#### Stage 1: Build（ビルドステージ）
1. **sharedパッケージのコピー＆ビルド**
   ```dockerfile
   COPY shared/package*.json ./shared/
   COPY shared/tsconfig.json ./shared/
   COPY shared/index.ts ./shared/
   COPY shared/types ./shared/types
   RUN npm ci && npm run build
   ```

2. **backendパッケージのコピー＆ビルド**
   ```dockerfile
   COPY backend/package*.json ./
   COPY backend/tsconfig.json ./
   RUN npm ci  # ←ここで../sharedを参照してインストール
   COPY backend/src ./src
   RUN npm run build
   ```

#### Stage 2: Runtime（実行ステージ）
1. **sharedパッケージのビルド成果物をコピー**
   ```dockerfile
   COPY --from=builder /app/shared/package*.json ./shared/
   COPY --from=builder /app/shared/dist ./shared/dist
   ```

2. **backendパッケージのビルド成果物をコピー**
   ```dockerfile
   COPY --from=builder /app/backend/package*.json ./
   RUN npm ci --omit=dev  # ←ここで./sharedを参照して本番依存をインストール
   COPY --from=builder /app/backend/dist ./dist
   ```

## ビルド方法

### 1. プロジェクトルートから実行（推奨）

**重要**: Docker buildのコンテキストは**プロジェクトルート**です。

```bash
# プロジェクトルートに移動
cd /path/to/hima-five-bomber

# Dockerイメージをビルド
docker build -f backend/Dockerfile -t five-bomber-backend:latest .
```

#### パラメータ説明
- `-f backend/Dockerfile`: Dockerfileのパスを指定
- `-t five-bomber-backend:latest`: イメージ名とタグ
- `.`: ビルドコンテキスト（カレントディレクトリ = プロジェクトルート）

### 2. タグ付きビルド

```bash
# バージョンタグ付き
docker build -f backend/Dockerfile -t five-bomber-backend:v1.0.0 .

# 複数タグ
docker build -f backend/Dockerfile \
  -t five-bomber-backend:latest \
  -t five-bomber-backend:v1.0.0 \
  .
```

### 3. AWS ECRへのプッシュ

```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# ビルド＆タグ付け
docker build -f backend/Dockerfile \
  -t <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/five-bomber-backend:latest .

# プッシュ
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/five-bomber-backend:latest
```

## ビルドキャッシュの活用

依存関係の変更が少ない場合、Dockerのレイヤーキャッシュを活用して高速化できます：

```bash
# BuildKitを有効化（推奨）
export DOCKER_BUILDKIT=1

# ビルド
docker build -f backend/Dockerfile -t five-bomber-backend:latest .
```

## ローカルテスト

ビルドしたイメージをローカルでテストする：

```bash
# イメージを起動（Lambda Runtime Interface Emulator）
docker run --rm -p 9000:8080 five-bomber-backend:latest

# 別のターミナルでテスト
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -d '{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"Test Host\"}",
    "headers": {"Content-Type": "application/json"}
  }'
```

## トラブルシューティング

### エラー: `Cannot find module '@five-bomber/shared'`

**原因**: ビルドコンテキストがプロジェクトルートでない

**解決策**:
```bash
# ❌ 間違い（backendディレクトリから実行）
cd backend
docker build -t five-bomber-backend:latest .

# ✅ 正しい（プロジェクトルートから実行）
cd ..  # プロジェクトルートに戻る
docker build -f backend/Dockerfile -t five-bomber-backend:latest .
```

### ビルド時間が長い

**原因**: `node_modules`や`dist`など不要なファイルがコンテキストに含まれている

**解決策**: `.dockerignore`を確認
```bash
cat backend/.dockerignore
# node_modules, dist, testsなどが含まれていることを確認
```

### sharedパッケージの変更が反映されない

**原因**: Dockerキャッシュが古い

**解決策**: キャッシュを無効化してビルド
```bash
docker build --no-cache -f backend/Dockerfile -t five-bomber-backend:latest .
```

## CI/CDでの使用

GitHub Actionsでの例：

```yaml
- name: Build Docker image
  run: |
    docker build -f backend/Dockerfile -t five-bomber-backend:${{ github.sha }} .

- name: Push to ECR
  run: |
    docker tag five-bomber-backend:${{ github.sha }} \
      ${{ secrets.ECR_REGISTRY }}/five-bomber-backend:${{ github.sha }}
    docker push ${{ secrets.ECR_REGISTRY }}/five-bomber-backend:${{ github.sha }}
```

## 最適化のベストプラクティス

1. **Multi-stage buildの活用**: ビルドステージと実行ステージを分離してイメージサイズを削減
2. **.dockerignoreの設定**: 不要なファイルをビルドコンテキストから除外
3. **レイヤーキャッシュの活用**: 変更頻度の低いファイルを先にCOPY
4. **本番依存のみインストール**: `npm ci --omit=dev`で開発依存を除外

## 参考

- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [Docker Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
- [Lambda Node.js Base Images](https://gallery.ecr.aws/lambda/nodejs)
