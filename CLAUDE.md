# Claude Code Spec-Driven Development

Kiro-style Spec Driven Development implementation using claude code slash commands, hooks and agents.

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`
- Commands: `.claude/commands/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- `five-bomber-webapp`: ネプリーグのファイブボンバーをWebアプリ化。マルチチーム対応のリアルタイムゲーム
- Use `/kiro:spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, but generate responses in Japanese (思考は英語、回答の生成は日本語で行うように)

### Error Resolution Strategy
エラーが発生した場合、以下の段階的アプローチで解決する：

1. **初回試行**: エラーメッセージから原因を推測して修正を試みる
2. **2回目の試行**: 別のアプローチで修正を試みる
3. **3回目以降（デバッグモード）**:
   - 対象箇所にdebug用の標準出力（`console.log`等）を追加
   - 実際の値や実行フローを確認してデバッグ
   - 原因を特定して修正
   - **重要**: デバッグ用の標準出力を削除してクリーンな状態に戻す

### Git Workflow (個人開発)
- **mainブランチへの直接push禁止**: 必ずfeatureブランチを作成してPR経由でマージ
- **レビュワー**: 人間（開発者）がレビューを実施。PRはレビュー承認後にマージ
- **ブランチ命名規則**: IaCリポジトリ（hima-five-bomber-infrastructure）と統一
  - `feature/task-X.X-description`: タスクベースの機能実装（例: `feature/task-3.1-room-creation`）
  - `feature/description`: 汎用的な機能追加（例: `feature/add-eslint-config`）
  - `fix/issue-name`: バグ修正（例: `fix/websocket-reconnection`）
  - `docs/description`: ドキュメント更新（例: `docs/update-readme`）
- **PRマージ後**: featureブランチは削除可能
- **AI's Role**: PRを作成するところまで。マージは人間のレビュー承認後に実施

## Workflow

### Phase 0: Steering (Optional)
`/kiro:steering` - Create/update steering documents
`/kiro:steering-custom` - Create custom steering for specialized contexts

Note: Optional for new features or small additions. You can proceed directly to spec-init.

### Phase 1: Specification Creation
1. `/kiro:spec-init [detailed description]` - Initialize spec with detailed project description
2. `/kiro:spec-requirements [feature]` - Generate requirements document
3. `/kiro:spec-design [feature]` - Interactive: "Have you reviewed requirements.md? [y/N]"
4. `/kiro:spec-tasks [feature]` - Interactive: Confirms both requirements and design review

### Phase 2: Progress Tracking
`/kiro:spec-status [feature]` - Check current progress and phases

## Development Rules
1. **Consider steering**: Run `/kiro:steering` before major development (optional for new features)
2. **Follow 3-phase approval workflow**: Requirements → Design → Tasks → Implementation
3. **Approval required**: Each phase requires human review (interactive prompt or manual)
4. **No skipping phases**: Design requires approved requirements; Tasks require approved design
5. **Update task status**: Mark tasks as completed when working on them
6. **Keep steering current**: Run `/kiro:steering` after significant changes
7. **Check spec compliance**: Use `/kiro:spec-status` to verify alignment

## Steering Configuration

### Current Steering Files
Managed by `/kiro:steering` command. Updates here reflect command changes.

### Active Steering Files
- `product.md`: ✅ Always included - Product context and business objectives
- `tech.md`: ✅ Always included - Technology stack and architectural decisions (ハイブリッドアプローチ: バックエンド判定)
- `structure.md`: ✅ Always included - File organization and code patterns

### Custom Steering Files
<!-- Added by /kiro:steering-custom command -->
<!-- Format:
- `filename.md`: Mode - Pattern(s) - Description
  Mode: Always|Conditional|Manual
  Pattern: File patterns for Conditional mode
-->

### Inclusion Modes
- **Always**: Loaded in every interaction (default)
- **Conditional**: Loaded for specific file patterns (e.g., "*.test.js")
- **Manual**: Reference with `@filename.md` syntax

