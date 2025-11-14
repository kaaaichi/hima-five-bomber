# Five Bomber Webapp - Testing Guide

## デプロイ環境情報

### フロントエンド
- **URL**: https://d3j6o2ajbykkme.cloudfront.net
- **ホスティング**: AWS CloudFront + S3
- **最終デプロイ**: 2025-11-14

### バックエンド
- **API Gateway URL**: https://4njdapqlte.execute-api.ap-northeast-1.amazonaws.com/prd
- **Lambda関数**: hima-five-bomber-prd-rooms-handler
- **DynamoDB**: hima-five-bomber-prd-rooms
- **Region**: ap-northeast-1 (東京)

## 実装済み機能（Task 3.1-3.6）

### ✅ バックエンドAPI
1. **POST /rooms** - ルーム作成
2. **POST /rooms/:roomId/join** - ルーム参加

### ✅ フロントエンドUI
1. **ホーム画面** - ルーム作成/参加の選択
2. **ルーム作成画面** - ホスト名入力
3. **ルームロビー画面** - プレイヤーリスト表示、ゲーム開始ボタン

## バックエンドAPI動作確認結果

### 1. ルーム作成API（POST /rooms）

**テスト実施**: 2025-11-14 15:20
**結果**: ✅ 成功

```bash
# リクエスト
POST /rooms
Content-Type: application/json
{"hostName":"E2E Test User"}

# レスポンス
HTTP 200 OK
{
  "roomId": "svcmhm",
  "hostId": "player-03ebd23a19109e57ecc2b739b2002c04"
}
```

### 2. ルーム参加API（POST /rooms/:roomId/join）

**テスト実施**: 2025-11-14 15:22
**結果**: ✅ 成功

```bash
# リクエスト
POST /rooms/svcmhm/join
Content-Type: application/json
{"playerName":"Player2"}

# レスポンス
HTTP 200 OK
{
  "room": {
    "roomId": "svcmhm",
    "hostId": "player-03ebd23a19109e57ecc2b739b2002c04",
    "players": [
      {
        "name": "E2E Test User",
        "joinedAt": 1763102778003,
        "playerId": "player-03ebd23a19109e57ecc2b739b2002c04"
      },
      {
        "name": "Player2",
        "joinedAt": 1763102815346,
        "playerId": "player-e0a0ce1f55753d081f5c7d94bc44f6a9"
      }
    ],
    "status": "waiting",
    "createdAt": 1763102778003
  },
  "playerId": "player-e0a0ce1f55753d081f5c7d94bc44f6a9"
}
```

### 3. DynamoDBデータ確認

**テーブル**: hima-five-bomber-prd-rooms
**確認結果**: ✅ データ正常保存

- roomId: svcmhm
- hostId: player-03ebd23a19109e57ecc2b739b2002c04
- players: 2名（E2E Test User, Player2）
- status: waiting
- createdAt/updatedAt: タイムスタンプ正常

## フロントエンド動作確認手順

### 前提条件
- モダンブラウザ（Chrome、Firefox、Safari、Edge最新版）
- インターネット接続

### テストシナリオ1: ルーム作成フロー

1. **ホーム画面にアクセス**
   ```
   https://d3j6o2ajbykkme.cloudfront.net
   ```

2. **「ルームを作成」ボタンをクリック**
   - ルーム作成画面に遷移することを確認

3. **ホスト名を入力**
   - 例: "テストユーザー1"
   - 入力フィールドが正常に動作することを確認

4. **「作成」ボタンをクリック**
   - API呼び出しが実行される（ブラウザDevToolsのNetworkタブで確認可能）
   - ルームIDが生成される
   - ルームロビー画面に遷移する

5. **ルームロビー画面の確認**
   - ルームIDが表示される
   - 自分の名前が「ホスト」マークと共に表示される
   - 「ゲーム開始」ボタンが表示される（ホストのみ）
   - プレイヤーリストに自分が表示される

### テストシナリオ2: ルーム参加フロー（複数タブ使用）

1. **タブ1でルーム作成**
   - 上記のテストシナリオ1を実施
   - ルームIDをコピー（例: "abc123"）

2. **新しいタブ2を開く**
   ```
   https://d3j6o2ajbykkme.cloudfront.net
   ```

3. **「ルームに参加」ボタンをクリック**
   - ルーム参加画面に遷移

4. **ルームIDとプレイヤー名を入力**
   - ルームID: タブ1でコピーしたID
   - プレイヤー名: "テストユーザー2"

5. **「参加」ボタンをクリック**
   - API呼び出しが実行される
   - ルームロビー画面に遷移する

6. **タブ2のルームロビー確認**
   - 2人のプレイヤーが表示される
   - ホストには「ホスト」マークが表示される
   - 自分（非ホスト）には「ゲーム開始」ボタンが表示されない

7. **タブ1に戻って確認**
   - プレイヤーリストに2人が表示される（リアルタイム更新は未実装のため、手動リロードが必要）

### テストシナリオ3: レスポンシブデザイン確認

1. **デスクトップ表示（1920x1080）**
   - レイアウトが適切に表示される
   - ボタンが十分な大きさで表示される

2. **タブレット表示（768x1024）**
   - ブラウザの開発者ツールでビューポート変更
   - レイアウトが縦並びに切り替わる
   - テキストが読みやすいサイズで表示される

3. **スマートフォン表示（375x667）**
   - モバイルレイアウトに切り替わる
   - タップ領域が十分な大きさ（44px以上）
   - スクロールなしで主要UI要素が表示される

## 既知の制限事項

### 未実装機能（Task 3.7以降で実装予定）

1. **ルーム退出機能**
   - DELETE /rooms/:roomId/leave エンドポイント
   - 「ルームを退出」ボタンの動作

2. **リアルタイム同期（WebSocket）**
   - プレイヤー参加時の自動更新
   - 現在は手動リロードが必要

3. **ゲーム開始機能**
   - 「ゲーム開始」ボタンの実際の動作
   - ゲームプレイ画面への遷移

### デプロイ課題

- **Docker Base Image互換性問題**: 新しいコード変更のデプロイが一時的にブロック
- **詳細**: [DEPLOYMENT_ISSUE.md](./DEPLOYMENT_ISSUE.md)を参照

## トラブルシューティング

### API呼び出しエラー

**症状**: ルーム作成/参加時にエラーが表示される

**確認事項**:
1. ブラウザのDevTools → Networkタブでリクエスト確認
2. CORSエラーの有無を確認
3. API GatewayのURLが正しいか確認（環境変数）

**対処法**:
```bash
# CloudWatch Logsでエラー確認
aws logs tail /aws/lambda/hima-five-bomber-prd-rooms-handler --follow
```

### フロントエンドが表示されない

**症状**: CloudFront URLにアクセスしても白い画面

**確認事項**:
1. ブラウザのコンソールでエラー確認
2. CloudFrontキャッシュのクリア
3. S3バケットにファイルが正しくアップロードされているか確認

**対処法**:
```bash
# CloudFrontキャッシュ無効化
aws cloudfront create-invalidation \
  --distribution-id E2YNOBEXAMPLE \
  --paths "/*"
```

## テスト報告テンプレート

### バグ報告

```markdown
## バグ報告

**日時**: YYYY-MM-DD HH:MM
**環境**: Chrome 120 / macOS Sonoma
**再現手順**:
1.
2.
3.

**期待される動作**:


**実際の動作**:


**スクリーンショット**:
（添付）

**追加情報**:
- ブラウザコンソールエラー:
- Network通信:
```

## 次のマイルストーン

### Task 4: WebSocket通信とリアルタイム同期
- プレイヤー参加時の自動更新
- リアルタイムプレイヤーリスト同期

### Task 5: ゲームプレイ機能
- ゲーム開始処理
- 問題表示
- 回答入力UI

---

**最終更新**: 2025-11-14 15:30
**テスト実施者**: Claude (AI Assistant)
