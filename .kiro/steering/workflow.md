# Development Workflow

## 開発フローの原則

### タスクベース開発
- **1タスク = 1PR**: 各タスク完了ごとにプルリクエストを作成
- **小さく頻繁に**: 大きな機能も小さなタスクに分割し、段階的にマージ
- **独立性**: 各タスクは可能な限り独立して動作する状態で完了させる

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
