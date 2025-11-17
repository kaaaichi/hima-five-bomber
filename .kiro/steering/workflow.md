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

1. **ファイル修正前**: 修正対象ファイルのテストを実行し、既存テストが正しく動作することを確認
2. **ファイル修正後**: 該当ファイルのテストを再度実行し、修正後も成功することを確認
3. **リファクタリング後**: 影響を受けるテストをすべて実行
4. **コミット前**: 全テストを実行して回帰がないことを確認
5. **PR作成前**: 全テストがパスすることを最終確認

**ファイル修正のワークフロー**:

```bash
# 1. 修正前: 既存テストが正しく動作することを確認
npm test -- <TargetFile>.test.ts
# ✅ テストがパスすることを確認

# 2. ファイルを修正

# 3. 修正後: テストを再実行して修正が正しいことを確認
npm test -- <TargetFile>.test.ts
# ✅ テストがパスすることを確認

# 4. コミット前: 全テストを実行して回帰がないことを確認
npm test
# ✅ 全テストがパスすることを確認
```

**テスト失敗時の対応**:

- **修正前のテスト失敗**: 既存の実装またはテストに問題がある。修正前に原因を特定して解決する
- **修正後のテスト失敗**: 修正が不適切。実装を修正してテストをパスさせる
- **テストが不適切な場合**: テストの意図を理解した上で、必要に応じてテストを修正する
- **テストを削除することは禁止**（例外: 仕様変更により不要になった場合のみ）

## コード品質チェック

### PR作成前の必須チェック

プルリクエストを作成する前に、以下のチェックを**必ず実行**してください：

#### 1. Lintチェック

**フロントエンド**:

```bash
cd frontend
npm run lint
```

**バックエンド**:

```bash
cd backend
npm run lint
```

**Lint警告・エラーの対応**:

- ❌ **エラー**: 必ず修正してからPR作成
- ⚠️ **警告（自分が作成したファイル）**: 必ず修正してからPR作成
- ⚠️ **警告（既存ファイル）**: タスクのスコープ外の場合は修正不要（別タスクで対応）

**よくあるLint警告と修正方法**:

1. **未使用のimport**:

   ```typescript
   // ❌ NG
   import { UnusedType } from './types';

   // ✅ OK - 使用していないimportは削除
   ```

2. **未使用の変数**:

   ```typescript
   // ❌ NG
   const unusedVar = 'value';

   // ✅ OK - アンダースコアをプレフィックスに付けて意図的な未使用を明示
   const _unusedVar = 'value';
   ```

3. **any型の使用**:

   ```typescript
   // ❌ NG
   function process(data: any) { }

   // ✅ OK - 適切な型を指定
   function process(data: DataType) { }
   // または
   function process(data: unknown) { }
   ```

#### 2. テスト実行

```bash
# フロントエンド
cd frontend
npm test

# バックエンド
cd backend
npm test
```

- ✅ **全テストがパスすること**
- ⚠️ スキップされているテストがある場合は、理由をコメントで明記すること

#### 3. ビルドチェック

```bash
# フロントエンド
cd frontend
npm run build

# バックエンド
cd backend
npm run build
```

- ✅ **TypeScriptコンパイルエラーがないこと**
- ✅ **ビルドが成功すること**

#### 4. PR作成前チェックリスト

プルリクエストを作成する前に、以下を確認してください：

- [ ] Lintチェックをパスしている（自分が作成したファイルの警告を解消済み）
- [ ] 全テストがパスしている
- [ ] ビルドが成功している
- [ ] コミットメッセージが適切である（日本語、簡潔で明確）
- [ ] tasks.mdが更新されている（該当タスクを完了としてマーク）
- [ ] 変更内容が1タスク分に限定されている

### PR作成時のワークフロー

```bash
# 1. Lintチェック
npm run lint
# ⚠️ 警告がある場合は修正

# 2. テスト実行
npm test
# ✅ 全テストがパス

# 3. ビルド確認
npm run build
# ✅ ビルド成功

# 4. 変更をコミット
git add .
git commit -m 'feat: タスクX.X の実装'

# 5. リモートにプッシュ
git push origin feature/task-X.X-description

# 6. PRを作成
gh pr create --title 'feat: タスクX.X の実装' --body '...'
```

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
