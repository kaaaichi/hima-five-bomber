#!/bin/bash

# GitHub Actions Secrets取得スクリプト
#
# このスクリプトは、CI/CDパイプラインに必要なAWS情報を取得し、
# GitHub Secretsに設定する値を表示します。

set -e

echo "========================================="
echo "GitHub Actions Secrets - 必要な値の取得"
echo "========================================="
echo ""

# カラー設定
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. AWS Account ID
echo -e "${GREEN}1. AWS_ACCOUNT_ID${NC}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Value: $AWS_ACCOUNT_ID"
echo ""

# 2. S3 Bucket Name
echo -e "${GREEN}2. S3_BUCKET_NAME${NC}"
S3_BUCKET_NAME="hima-five-bomber-prd-frontend"
echo "   Value: $S3_BUCKET_NAME"
echo ""

# 3. CloudFront Distribution ID
echo -e "${GREEN}3. CLOUDFRONT_DISTRIBUTION_ID${NC}"
CLOUDFRONT_ID=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(DomainName, 'd3j6o2ajbykkme')].Id" \
  --output text)
echo "   Value: $CLOUDFRONT_ID"
echo ""

# 4. CloudFront Domain
echo -e "${GREEN}4. CLOUDFRONT_DOMAIN (Variable)${NC}"
CLOUDFRONT_DOMAIN=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(DomainName, 'd3j6o2ajbykkme')].DomainName" \
  --output text)
echo "   Value: $CLOUDFRONT_DOMAIN"
echo ""

# 5. API Gateway URL
echo -e "${GREEN}5. VITE_API_GATEWAY_URL${NC}"
API_URL="https://4njdapqlte.execute-api.ap-northeast-1.amazonaws.com/prd"
echo "   Value: $API_URL"
echo ""

# 6. AWS Deploy Role ARN
echo -e "${GREEN}6. AWS_DEPLOY_ROLE_ARN${NC}"
echo -e "${YELLOW}   ⚠️  IaCリポジトリで確認が必要です:${NC}"
echo "   cd ../hima-five-bomber-infrastructure"
echo "   terraform output github_actions_role_arn"
echo ""

# 7. WebSocket URL (今後必要)
echo -e "${GREEN}7. VITE_WEBSOCKET_URL (今後必要)${NC}"
echo -e "${YELLOW}   ⚠️  Task 4実装後に設定:${NC}"
echo "   cd ../hima-five-bomber-infrastructure"
echo "   terraform output websocket_api_url"
echo ""

echo "========================================="
echo "GitHub Secretsへの設定方法"
echo "========================================="
echo ""
echo "1. GitHubリポジトリを開く: https://github.com/[あなたのユーザー名]/hima-five-bomber"
echo "2. Settings → Secrets and variables → Actions"
echo "3. 'New repository secret' をクリック"
echo "4. 上記の値を1つずつ追加"
echo ""

echo "========================================="
echo "まとめ（コピー用）"
echo "========================================="
echo ""
echo "AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID"
echo "S3_BUCKET_NAME=$S3_BUCKET_NAME"
echo "CLOUDFRONT_DISTRIBUTION_ID=$CLOUDFRONT_ID"
echo "CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN"
echo "VITE_API_GATEWAY_URL=$API_URL"
echo ""
echo "AWS_DEPLOY_ROLE_ARN=<IaCリポジトリで確認>"
echo "VITE_WEBSOCKET_URL=<Task 4実装後に設定>"
echo ""

echo "========================================="
echo "次のステップ"
echo "========================================="
echo ""
echo "1. IaCリポジトリでGitHub Actions用IAMロールのARNを確認"
echo "2. 上記の値をGitHub Secretsに設定"
echo "3. テストPRを作成してCI/CDを確認"
echo ""
