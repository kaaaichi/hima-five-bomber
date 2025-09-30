# Technology Stack

## Architecture

### Overall Architecture
フルサーバーレスアーキテクチャを採用し、AWSマネージドサービスで構成されたスケーラブルなWebアプリケーション。

```
[Client (Browser)]
       ↓
[CloudFront (CDN)]
       ↓
[S3 Static Hosting] ← フロントエンド
       ↓
[API Gateway (REST + WebSocket)]
       ↓
[Lambda Functions] ← バックエンドロジック
       ↓
[DynamoDB] ← データ永続化
       ↓
[S3] ← 問題JSON格納
```

### 判定方式: ハイブリッドアプローチ
- **問題データ**: 問題文のみフロントエンドに送信（正解は送らない）
- **正誤判定**: WebSocketでバックエンドにリクエスト → Lambda関数で判定実行
- **レスポンス**: 50-100ms程度の低遅延でリアルタイム体験を実現
- **セキュリティ**: 正解データをサーバー側で秘匿し、チート対策

## Frontend

### Core Technologies
- **React 19**: UIフレームワーク
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク
- **Socket.io-client**: WebSocket通信（リアルタイム同期）
- **Vite**: 高速ビルドツール

### Development Tools
- **ESLint**: コード品質チェック
- **Prettier**: コードフォーマッター
- **React Testing Library**: コンポーネントテスト

### Key Frontend Responsibilities
- ゲームUI/UXの実装
- タイマー・カウントダウン表示
- 爆弾演出エフェクト
- WebSocketによるリアルタイム状態同期
- レスポンシブデザイン（PC・スマホ対応）

## Backend (AWS Serverless)

### Core Services

#### AWS Lambda (Node.js 22.x + TypeScript)
- **Runtime**: Node.js 22.x
- **Language**: TypeScript
- **責務**:
  - 正誤判定ロジック
  - スコア計算
  - ゲーム状態管理
  - 表記ゆれ判定（正規化処理）

#### API Gateway
- **REST API**:
  - ルーム作成・取得
  - 問題管理（CRUD）
  - ランキング取得
- **WebSocket API**:
  - リアルタイム回答送信
  - 正誤判定レスポンス
  - ゲーム状態同期
  - ランキング更新通知

#### DynamoDB
- **用途**: ルーム・セッション・スコア管理
- **テーブル設計**（予定）:
  - `Rooms`: ルーム情報
  - `GameSessions`: ゲームセッション状態
  - `Scores`: スコア履歴
  - `Questions`: 問題メタデータ

#### S3
- **用途1**: 問題JSON格納（`questions/` バケット）
- **用途2**: 静的ホスティング（フロントエンドビルド成果物）

#### CloudFront
- **用途**: CDN配信（低レイテンシ、グローバル配信）
- **キャッシュ戦略**: 静的アセットは長期キャッシュ、APIは短期

## Infrastructure as Code (IaC)

### Terraform
- **バージョン**: Terraform 1.x
- **言語**: HCL (HashiCorp Configuration Language)
- **管理対象**:
  - Lambda Functions
  - API Gateway (REST + WebSocket)
  - DynamoDB Tables
  - S3 Buckets
  - CloudFront Distributions
  - IAM Roles/Policies

### Terraform構成（予定）
```
terraform/
  ├── modules/
  │   ├── frontend/        # S3 + CloudFront
  │   ├── backend/         # Lambda + API Gateway
  │   ├── database/        # DynamoDB
  │   └── monitoring/      # CloudWatch
  ├── environments/
  │   └── prd/             # 本番環境（初期構成）
  │       ├── main.tf
  │       └── terraform.tfvars
  │   # 将来追加: dev/, stg/
  ├── main.tf
  ├── variables.tf
  ├── outputs.tf
  └── backend.tf           # Terraform state管理 (S3)
```

## CI/CD

### GitHub Actions
- **Workflow** (prd環境):
  1. **Lint & Test**: ESLint + テスト実行
  2. **Build**: フロントエンド・バックエンドビルド
  3. **Terraform Deploy**: AWSリソースデプロイ (手動承認)
  4. **E2E Test**: デプロイ後の統合テスト（将来追加）

### Deployment Strategy
- **初期構成**: `prd`（本番環境）のみ
- **将来拡張**: `dev`・`stg`環境を後から追加可能な設計
- **Terraformワークスペース**: 環境ごとのstate管理
- **State Backend**: S3 + DynamoDB (state locking)
- **デプロイトリガー**: 手動承認 + タグトリガー

## Development Environment

### Required Tools
- **Node.js**: 22.x LTS
- **npm/yarn**: パッケージマネージャー
- **AWS CLI**: v2
- **Terraform**: 1.x (`brew install terraform` or download from HashiCorp)
- **Git**: バージョン管理

### Setup Commands（予定）
```bash
# フロントエンドセットアップ
cd frontend
npm install
npm run dev

# バックエンドセットアップ
cd backend
npm install
npm run build

# Terraformセットアップ
cd terraform
terraform init
terraform plan
terraform apply
```

## Environment Variables

### Frontend (.env)
```
VITE_API_GATEWAY_URL=https://api.example.com
VITE_WEBSOCKET_URL=wss://ws.example.com
```

### Backend (Lambda環境変数)
```
DYNAMODB_ROOMS_TABLE=五-bomber-rooms
DYNAMODB_SESSIONS_TABLE=five-bomber-sessions
S3_QUESTIONS_BUCKET=five-bomber-questions
CORS_ORIGIN=https://example.com
```

## Port Configuration

### Local Development
- **Frontend**: `5173` (Vite default)
- **Backend API** (ローカルエミュレート): `3000`
- **WebSocket** (ローカルエミュレート): `3001`

## Testing Strategy

### Frontend
- **Unit Tests**: React Testing Library + Jest
- **E2E Tests**: Playwright (予定)

### Backend
- **Unit Tests**: Jest + AWS SDK Mocks
- **Integration Tests**: LocalStack (ローカルAWSエミュレート)

## Security Considerations

### Authentication (将来拡張)
- AWS Cognito統合を検討

### Data Protection
- 正解データをバックエンドで秘匿
- DynamoDB暗号化（at-rest）
- HTTPS/WSS通信（in-transit）

### API Rate Limiting
- API Gateway スロットリング設定
- WebSocket接続数制限