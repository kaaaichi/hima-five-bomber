# 問題データ

## 概要

このディレクトリには、ファイブボンバーゲームで使用する問題データ（JSON形式）が格納されています。

## ファイル構造

```
data/
├── questions.json      # 問題データ本体
└── README.md          # このファイル
```

## questions.json のスキーマ

```typescript
interface Question {
  id: string;                          // 問題ID（ユニーク）
  question: string;                    // 問題文
  answers: string[];                   // 正解リスト（5つ以上）
  acceptableVariations: {              // 表記ゆれ辞書
    [answer: string]: string[];        // 正解ごとの許容表記
  };
  category: string;                    // カテゴリ（地理、一般常識、スポーツ等）
  difficulty: 'easy' | 'medium' | 'hard';  // 難易度
  createdAt: number;                   // 作成日時（Unix timestamp）
  updatedAt: number;                   // 更新日時（Unix timestamp）
}
```

## S3へのアップロード

### 手動アップロード

```bash
# IaCリポジトリでS3バケット名を確認
cd ../hima-five-bomber-infrastructure
terraform output questions_bucket_name

# 問題データをアップロード
aws s3 cp data/questions.json s3://<bucket-name>/questions.json
```

### GitHub Actions経由（推奨）

PR #20のマージ後、GitHub Actionsが自動的に問題データをS3にアップロードします。

## 問題データの追加

1. `questions.json` の `questions` 配列に新しい問題を追加
2. 必須フィールドを全て記入：
   - `id`: ユニークなID（例: q011, q012...）
   - `question`: 問題文
   - `answers`: 正解リスト（最低5つ）
   - `acceptableVariations`: 表記ゆれ辞書
   - `category`: カテゴリ
   - `difficulty`: easy/medium/hard
   - `createdAt`, `updatedAt`: 現在のUnix timestamp

3. JSONの妥当性を確認：
   ```bash
   cat data/questions.json | jq .
   ```

4. コミット・プッシュ・PR作成

## 表記ゆれの設定

`acceptableVariations` は、正解ごとに許容される表記のバリエーションを定義します。

### 例

```json
{
  "answers": ["東京", "Tokyo"],
  "acceptableVariations": {
    "東京": ["とうきょう", "トウキョウ", "Tokyo", "tokyo"],
    "Tokyo": ["tokyo", "TOKYO", "東京", "とうきょう"]
  }
}
```

バックエンドの正誤判定では、以下の正規化処理が実行されます：
- 全角→半角変換
- ひらがな→カタカナ変換
- 前後の空白トリム
- 大文字→小文字変換（アルファベット）

## セキュリティ

- **正解データはクライアントに送信されません**
- 問題文のみがWebSocket経由でクライアントに配信されます
- 正誤判定はバックエンドで実行されます

## データ検証

問題データの妥当性を検証するには：

```bash
cd backend
npm test -- --testPathPattern=QuestionService.test.ts
```
