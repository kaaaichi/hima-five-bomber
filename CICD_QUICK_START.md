# CI/CD Quick Start Guide（簡易版）

## 概要

GitHub Actions用のOIDC IAMロールがまだ作成されていないため、開発段階では**AWS Access Keys**を使用した簡易版CI/CDを設定します。

⚠️ **注意**: Access Keysは本番環境では推奨されません。将来的にOIDCベースの認証に移行することを推奨します。

---

## ステップ1: GitHub Secretsの設定

以下の値をGitHub Secretsに設定してください。

### 必須のSecrets

#### 1. AWS認証情報（簡易版）

```bash
AWS_ACCESS_KEY_ID=<あなたのAWS Access Key>
AWS_SECRET_ACCESS_KEY=<あなたのAWS Secret Access Key>
AWS_REGION=ap-northeast-1
```

**取得方法**:

AWS IAMユーザーのAccess Keyを使用します。既存のユーザーがあればそれを使用するか、新規作成します。

```bash
# 既存のAccess Keyを確認（推奨しません。新規作成してください）
# または、AWS ConsoleでIAM > Users > Security credentials > Create access key
```

**必要な権限**:
- S3への読み書き
- CloudFront Invalidation
- ECRへのpush
- Lambda関数の更新

#### 2. AWSリソース情報

```bash
AWS_ACCOUNT_ID=245705159423
S3_BUCKET_NAME=hima-five-bomber-prd-frontend
CLOUDFRONT_DISTRIBUTION_ID=E1DAGKQBBRAOQV
```

#### 3. アプリケーション環境変数

```bash
VITE_API_GATEWAY_URL=https://4njdapqlte.execute-api.ap-northeast-1.amazonaws.com/prd
```

---

## ステップ2: ワークフローファイルの修正

既存のワークフローファイルはOIDC認証を使用しているため、Access Key認証に変更します。

### 修正が必要なファイル

1. `.github/workflows/deploy-app-prd.yml`
2. `.github/workflows/deploy-with-approval.yml`

### 修正内容

**変更前（OIDC）**:
```yaml
- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
    aws-region: ${{ env.AWS_REGION }}
```

**変更後（Access Keys）**:
```yaml
- name: Configure AWS credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: ${{ env.AWS_REGION }}
```

---

## ステップ3: GitHub Secretsの登録手順

### 3.1 GitHubリポジトリを開く

1. https://github.com/<あなたのユーザー名>/hima-five-bomber
2. **Settings** タブをクリック

### 3.2 Secrets画面に移動

1. 左サイドバーの **Secrets and variables** をクリック
2. **Actions** をクリック

### 3.3 Secretsを1つずつ追加

**AWS認証情報**:
- `AWS_ACCESS_KEY_ID`: あなたのAccess Key
- `AWS_SECRET_ACCESS_KEY`: あなたのSecret Access Key
- `AWS_REGION`: `ap-northeast-1`

**AWSリソース情報**:
- `AWS_ACCOUNT_ID`: `245705159423`
- `S3_BUCKET_NAME`: `hima-five-bomber-prd-frontend`
- `CLOUDFRONT_DISTRIBUTION_ID`: `E1DAGKQBBRAOQV`

**アプリケーション設定**:
- `VITE_API_GATEWAY_URL`: `https://4njdapqlte.execute-api.ap-northeast-1.amazonaws.com/prd`

各Secretについて:
1. **New repository secret** をクリック
2. **Name** に上記のSecret名を入力
3. **Secret** に対応する値を貼り付け
4. **Add secret** をクリック

---

## ステップ4: ワークフローファイルの更新

簡易版の認証方式に対応するため、ワークフローファイルを更新します。

この作業はClaude Codeで実施します。

---

## ステップ5: テストPRの作成

1. **新しいブランチを作成**:
```bash
git checkout -b test/cicd-setup
```

2. **軽微な変更を加える**（例: READMEにコメント追加）

3. **変更をコミット・プッシュ**:
```bash
git add .
git commit -m "test: Verify CI/CD pipeline"
git push origin test/cicd-setup
```

4. **GitHubでPull Requestを作成**

5. **GitHub Actionsの実行を確認**:
   - **Actions** タブで `CI - Lint & Test` と `Build` が自動実行される
   - 緑色のチェックマークが表示されることを確認

---

## ステップ6: デプロイのテスト

### 手動デプロイ（推奨）

1. GitHubリポジトリで **Actions** タブを開く
2. **Deploy Application (Production)** を選択
3. **Run workflow** をクリック
4. ブランチ: `main` を選択
5. **Run workflow** を実行
6. 実行結果を確認

---

## トラブルシューティング

### エラー: "Error: Credentials could not be loaded"

**原因**: AWS Secretsが正しく設定されていない

**解決策**:
1. GitHub Secrets画面で `AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` が設定されているか確認
2. 値にスペースや改行が含まれていないか確認

### エラー: "AccessDenied"

**原因**: IAMユーザーの権限不足

**解決策**:
1. IAMユーザーに以下のポリシーをアタッチ:
   - `AmazonS3FullAccess`（または S3バケットへの限定的なアクセス）
   - `CloudFrontFullAccess`（または Invalidation権限）
   - `AmazonEC2ContainerRegistryFullAccess`
   - Lambda関数更新権限

### Dockerビルドが失敗

**確認**:
- GitHub Actions環境では新しいDockerベースイメージが正常に動作するはず
- ローカルで発生していた `Runtime.InvalidEntrypoint` 問題は解決される

---

## 次のステップ

1. ✅ GitHub Secretsを設定
2. ✅ ワークフローファイルを更新（Access Key認証に変更）
3. ✅ テストPRを作成してCI/CD確認
4. ✅ 手動デプロイで統合ハンドラーをデプロイ
5. 🔄 将来的にOIDC認証に移行（IaCでIAMロール作成後）

---

**作成日**: 2025-11-14
**ステータス**: 準備完了
