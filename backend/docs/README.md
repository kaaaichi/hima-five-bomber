# Five Bomber Web App - API仕様書

## 概要

本ディレクトリには、Five Bomber Web AppのAPI仕様書が含まれています。

## OpenAPI仕様書

### ファイル
- [`openapi.yaml`](./openapi.yaml) - OpenAPI 3.0.3形式のAPI仕様書

### 閲覧方法

#### 1. Swagger UIでの閲覧（推奨）

オンラインのSwagger Editorで閲覧：
1. [Swagger Editor](https://editor.swagger.io/)にアクセス
2. `openapi.yaml`の内容をコピー＆ペースト

#### 2. VS Codeでの閲覧

VS Code拡張機能を使用：
1. [OpenAPI (Swagger) Editor](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi)をインストール
2. `openapi.yaml`を開く
3. プレビューを表示

#### 3. コマンドラインでの検証

```bash
# Swagger CLIのインストール
npm install -g @apidevtools/swagger-cli

# 仕様書のバリデーション
swagger-cli validate openapi.yaml
```

## API概要

### REST API

#### ルーム管理 (Rooms)
- `POST /rooms` - ルーム作成
- `GET /rooms/{roomId}` - ルーム情報取得
- `POST /rooms/{roomId}/join` - ルーム参加
- `DELETE /rooms/{roomId}/players/{playerId}` - ルーム退出

#### 問題管理 (Questions)
- `GET /questions` - 問題一覧取得
- `POST /questions` - 問題作成
- `GET /questions/{questionId}` - 問題取得
- `PUT /questions/{questionId}` - 問題更新
- `DELETE /questions/{questionId}` - 問題削除

### WebSocket API

WebSocket APIの詳細は、別途WebSocket仕様書を参照してください。

主なイベント：
- `connect` - WebSocket接続確立
- `disconnect` - WebSocket切断
- `submitAnswer` - 回答送信
- `questionStart` - 問題開始
- `answerResult` - 正誤判定結果
- `rankingUpdate` - ランキング更新
- `gameOver` - ゲーム終了

## エラーレスポンス

全てのエラーレスポンスは以下の形式で返されます：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      "field": "詳細情報（オプション）"
    }
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| `MISSING_BODY` | 400 | リクエストボディが欠如 |
| `VALIDATION_ERROR` | 400 | バリデーションエラー |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `ROOM_FULL` | 409 | ルームが満員 |
| `DATABASE_ERROR` | 500 | データベースエラー |
| `INTERNAL_ERROR` | 500 | 内部サーバーエラー |

## セキュリティ

### 正解データの秘匿

問題配信時、正解データ（`answers`、`acceptableVariations`）はクライアントに送信されません。
正誤判定は必ずバックエンドで実行されます。

### CORS設定

- `Access-Control-Allow-Origin: *`（開発環境）
- 本番環境では特定のドメインに制限予定

### レート制限

API Gatewayでスロットリング設定を適用：
- リクエスト数制限: 1000リクエスト/秒（予定）
- WebSocket接続数制限: 5000接続（予定）

## 更新履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|----------|
| 1.0.0 | 2025-10-21 | 初版作成（タスク3.1: ルーム作成機能） |
