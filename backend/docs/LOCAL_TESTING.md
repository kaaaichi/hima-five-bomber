# ローカルでのLambda関数テストガイド

## 概要

このドキュメントでは、実装済みのLambda関数をローカル環境で動作確認する方法を説明します。

## 前提条件

- Docker Desktop がインストールされていること
- Node.js 22.x がインストールされていること
- backendディレクトリにいること

## 方法1: Lambda Runtime Interface Emulator（RIE）【推奨】

AWS公式のLambda Runtime Interface Emulatorを使用して、本番環境に近い形でテストできます。

### 1. Dockerイメージをビルド

```bash
cd backend
docker build -t five-bomber-backend:local .
```

### 2. Lambda関数を起動

```bash
# POST /api/rooms (ルーム作成) をテスト
docker run --rm -p 9000:8080 \
  -e DYNAMODB_ROOMS_TABLE=five-bomber-rooms-local \
  five-bomber-backend:local \
  dist/handlers/rest/rooms.handler
```

#### 環境変数の説明
- `DYNAMODB_ROOMS_TABLE`: DynamoDBテーブル名（ローカルでは任意の名前でOK）
- `-p 9000:8080`: Lambda RIEのポート（9000番でアクセス）

### 3. Lambda関数を呼び出し

別のターミナルで以下を実行：

```bash
# ルーム作成リクエスト（正常系）
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"Local Test Host\"}",
    "headers": {
      "Content-Type": "application/json"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "isBase64Encoded": false
  }' | jq
```

#### 期待されるレスポンス（成功）

```json
{
  "statusCode": 200,
  "body": "{\"roomId\":\"abc123\",\"hostId\":\"player-xxxx\"}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

#### 異常系テスト

```bash
# hostNameが空の場合
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"\"}",
    "headers": {
      "Content-Type": "application/json"
    }
  }' | jq
```

#### 期待されるレスポンス（バリデーションエラー）

```json
{
  "statusCode": 400,
  "body": "{\"error\":{\"code\":\"VALIDATION_ERROR\",\"message\":\"Invalid request parameters\",\"details\":{\"hostName\":\"Host name cannot be empty\"}}}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```

### 4. コンテナを停止

`Ctrl+C`でコンテナを停止します。

---

## 方法2: ローカルDynamoDBを使用した完全なテスト

DynamoDBもローカルで起動して、実際のデータベース操作をテストできます。

### 1. DynamoDB Localを起動

```bash
# docker-compose.ymlを使用（後述）
docker-compose up -d dynamodb-local
```

### 2. テーブルを作成

```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name five-bomber-rooms-local \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

### 3. Lambda関数を起動（DynamoDB接続）

```bash
docker run --rm -p 9000:8080 \
  -e DYNAMODB_ROOMS_TABLE=five-bomber-rooms-local \
  -e AWS_REGION=ap-northeast-1 \
  -e AWS_ACCESS_KEY_ID=dummy \
  -e AWS_SECRET_ACCESS_KEY=dummy \
  -e DYNAMODB_ENDPOINT=http://host.docker.internal:8000 \
  five-bomber-backend:local \
  dist/handlers/rest/rooms.handler
```

**注意**: `host.docker.internal`はDocker Desktop for Mac/Windowsでホストマシンにアクセスするための特別なホスト名です。

### 4. Lambda関数を呼び出し

```bash
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"DynamoDB Test\"}",
    "headers": {
      "Content-Type": "application/json"
    }
  }' | jq
```

### 5. DynamoDBにデータが保存されたか確認

```bash
aws dynamodb scan \
  --endpoint-url http://localhost:8000 \
  --table-name five-bomber-rooms-local \
  --region ap-northeast-1
```

---

## 方法3: docker-composeを使用した統合テスト

複数のサービスを同時に起動して統合テストを行います。

### 1. docker-compose.ymlを作成

`backend/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # DynamoDB Local
  dynamodb-local:
    image: amazon/dynamodb-local:latest
    container_name: dynamodb-local
    ports:
      - "8000:8000"
    command: "-jar DynamoDBLocal.jar -sharedDb -dbPath ./data"
    volumes:
      - ./dynamodb-data:/home/dynamodblocal/data
    working_dir: /home/dynamodblocal

  # Lambda Runtime Interface Emulator
  lambda-rooms:
    build: .
    container_name: lambda-rooms
    ports:
      - "9000:8080"
    environment:
      - DYNAMODB_ROOMS_TABLE=five-bomber-rooms-local
      - AWS_REGION=ap-northeast-1
      - AWS_ACCESS_KEY_ID=dummy
      - AWS_SECRET_ACCESS_KEY=dummy
      - DYNAMODB_ENDPOINT=http://dynamodb-local:8000
    command: ["dist/handlers/rest/rooms.handler"]
    depends_on:
      - dynamodb-local
```

### 2. サービスを起動

```bash
cd backend
docker-compose up -d
```

### 3. テーブルを作成

```bash
aws dynamodb create-table \
  --endpoint-url http://localhost:8000 \
  --table-name five-bomber-rooms-local \
  --attribute-definitions \
    AttributeName=PK,AttributeType=S \
    AttributeName=SK,AttributeType=S \
  --key-schema \
    AttributeName=PK,KeyType=HASH \
    AttributeName=SK,KeyType=RANGE \
  --billing-mode PAY_PER_REQUEST \
  --region ap-northeast-1
```

### 4. Lambda関数を呼び出し

```bash
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" \
  -H "Content-Type: application/json" \
  -d '{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"Docker Compose Test\"}",
    "headers": {
      "Content-Type": "application/json"
    }
  }' | jq
```

### 5. ログを確認

```bash
# Lambda関数のログ
docker-compose logs -f lambda-rooms

# DynamoDBのログ
docker-compose logs -f dynamodb-local
```

### 6. サービスを停止

```bash
docker-compose down
```

---

## 方法4: 単体テスト（Jest）

最もシンプルで高速なテスト方法です（既に実装済み）。

### テストを実行

```bash
cd backend
npm test
```

### 特定のテストファイルのみ実行

```bash
# 統合テストのみ
npm test -- rooms.integration.test.ts

# ユニットテストのみ
npm test -- RoomService.test.ts
```

### カバレッジ付きで実行

```bash
npm test -- --coverage
```

---

## トラブルシューティング

### エラー: `Cannot connect to DynamoDB`

**原因**: DynamoDB Localが起動していない、またはエンドポイントが間違っている

**解決策**:
```bash
# DynamoDB Localが起動しているか確認
docker ps | grep dynamodb

# エンドポイントが正しいか確認
echo $DYNAMODB_ENDPOINT
```

### エラー: `Module not found`

**原因**: Dockerイメージが古い

**解決策**:
```bash
# イメージを再ビルド
docker build --no-cache -t five-bomber-backend:local .
```

### エラー: `Port 9000 is already in use`

**原因**: 別のコンテナが9000番ポートを使用している

**解決策**:
```bash
# 既存のコンテナを停止
docker stop $(docker ps -q --filter "publish=9000")

# または別のポートを使用
docker run -p 9001:8080 ...
```

---

## ベストプラクティス

1. **開発時**: Jestの単体テスト・統合テストを使用（高速）
2. **デプロイ前**: Docker + Lambda RIEで本番環境に近い形で検証
3. **CI/CD**: GitHub ActionsでJestテストを自動実行
4. **本格的な統合テスト**: docker-composeで複数サービスを連携テスト

---

## 参考

- [AWS Lambda Container Images](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html)
- [Lambda Runtime Interface Emulator](https://github.com/aws/aws-lambda-runtime-interface-emulator)
- [DynamoDB Local](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Testing Lambda container images locally](https://docs.aws.amazon.com/lambda/latest/dg/images-test.html)
