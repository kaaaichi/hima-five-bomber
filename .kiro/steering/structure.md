# Project Structure

## Root Directory Organization

```
hima-five-bomber/
├── .claude/                 # Claude Code設定
│   └── commands/           # カスタムスラッシュコマンド
├── .kiro/                  # Spec-Driven Development
│   ├── specs/             # 機能仕様書
│   └── steering/          # プロジェクト全体のガイドライン
├── frontend/              # Reactフロントエンド
├── backend/               # Lambda関数群
├── terraform/             # Terraform (IaC)
├── shared/                # 共通型定義・ユーティリティ
├── .github/               # GitHub Actions CI/CD
└── CLAUDE.md              # Claude Codeプロジェクト設定
```

## Subdirectory Structures

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── components/        # Reactコンポーネント
│   │   ├── game/         # ゲーム関連コンポーネント
│   │   │   ├── GameBoard.tsx
│   │   │   ├── Timer.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   ├── BombExplosion.tsx
│   │   │   └── Scoreboard.tsx
│   │   ├── room/         # ルーム管理
│   │   │   ├── RoomLobby.tsx
│   │   │   ├── RoomList.tsx
│   │   │   └── PlayerList.tsx
│   │   ├── admin/        # 管理画面
│   │   │   ├── QuestionEditor.tsx
│   │   │   └── QuestionList.tsx
│   │   └── common/       # 共通UIコンポーネント
│   │       ├── Button.tsx
│   │       ├── Modal.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/            # カスタムReact Hooks
│   │   ├── useWebSocket.ts
│   │   ├── useGameState.ts
│   │   └── useTimer.ts
│   ├── services/         # API・WebSocket通信
│   │   ├── api.ts
│   │   ├── websocket.ts
│   │   └── questionService.ts
│   ├── types/            # TypeScript型定義
│   │   ├── game.ts
│   │   ├── room.ts
│   │   └── question.ts
│   ├── utils/            # ユーティリティ関数
│   │   ├── validation.ts
│   │   └── formatting.ts
│   ├── styles/           # Tailwind CSSカスタマイズ
│   ├── App.tsx           # ルートコンポーネント
│   └── main.tsx          # エントリーポイント
├── public/               # 静的アセット
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── handlers/         # Lambda関数ハンドラー
│   │   ├── rest/        # REST APIハンドラー
│   │   │   ├── rooms.ts
│   │   │   ├── questions.ts
│   │   │   └── rankings.ts
│   │   └── websocket/   # WebSocketハンドラー
│   │       ├── connect.ts
│   │       ├── disconnect.ts
│   │       ├── submitAnswer.ts
│   │       └── syncGameState.ts
│   ├── services/        # ビジネスロジック
│   │   ├── gameService.ts
│   │   ├── answerValidator.ts  # 正誤判定・表記ゆれ処理
│   │   ├── scoreCalculator.ts
│   │   └── questionService.ts
│   ├── repositories/    # DynamoDBアクセス層
│   │   ├── roomRepository.ts
│   │   ├── sessionRepository.ts
│   │   └── scoreRepository.ts
│   ├── models/          # データモデル
│   │   ├── Room.ts
│   │   ├── GameSession.ts
│   │   ├── Player.ts
│   │   └── Question.ts
│   ├── utils/           # ユーティリティ
│   │   ├── dynamodb.ts
│   │   ├── s3.ts
│   │   └── websocket.ts
│   └── types/           # 型定義
├── tests/               # テスト
│   ├── unit/
│   └── integration/
├── package.json
└── tsconfig.json
```

### Terraform (`terraform/`)

```
terraform/
├── modules/
│   ├── frontend/        # S3 + CloudFront
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── backend/         # Lambda + API Gateway
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/        # DynamoDB
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── monitoring/      # CloudWatch
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
├── environments/
│   └── prd/             # 本番環境（初期構成）
│       ├── main.tf
│       └── terraform.tfvars
│   # 将来追加予定: dev/, stg/
├── main.tf              # ルートモジュール
├── variables.tf         # 変数定義
├── outputs.tf           # 出力値
├── backend.tf           # State管理設定
└── versions.tf          # Provider/Terraformバージョン
```

### Shared (`shared/`)

```
shared/
├── types/               # 共通型定義（frontend/backendで共有）
│   ├── api.ts
│   ├── websocket.ts
│   └── models.ts
└── constants/          # 定数定義
    ├── gameRules.ts   # ゲームルール定数
    └── scoreRules.ts  # スコアリング定数
```

### GitHub Actions (`.github/`)

```
.github/
└── workflows/
    ├── ci.yml          # Lint + Test
    └── deploy-prd.yml  # 本番環境デプロイ
    # 将来追加予定: deploy-dev.yml, deploy-stg.yml
```

## Code Organization Patterns

### Component Structure (React)
```typescript
// コンポーネントファイル構成
export interface ComponentProps {
  // Props型定義
}

export const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  // イベントハンドラー
  // レンダリング
  return <div>...</div>;
};
```

### Lambda Handler Pattern
```typescript
// Lambda関数の標準構造
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // 入力バリデーション
    // ビジネスロジック呼び出し
    // レスポンス構築
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    // エラーハンドリング
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

### Service Layer Pattern
```typescript
// services配下のビジネスロジック
export class GameService {
  constructor(
    private roomRepo: RoomRepository,
    private sessionRepo: SessionRepository
  ) {}

  async validateAnswer(
    sessionId: string,
    answer: string
  ): Promise<ValidationResult> {
    // ビジネスロジック実装
  }
}
```

## File Naming Conventions

### General Rules
- **PascalCase**: Reactコンポーネント (`GameBoard.tsx`)
- **camelCase**: 関数・変数・一般TypeScriptファイル (`gameService.ts`)
- **kebab-case**: CDKスタック (`frontend-stack.ts`)
- **UPPER_SNAKE_CASE**: 環境変数・定数

### Specific Patterns
- **Reactコンポーネント**: `ComponentName.tsx`
- **カスタムフック**: `useHookName.ts`
- **型定義ファイル**: `modelName.ts` (型名はPascalCase)
- **Lambdaハンドラー**: `functionName.ts`
- **テストファイル**: `*.test.ts` または `*.spec.ts`

## Import Organization

### Import Order (ESLint enforced)
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { DynamoDB } from 'aws-sdk';

// 2. 内部モジュール（絶対パス）
import { GameService } from '@/services/gameService';
import { Room } from '@/models/Room';

// 3. 相対パス
import { Button } from '../common/Button';
import { formatScore } from './utils';

// 4. 型のみのインポート
import type { GameState } from '@/types/game';
```

### Path Aliases
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"],
      "@services/*": ["./src/services/*"],
      "@types/*": ["./src/types/*"]
    }
  }
}
```

## Key Architectural Principles

### 1. 関心の分離 (Separation of Concerns)
- **Presentation Layer**: Reactコンポーネント（UIのみ）
- **Business Logic Layer**: Services（ビジネスルール）
- **Data Access Layer**: Repositories（データ永続化）

### 2. 型安全性 (Type Safety)
- すべてのファイルでTypeScriptを使用
- `any`型の使用を最小限に
- 共通型定義は`shared/types`で管理

### 3. 再利用性 (Reusability)
- 共通UIコンポーネントは`components/common`に集約
- ユーティリティ関数は`utils/`で共有
- ビジネスロジックはServiceクラスで抽象化

### 4. テスタビリティ (Testability)
- 依存性注入（DI）パターンの活用
- Mockしやすいインターフェース設計
- Pure Functionsの優先

### 5. スケーラビリティ (Scalability)
- Lambda関数は単一責任原則（SRP）
- DynamoDB設計はアクセスパターン最適化
- フロントエンドはコード分割（Lazy Loading）

### 6. セキュリティファースト
- 正解データのバックエンド秘匿
- 入力バリデーションの徹底
- AWS IAMロール最小権限原則

### 7. 保守性 (Maintainability)
- 一貫した命名規則
- 包括的なコメント（複雑なロジックのみ）
- ドキュメント化されたAPI仕様