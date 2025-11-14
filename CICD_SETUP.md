# CI/CD Pipeline Setup Guide

## Overview

GitHub Actionsを使用したCI/CDパイプラインが実装されています。このガイドでは、パイプラインを有効化するために必要な設定手順を説明します。

## ワークフローの概要

### 1. CI - Lint & Test (ci.yml)
**トリガー**: Pull Request、mainブランチへのpush
**処理内容**:
- フロントエンドのESLint + テスト実行
- バックエンドのESLint + テスト実行

### 2. Build (build.yml)
**トリガー**: Pull Request、mainブランチへのpush
**処理内容**:
- フロントエンドのViteビルド
- バックエンドのTypeScriptビルド
- Dockerイメージのビルド（pushなし）
- ビルド成果物のアーティファクト保存

### 3. Deploy Application (deploy-app-prd.yml)
**トリガー**: 手動実行、v*.*.* タグpush
**処理内容**:
- フロントエンドをS3にデプロイ
- DockerイメージをECRにpush
- Lambda関数の更新
- CloudFrontキャッシュ無効化

### 4. Deploy with Approval (deploy-with-approval.yml)
**トリガー**: mainブランチへのpush
**処理内容**:
- ビルド実行
- 手動承認待ち
- 承認後、本番環境へデプロイ

---

## 必要なGitHub Secrets

以下のSecretsをGitHubリポジトリに設定する必要があります。

### AWS関連

#### 1. AWS_DEPLOY_ROLE_ARN (必須)
**説明**: GitHub ActionsがAWSリソースにアクセスするためのIAMロールARN

**取得方法**:
```bash
# IaCリポジトリで確認
cd ../hima-five-bomber-infrastructure
terraform output github_actions_role_arn
```

**例**:
```
arn:aws:iam::245705159423:role/hima-five-bomber-prd-github-actions-role
```

#### 2. AWS_ACCOUNT_ID (必須)
**説明**: AWSアカウントID

**取得方法**:
```bash
aws sts get-caller-identity --query Account --output text
```

**例**:
```
245705159423
```

#### 3. S3_BUCKET_NAME (必須)
**説明**: フロントエンドをデプロイするS3バケット名

**取得方法**:
```bash
cd ../hima-five-bomber-infrastructure
terraform output s3_bucket_name
```

**例**:
```
hima-five-bomber-prd-frontend
```

#### 4. CLOUDFRONT_DISTRIBUTION_ID (必須)
**説明**: CloudFrontディストリビューションID

**取得方法**:
```bash
cd ../hima-five-bomber-infrastructure
terraform output cloudfront_distribution_id
```

**または**:
```bash
aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(DomainName, 'd3j6o2ajbykkme')].Id" \
  --output text
```

**例**:
```
E1DAGKQBBRAOQV
```

### アプリケーション環境変数

#### 5. VITE_API_GATEWAY_URL (必須)
**説明**: API GatewayのエンドポイントURL

**取得方法**:
```bash
cd ../hima-five-bomber-infrastructure
terraform output rest_api_url
```

**例**:
```
https://4njdapqlte.execute-api.ap-northeast-1.amazonaws.com/prd
```

#### 6. VITE_WEBSOCKET_URL (今後必要)
**説明**: WebSocket APIのエンドポイントURL

**取得方法**:
```bash
cd ../hima-five-bomber-infrastructure
terraform output websocket_api_url
```

**例**:
```
wss://xxxxx.execute-api.ap-northeast-1.amazonaws.com/prd
```

---

## 必要なGitHub Variables

#### CLOUDFRONT_DOMAIN (オプション)
**説明**: CloudFrontのドメイン名（デプロイ履歴表示用）

**例**:
```
d3j6o2ajbykkme.cloudfront.net
```

---

## GitHub Secretsの設定手順

### ステップ1: GitHubリポジトリにアクセス

1. GitHubで `hima-five-bomber` リポジトリを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Secrets and variables** → **Actions** をクリック

### ステップ2: Secretsを追加

各Secretについて以下を実行:

1. **New repository secret** ボタンをクリック
2. **Name** に上記のSecret名を入力
3. **Secret** に対応する値を入力
4. **Add secret** をクリック

### ステップ3: GitHub Environment設定（承認フロー用）

承認フロー (`deploy-with-approval.yml`) を使用する場合:

1. **Settings** → **Environments** をクリック
2. **New environment** をクリック
3. Environment名: `production-approval`
4. **Required reviewers** にチェック
5. レビュワーとして自分（または承認者）を追加
6. **Save protection rules**

---

## AWS IAMロールの確認

GitHub Actionsが使用するIAMロールに必要な権限:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hima-five-bomber-prd-frontend/*",
        "arn:aws:s3:::hima-five-bomber-prd-frontend"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:GetFunction",
        "lambda:ListFunctions"
      ],
      "Resource": "arn:aws:lambda:ap-northeast-1:*:function:hima-five-bomber-*"
    }
  ]
}
```

---

## CI/CDパイプラインのテスト

### 1. CI/CDの動作確認（Lint & Test）

```bash
# 新しいブランチを作成
git checkout -b test/cicd-pipeline

# 変更をpush
git push origin test/cicd-pipeline

# GitHubでPull Requestを作成
# → ci.yml と build.yml が自動実行される
```

### 2. デプロイワークフローのテスト（手動）

GitHubリポジトリで:
1. **Actions** タブを開く
2. **Deploy Application (Production)** を選択
3. **Run workflow** をクリック
4. mainブランチを選択
5. **Run workflow** を実行

### 3. 承認フロー付きデプロイのテスト

```bash
# mainブランチにマージ
git checkout main
git merge test/cicd-pipeline
git push origin main

# → deploy-with-approval.yml が実行される
# → GitHubで承認待ち状態になる
# → Settings → Environments → production-approval で承認
```

---

## トラブルシューティング

### エラー: "Resource not accessible by integration"

**原因**: GitHub ActionsにOIDC権限が不足

**解決策**:
```yaml
permissions:
  id-token: write  # OIDC用
  contents: read
```

### エラー: "AccessDenied: User is not authorized"

**原因**: IAMロールの権限不足、またはTrust Policyが正しくない

**確認事項**:
1. IaCで作成したIAMロールのARNが正しいか
2. Trust PolicyにGitHub OIDCプロバイダーが含まれているか
3. IAMロールに必要な権限が付与されているか

### エラー: Docker build fails with base image issue

**原因**: ローカルで発生していたDocker base image問題

**解決策**: GitHub Actions環境では新しいbase imageが使用され、この問題は発生しません。

### ビルドは成功するがデプロイが失敗

**確認事項**:
1. すべてのSecretsが正しく設定されているか
2. AWSリソース（S3、ECR、Lambda）が存在するか
3. CloudWatch Logsでエラーメッセージを確認

---

## 次のステップ

1. **GitHub Secretsを設定**: 上記の手順に従ってSecretsを追加
2. **テストPRを作成**: CI/Buildワークフローの動作確認
3. **手動デプロイを実行**: deploy-app-prd.ymlを手動実行
4. **統合ハンドラーをデプロイ**: Docker base image問題が解決され、新しいコードがデプロイされる

---

## 参考情報

- GitHub Actions Docs: https://docs.github.com/en/actions
- AWS OIDC with GitHub Actions: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- Docker Build Push Action: https://github.com/docker/build-push-action

---

**最終更新**: 2025-11-14
**ステータス**: Secrets設定待ち
