#!/bin/bash
# ローカルでLambda関数をテストするスクリプト

set -e

LAMBDA_PORT=${LAMBDA_PORT:-9000}
LAMBDA_URL="http://localhost:${LAMBDA_PORT}/2015-03-31/functions/function/invocations"

echo "=================================================="
echo "Five Bomber Backend - Local Lambda Testing"
echo "=================================================="
echo ""

# 関数の引数をチェック
if [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
  echo "Usage: $0 [test-case]"
  echo ""
  echo "Test cases:"
  echo "  success       - 正常系テスト（ルーム作成成功）"
  echo "  empty-name    - バリデーションエラー（空のホスト名）"
  echo "  long-name     - バリデーションエラー（長すぎるホスト名）"
  echo "  no-body       - リクエストボディ欠如"
  echo "  all           - 全テストケースを実行"
  echo ""
  echo "Example:"
  echo "  $0 success"
  echo "  LAMBDA_PORT=9001 $0 success"
  exit 0
fi

# jqがインストールされているか確認
if ! command -v jq &> /dev/null; then
  echo "Error: jq is not installed. Please install jq first."
  echo "  brew install jq  # macOS"
  echo "  apt-get install jq  # Ubuntu"
  exit 1
fi

# Lambda関数が起動しているか確認
echo "Checking Lambda function availability..."
if ! curl -s -o /dev/null -w "%{http_code}" "$LAMBDA_URL" > /dev/null 2>&1; then
  echo "Error: Lambda function is not running on port ${LAMBDA_PORT}"
  echo ""
  echo "Please start Lambda function first:"
  echo "  docker-compose up -d"
  echo "  # OR"
  echo "  docker run -p ${LAMBDA_PORT}:8080 five-bomber-backend:local dist/handlers/rest/rooms.handler"
  exit 1
fi
echo "✓ Lambda function is running"
echo ""

# テストケースを実行
run_test() {
  local test_name=$1
  local event_json=$2

  echo "----------------------------------------"
  echo "Test: $test_name"
  echo "----------------------------------------"

  echo "Request:"
  echo "$event_json" | jq '.'
  echo ""

  echo "Response:"
  response=$(curl -s -XPOST "$LAMBDA_URL" \
    -H "Content-Type: application/json" \
    -d "$event_json")

  echo "$response" | jq '.'

  # ステータスコードをチェック
  status_code=$(echo "$response" | jq -r '.statusCode')
  echo ""
  echo "Status Code: $status_code"
  echo ""
}

# テストケース定義
test_success() {
  local event='{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"Local Test Host\"}",
    "headers": {
      "Content-Type": "application/json"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "isBase64Encoded": false
  }'

  run_test "正常系 - ルーム作成成功" "$event"
}

test_empty_name() {
  local event='{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"\"}",
    "headers": {
      "Content-Type": "application/json"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "isBase64Encoded": false
  }'

  run_test "異常系 - 空のホスト名" "$event"
}

test_long_name() {
  local event='{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": "{\"hostName\": \"This is a very long host name that exceeds the maximum length\"}",
    "headers": {
      "Content-Type": "application/json"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "isBase64Encoded": false
  }'

  run_test "異常系 - 長すぎるホスト名（20文字超過）" "$event"
}

test_no_body() {
  local event='{
    "httpMethod": "POST",
    "path": "/api/rooms",
    "body": null,
    "headers": {
      "Content-Type": "application/json"
    },
    "queryStringParameters": null,
    "pathParameters": null,
    "isBase64Encoded": false
  }'

  run_test "異常系 - リクエストボディ欠如" "$event"
}

# メイン処理
case "$1" in
  success)
    test_success
    ;;
  empty-name)
    test_empty_name
    ;;
  long-name)
    test_long_name
    ;;
  no-body)
    test_no_body
    ;;
  all|"")
    test_success
    test_empty_name
    test_long_name
    test_no_body
    ;;
  *)
    echo "Unknown test case: $1"
    echo "Run '$0 help' for available test cases"
    exit 1
    ;;
esac

echo "=================================================="
echo "Testing completed!"
echo "=================================================="
