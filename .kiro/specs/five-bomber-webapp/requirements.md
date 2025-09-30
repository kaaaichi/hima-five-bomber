# Requirements Document

## Introduction

ファイブボンバーWebアプリは、ネプリーグの人気クイズゲーム「ファイブボンバー」をWeb上で再現するリアルタイム対戦クイズアプリケーションです。5人のプレイヤーが制限時間内に順番に回答し、複数チームが同時にプレイしながらリアルタイムでランキングを競い合います。

本アプリケーションは、PC・スマートフォンの両方からアクセス可能で、友人グループでのオンラインゲーム、企業研修、教育現場など、多様な利用シーンに対応します。AWSサーバーレスアーキテクチャとTerraformによるIaCを採用し、スケーラブルで保守性の高いシステムを実現します。

## Requirements

### Requirement 1: ルーム管理機能
**Objective:** ユーザーとして、ゲームをプレイするためのルームを作成・参加・管理したい。これにより、チームメンバーを集めてゲームセッションを開始できる。

#### Acceptance Criteria

1. WHEN ユーザーがルーム作成を要求する THEN ファイブボンバーシステム SHALL 一意のルームIDを生成し、ルーム作成者をホストとして登録する
2. WHEN ユーザーがルームIDを指定して参加を要求する THEN ファイブボンバーシステム SHALL ルームの存在を確認し、プレイヤーとして追加する
3. IF ルームが既に満員（5人）である THEN ファイブボンバーシステム SHALL 参加を拒否し、エラーメッセージを表示する
4. WHEN ホストがゲーム開始を要求する AND 参加プレイヤーが1人以上である THEN ファイブボンバーシステム SHALL ゲームセッションを開始する
5. WHEN プレイヤーがルームから退出する THEN ファイブボンバーシステム SHALL 当該プレイヤーをルームから削除し、他のプレイヤーに通知する
6. IF ホストがルームから退出する AND 他のプレイヤーが存在する THEN ファイブボンバーシステム SHALL 次のプレイヤーをホストに昇格させる
7. WHERE ルーム内 THE ファイブボンバーシステム SHALL リアルタイムでプレイヤーリストを全参加者に同期する

### Requirement 2: ゲームプレイ機能
**Objective:** プレイヤーとして、制限時間内に順番に回答しながらゲームをプレイしたい。これにより、緊張感のあるクイズ体験を楽しめる。

#### Acceptance Criteria

1. WHEN ゲームセッションが開始される THEN ファイブボンバーシステム SHALL 問題文（正解を含まない）を全プレイヤーに配信する
2. WHEN ゲームセッションが開始される THEN ファイブボンバーシステム SHALL 30秒のタイマーを開始する
3. WHERE ゲームプレイ画面 THE ファイブボンバーシステム SHALL 5つの回答枠を視覚的に表示し、各プレイヤーの回答順（1番目～5番目）を明示する
4. WHERE ゲームプレイ画面 THE ファイブボンバーシステム SHALL 現在の回答順のプレイヤーを視覚的にハイライト表示する
5. WHERE 自分の回答順 THE ファイブボンバーシステム SHALL 自分の回答枠を特別な色・デザインで強調表示する
6. WHERE 自分の回答順 THE ファイブボンバーシステム SHALL 回答入力フォームを有効化する
7. WHERE 他のプレイヤーの回答順 THE ファイブボンバーシステム SHALL 回答入力フォームを無効化する
8. WHEN プレイヤーが正解する THEN ファイブボンバーシステム SHALL 該当する回答枠に正解マークを表示する
9. WHEN プレイヤーが回答を送信する THEN ファイブボンバーシステム SHALL WebSocket経由でバックエンドに回答を送信し、正誤判定を実行する
10. WHEN バックエンドが正誤判定を完了する THEN ファイブボンバーシステム SHALL 50-100ms以内に判定結果を返却する
11. IF 回答が正解である THEN ファイブボンバーシステム SHALL 正解として記録し、次のプレイヤーに回答順を移行する
12. IF 回答が不正解である THEN ファイブボンバーシステム SHALL 不正解フィードバックを表示し、同じプレイヤーの回答を継続する
13. WHEN 残り時間が5秒以下になる THEN ファイブボンバーシステム SHALL 視覚的カウントダウン表示を開始する
14. WHEN タイマーが0秒に到達する AND 5つの正解が揃っていない THEN ファイブボンバーシステム SHALL 爆弾爆発演出を表示し、ゲームオーバーとする
15. WHEN 5つの正解が全て揃う AND タイマーが0秒に到達していない THEN ファイブボンバーシステム SHALL 問題クリアとし、スコアを計算する
16. IF プレイヤー数が5人未満である THEN ファイブボンバーシステム SHALL 同じプレイヤーに複数回の回答機会を割り当て、合計5回答を確保する

### Requirement 3: スコアリング機能
**Objective:** プレイヤーとして、パフォーマンスに基づいたスコアを獲得したい。これにより、チーム間の競争を楽しめる。

#### Acceptance Criteria

1. WHEN 正解が1つ記録される THEN ファイブボンバーシステム SHALL 10点を加算する
2. WHEN 問題がクリアされる THEN ファイブボンバーシステム SHALL 残り時間1秒につき1点のボーナスを加算する
3. WHEN 問題がクリアされる THEN ファイブボンバーシステム SHALL 合計スコア（正解スコア + 時間ボーナス）を計算し、DynamoDBに記録する
4. WHERE 1ゲーム THE ファイブボンバーシステム SHALL 4問を出題する
5. WHEN 4問全てが終了する THEN ファイブボンバーシステム SHALL 総合スコアを集計し、ゲーム結果画面を表示する

### Requirement 4: リアルタイムランキング機能
**Objective:** 複数チームとして、リアルタイムで他チームのスコアと自チームの順位を確認したい。これにより、競争のモチベーションを高められる。

#### Acceptance Criteria

1. WHEN 任意のチームが1問をクリアする THEN ファイブボンバーシステム SHALL 全チームのランキングを再計算する
2. WHEN ランキングが更新される THEN ファイブボンバーシステム SHALL WebSocket経由で全ルームにランキング情報をブロードキャストする
3. WHERE ランキング画面 THE ファイブボンバーシステム SHALL チーム名、現在のスコア、順位をリアルタイムに表示する
4. WHERE ランキング画面 THE ファイブボンバーシステム SHALL 自チームを視覚的にハイライト表示する

### Requirement 5: 問題管理機能
**Objective:** 管理者として、問題を追加・編集・削除したい。これにより、ゲームコンテンツを柔軟に管理できる。

#### Acceptance Criteria

1. WHERE 管理画面 THE ファイブボンバーシステム SHALL 既存問題の一覧を表示する
2. WHEN 管理者が新規問題作成を要求する THEN ファイブボンバーシステム SHALL 問題作成フォームを表示する
3. WHEN 管理者が問題データを送信する THEN ファイブボンバーシステム SHALL JSON形式で検証し、S3に保存する
4. IF 問題データが不正である（5つ以上の正解がない等） THEN ファイブボンバーシステム SHALL バリデーションエラーを表示し、保存を拒否する
5. WHEN 管理者が既存問題の編集を要求する THEN ファイブボンバーシステム SHALL 問題データをS3から取得し、編集フォームに表示する
6. WHEN 管理者が問題の削除を要求する THEN ファイブボンバーシステム SHALL 確認ダイアログを表示し、承認後にS3から削除する
7. WHERE 問題データ THE ファイブボンバーシステム SHALL 以下の構造を持つこと: id, question, answers (配列), acceptableVariations (オブジェクト), category, difficulty

### Requirement 6: 正誤判定・表記ゆれ対応機能
**Objective:** プレイヤーとして、ひらがな/カタカナや漢字の違いによる誤判定を避けたい。これにより、公平で快適なゲーム体験を得られる。

#### Acceptance Criteria

1. WHEN バックエンドが回答を受信する THEN ファイブボンバーシステム SHALL 回答文字列を正規化する（トリミング、全角→半角変換等）
2. WHEN 正規化された回答を正解リストと照合する THEN ファイブボンバーシステム SHALL 完全一致を最優先で判定する
3. IF 完全一致しない THEN ファイブボンバーシステム SHALL acceptableVariations定義を参照し、許容表記と照合する
4. IF acceptableVariationsにひらがな/カタカナのバリエーションが定義されている THEN ファイブボンバーシステム SHALL 大文字小文字・ひらがなカタカナを区別せずに照合する
5. WHEN 照合結果が正解と判定される THEN ファイブボンバーシステム SHALL 正解フラグをtrueとして返却する
6. WHEN 照合結果が不正解と判定される THEN ファイブボンバーシステム SHALL 正解フラグをfalseとして返却する

### Requirement 7: レスポンシブデザイン対応
**Objective:** ユーザーとして、PC・スマートフォンの両方から快適にプレイしたい。これにより、デバイスを選ばずゲームを楽しめる。

#### Acceptance Criteria

1. WHERE PC画面（1024px以上） THE ファイブボンバーシステム SHALL デスクトップレイアウトを表示する
2. WHERE タブレット画面（768px-1023px） THE ファイブボンバーシステム SHALL タブレット最適化レイアウトを表示する
3. WHERE スマートフォン画面（767px以下） THE ファイブボンバーシステム SHALL モバイル最適化レイアウトを表示する
4. WHERE 全デバイス THE ファイブボンバーシステム SHALL Tailwind CSSのレスポンシブユーティリティクラスを使用する
5. WHERE タッチデバイス THE ファイブボンバーシステム SHALL タップ操作に最適化されたUI要素（ボタンサイズ等）を提供する

### Requirement 8: インフラストラクチャ管理
**Objective:** 開発者として、AWSリソースをコードで管理したい。これにより、再現性の高いインフラ構築とバージョン管理を実現できる。

#### Acceptance Criteria

1. WHERE インフラ定義 THE ファイブボンバーシステム SHALL Terraform HCLで全AWSリソースを定義する
2. WHEN Terraformが適用される THEN ファイブボンバーシステム SHALL 以下のリソースを作成する: Lambda Functions, API Gateway (REST + WebSocket), DynamoDB Tables, S3 Buckets, CloudFront Distribution, IAM Roles/Policies
3. WHERE Terraform構成 THE ファイブボンバーシステム SHALL モジュール化された構造（modules/frontend, modules/backend, modules/database, modules/monitoring）を持つこと
4. WHERE 環境管理 THE ファイブボンバーシステム SHALL 初期構成としてprd環境のみを定義し、将来的にdev/stg環境を追加可能な設計とする
5. WHEN Terraform stateが管理される THEN ファイブボンバーシステム SHALL S3バックエンドとDynamoDBロックを使用する

### Requirement 9: CI/CDパイプライン
**Objective:** 開発者として、コード変更を自動的にテスト・デプロイしたい。これにより、リリースプロセスを効率化できる。

#### Acceptance Criteria

1. WHEN コードがプッシュされる THEN ファイブボンバーシステム SHALL GitHub Actionsワークフローを実行する
2. WHERE CI/CDパイプライン THE ファイブボンバーシステム SHALL 以下のステップを順次実行する: Lint & Test → Build → Terraform Deploy (手動承認) → E2E Test（将来追加）
3. WHEN Lint & Testステップが実行される THEN ファイブボンバーシステム SHALL ESLint、Prettier、Jest/React Testing Libraryを実行する
4. WHEN Buildステップが実行される THEN ファイブボンバーシステム SHALL フロントエンド（Vite）とバックエンド（TypeScript）をビルドする
5. WHEN Terraform Deployステップが実行される AND 手動承認が完了する THEN ファイブボンバーシステム SHALL terraform applyを実行し、prd環境にデプロイする
6. IF いずれかのステップが失敗する THEN ファイブボンバーシステム SHALL パイプラインを停止し、失敗通知を送信する

### Requirement 10: セキュリティ対策
**Objective:** システムとして、ユーザーデータとゲームの公平性を保護したい。これにより、安全で信頼性の高いサービスを提供できる。

#### Acceptance Criteria

1. WHERE 問題配信 THE ファイブボンバーシステム SHALL 問題文のみをフロントエンドに送信し、正解データは送信しない
2. WHERE 正誤判定 THE ファイブボンバーシステム SHALL 必ずバックエンド（Lambda）で実行し、フロントエンドでの判定を行わない
3. WHERE データ保存 THE ファイブボンバーシステム SHALL DynamoDBの保存時暗号化（at-rest encryption）を有効化する
4. WHERE 通信 THE ファイブボンバーシステム SHALL HTTPS（REST API）およびWSS（WebSocket）による暗号化通信を使用する
5. WHERE API Gateway THE ファイブボンバーシステム SHALL スロットリング設定を適用し、過剰なリクエストを制限する
6. WHERE WebSocket接続 THE ファイブボンバーシステム SHALL 同時接続数の上限を設定する
7. WHERE IAMロール THE ファイブボンバーシステム SHALL 最小権限の原則に従い、必要最小限の権限のみを付与する

### Requirement 11: パフォーマンス要件
**Objective:** ユーザーとして、ストレスなく快適にゲームをプレイしたい。これにより、リアルタイム性と応答性の高い体験を得られる。

#### Acceptance Criteria

1. WHEN 正誤判定リクエストが送信される THEN ファイブボンバーシステム SHALL 50-100ms以内にレスポンスを返却する
2. WHEN ランキング更新が発生する THEN ファイブボンバーシステム SHALL WebSocket経由で200ms以内に全クライアントに配信する
3. WHERE CloudFront THE ファイブボンバーシステム SHALL 静的アセット（HTML, CSS, JS）を長期キャッシュし、低レイテンシ配信を実現する
4. WHERE Lambda関数 THE ファイブボンバーシステム SHALL コールドスタート時間を最小化するため、適切なメモリ設定（最低512MB）を行う
5. WHERE DynamoDB THE ファイブボンバーシステム SHALL アクセスパターンに最適化されたテーブル設計とインデックスを使用する