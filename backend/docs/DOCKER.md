# Docker Build ガイド

## 概要

このドキュメントでは、backendアプリケーションをDockerイメージとしてビルドする方法を説明します。

## 前提条件

- Docker 20.10以上
- backendディレクトリにいること

## ディレクトリ構成

```
backend/
├── Dockerfile          # Dockerビルド定義
├── .dockerignore       # ビルドコンテキストから除外するファイル
├── package.json
├── tsconfig.json
└── src/
    ├── types-shared/   # 型定義（models, schemas, constants）
    ├── handlers/       # Lambda handlers
    ├── services/       # ビジネスロジック
    ├── repositories/   # データアクセス層
    └── types/          # backend固有の型定義
```

## Multi-stage buildの仕組み

### Stage 1: Build（ビルドステージ）
```dockerfile
# 依存関係のインストール
COPY package*.json ./
RUN npm ci

# TypeScriptのビルド
COPY src ./src
RUN npm run build
```

### Stage 2: Runtime（実行ステージ）
```dockerfile
# 本番依存のみインストール
COPY package*.json ./
RUN npm ci --omit=dev

# ビルド成果物をコピー
COPY --from=builder /app/dist ./dist
```

## ビルド方法

### 1. backendディレクトリから実行

```bash
# backendディレクトリに移動
cd backend

# Dockerイメージをビルド
docker build -t five-bomber-backend:latest .
```

### 2. タグ付きビルド

```bash
# バージョンタグ付き
docker build -t five-bomber-backend:v1.0.0 .

# 複数タグ
docker build \
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
docker build -t <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/five-bomber-backend:latest .

# プッシュ
docker push <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/five-bomber-backend:latest
```

## ビルドキャッシュの活用

依存関係の変更が少ない場合、Dockerのレイヤーキャッシュを活用して高速化できます：

```bash
# BuildKitを有効化（推奨）
export DOCKER_BUILDKIT=1

# ビルド
docker build -t five-bomber-backend:latest .
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

### ビルド時間が長い

**原因**: `node_modules`や`dist`など不要なファイルがコンテキストに含まれている

**解決策**: `.dockerignore`を確認
```bash
cat .dockerignore
# node_modules, dist, testsなどが含まれていることを確認
```

### ビルドキャッシュが古い

**原因**: Dockerキャッシュが古い

**解決策**: キャッシュを無効化してビルド
```bash
docker build --no-cache -t five-bomber-backend:latest .
```

## CI/CDでの使用

GitHub Actionsでの例：

```yaml
- name: Build Docker image
  working-directory: backend
  run: |
    docker build -t five-bomber-backend:${{ github.sha }} .

- name: Push to ECR
  working-directory: backend
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
