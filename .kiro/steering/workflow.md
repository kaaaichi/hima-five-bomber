# Development Workflow

## 開発フローの原則

### タスクベース開発
- **1タスク = 1PR**: 各タスク完了ごとにプルリクエストを作成
- **小さく頻繁に**: 大きな機能も小さなタスクに分割し、段階的にマージ
- **独立性**: 各タスクは可能な限り独立して動作する状態で完了させる

### テスト駆動開発（TDD）

**必須ルール**:

- **ファイル修正時**: 該当ファイルのユニットテストを必ず実行し、成功することを確認する
- **新規ファイル作成時**: ユニットテストを先に作成してから実装する（RED → GREEN → REFACTOR）

**テスト実行コマンド**:

```bash
# 特定のテストファイルのみ実行
npm test -- <TestFileName>.test.ts

# 例: GameServiceのテストを実行
npm test -- GameService.test.ts

# 全テスト実行（コミット前に必ず実行）
npm test
```

**テスト実行のタイミング**:

1. **ファイル修正後**: 該当ファイルのテストを即座に実行
2. **リファクタリング後**: 影響を受けるテストをすべて実行
3. **コミット前**: 全テストを実行して回帰がないことを確認
4. **PR作成前**: 全テストがパスすることを最終確認

**テスト失敗時の対応**:

- テストが失敗した場合、実装を修正してテストをパスさせる
- テストが不適切な場合のみ、テストを修正する
- **テストを削除することは禁止**（例外: 仕様変更により不要になった場合のみ）

## ブランチ戦略

### ブランチ命名規則
- `feature/task-X.X-description`: タスクベースの機能実装
  - 例: `feature/task-3.4-room-creation-ui`
- `feature/description`: 汎用的な機能追加
- `fix/issue-name`: バグ修正
- `docs/description`: ドキュメント更新

### ブランチ運用
- **mainブランチへの直接push禁止**: 必ずfeatureブランチ経由
- **mainブランチから分岐**: 新しいタスクは常にmainから作成
- **PRマージ後のクリーンアップ**: マージ後はfeatureブランチを削除

## デプロイメント戦略

### セマンティックバージョニング

本プロジェクトでは[セマンティックバージョニング (SemVer)](https://semver.org/)を採用します。

#### バージョン番号の形式

`vMAJOR.MINOR.PATCH` (例: `v1.2.3`)

- **MAJOR**: 後方互換性のない破壊的変更
- **MINOR**: 後方互換性のある機能追加
- **PATCH**: 後方互換性のあるバグ修正

#### バージョニングルール

1. **初期開発**: `v0.x.x` で開始
   - 初回リリース: `v0.1.0`
   - 機能追加: MINOR をインクリメント (`v0.2.0`, `v0.3.0`, ...)
   - バグ修正: PATCH をインクリメント (`v0.1.1`, `v0.1.2`, ...)

2. **プロダクションリリース後**: `v1.0.0` から開始
   - 破壊的変更: MAJOR をインクリメント (`v2.0.0`)
   - 機能追加: MINOR をインクリメント (`v1.1.0`)
   - バグ修正: PATCH をインクリメント (`v1.0.1`)

### デプロイフロー

#### 通常のデプロイ（推奨）

1. **PRマージ後**: mainブランチにマージ
2. **バージョンタグ作成**:

   ```bash
   # 最新のタグを確認
   git tag -l "v*" --sort=-v:refname | head -5

   # 新しいバージョンタグを作成
   git tag v0.2.0
   git push origin v0.2.0
   ```

3. **自動デプロイ**: タグpush時に`deploy-with-approval.yml`が自動実行
4. **承認**: production-approval環境で手動承認
5. **デプロイ完了**: フロントエンド（S3 + CloudFront）とバックエンド（Lambda via ECR）が更新

#### 緊急デプロイ（手動トリガー）

緊急時のみ`deploy-app-prd.yml`を手動実行:

1. GitHub Actions > Deploy Application (Production) > Run workflow
2. バージョン番号を入力 (例: `v0.2.1`)
3. 実行

### Dockerイメージタグ戦略

各Dockerイメージには**2つのタグ**を付与:

1. **セマンティックバージョン**: `v1.2.3` - 明示的なバージョン管理
2. **コミットハッシュ**: `7482d43` - トレーサビリティ確保

**`latest`タグは使用しない**: タグの重複エラーを防ぐため、`latest`タグは廃止

### バージョン確認方法

```bash
# ECRの全バージョンを確認
aws ecr describe-images \
  --repository-name hima-five-bomber-prd-lambda \
  --region ap-northeast-1 \
  --query 'imageDetails[*].[imageTags,imagePushedAt]' \
  --output table

# 現在デプロイされているバージョンを確認
aws lambda get-function \
  --function-name hima-five-bomber-prd-rest-api \
  --query 'Code.ImageUri' \
  --output text
```
