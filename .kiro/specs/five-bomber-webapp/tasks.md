# Implementation Plan: Five Bomber Webapp

## Overview
本実装計画は、ファイブボンバーWebアプリケーションの開発タスクを定義します。各タスクには対応する受け入れテスト（Acceptance Criteria）をGiven-When-Then形式で記載し、ATDD（受け入れテスト駆動開発）に基づいて実装を進めます。

---

## 1. プロジェクト基盤のセットアップ

- [x] 1.1 フロントエンドプロジェクトの初期化
  - React 19 + TypeScript + Viteのプロジェクトを作成
  - Tailwind CSSを設定し、基本的なスタイリング環境を構築
  - ESLint、Prettierを設定してコード品質を担保
  - パッケージマネージャー（npm/yarn）の設定とpackage.json作成
  - **Acceptance Criteria**:
    ```gherkin
    Given プロジェクトディレクトリが空である
    When npm create vite@latest frontend -- --template react-ts を実行する
    Then React 19プロジェクトが生成される
    And npm run dev でローカルサーバーが起動する
    And http://localhost:5173 でReactアプリが表示される
    ```
  - _Requirements: R-008.1 (技術スタック: React 19, TypeScript, Vite)_

- [x] 1.2 バックエンドプロジェクトの初期化
  - Node.js 22.x + TypeScriptプロジェクトを作成
  - Lambda関数の基本構造を設定（handlers/services/repositories構造）
  - AWS SDK v3とDynamoDB DocumentClientを導入
  - Jest + AWS SDK Mocksでテスト環境を構築
  - **Acceptance Criteria**:
    ```gherkin
    Given backend/ディレクトリが作成されている
    When npm init -y && npm install typescript @types/node を実行する
    Then tsconfig.jsonが生成される
    And src/ディレクトリ構造（handlers/services/repositories）が作成される
    And npm run build でTypeScriptがコンパイルされる
    ```
  - _Requirements: R-008.2 (技術スタック: Node.js 22.x, AWS Lambda)_

- [ ] 1.3 共通型定義とユーティリティの作成
  - shared/types/配下に共通型定義を作成（Room, Player, GameSession, Question等）
  - ゲームルール定数（制限時間30秒、正解スコア10点等）を定義
  - スコアリング定数を定義
  - 型定義をフロントエンド・バックエンドで共有可能にする
  - **Acceptance Criteria**:
    ```gherkin
    Given shared/types/models.ts が存在する
    When フロントエンドとバックエンドからimportする
    Then 型エラーなくビルドが成功する
    And 型定義が両プロジェクトで使用できる
    ```
  - _Requirements: R-003.1 (正解1つにつき10点), R-003.2 (時間ボーナス1秒1点)_

---

## 2. ルーム管理機能の実装

- [ ] 2.1 ルーム作成機能（バックエンド）
  - DynamoDBのRoomsテーブルへのルーム作成処理を実装
  - ユニークなルームIDの生成ロジックを実装
  - ホストプレイヤーの登録機能を実装
  - REST API（POST /api/rooms）ハンドラーを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ホストユーザーがルーム作成をリクエストする
    When POST /api/rooms にリクエストを送信する
    Then ユニークなルームIDが生成される
    And DynamoDB Roomsテーブルにルームが保存される
    And レスポンスに roomId と hostId が含まれる
    ```
  - _Requirements: R-001.1, R-001.2_

- [ ] 2.2 ルーム参加機能（バックエンド）
  - 既存ルームへのプレイヤー追加処理を実装
  - プレイヤー数制限（最大5人）のバリデーションを実装
  - ゲーム中のルームへの参加拒否処理を実装
  - REST API（POST /api/rooms/:roomId/join）ハンドラーを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ルームが存在し、プレイヤー数が5未満である
    When POST /api/rooms/{roomId}/join にplayerNameを送信する
    Then プレイヤーがルームに追加される
    And DynamoDBが更新される
    And レスポンスに playerId が含まれる

    Given ルームが満員（5人）である
    When 新しいプレイヤーが参加しようとする
    Then 409 Conflictエラーが返される
    And エラーメッセージに"満員"が含まれる
    ```
  - _Requirements: R-001.3, R-001.4_

- [ ] 2.3 ルーム退出機能（バックエンド）
  - プレイヤー削除処理を実装
  - ホストが退出した場合の新ホスト選定ロジックを実装
  - 全プレイヤー退出時のルーム削除処理を実装
  - REST API（DELETE /api/rooms/:roomId/players/:playerId）ハンドラーを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given プレイヤーがルームに参加している
    When DELETE /api/rooms/{roomId}/players/{playerId} をリクエストする
    Then プレイヤーがルームから削除される
    And DynamoDBが更新される

    Given ホストが退出する
    When 他のプレイヤーが残っている
    Then 残ったプレイヤーの1人が新ホストになる
    ```
  - _Requirements: R-001.6, R-001.7_

- [ ] 2.4 ルーム作成UI（フロントエンド）
  - ルーム作成画面のUIコンポーネントを作成
  - ホスト名入力フォームを実装
  - ルーム作成ボタンとAPI呼び出しロジックを実装
  - 作成後のルーム待機画面への遷移を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ユーザーがトップ画面を開いている
    When "ルーム作成"ボタンをクリックする
    Then ホスト名入力フォームが表示される
    And 送信ボタンをクリックすると POST /api/rooms が呼ばれる
    And ルームIDが取得でき、ルーム待機画面に遷移する
    ```
  - _Requirements: R-001.1, R-001.2, R-007.1 (レスポンシブUI)_

- [ ] 2.5 ルーム参加UI（フロントエンド）
  - ルームID入力画面のUIコンポーネントを作成
  - プレイヤー名入力フォームを実装
  - ルーム参加ボタンとAPI呼び出しロジックを実装
  - 満員時のエラー表示を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ユーザーがルーム参加画面を開いている
    When ルームIDとプレイヤー名を入力して参加ボタンをクリックする
    Then POST /api/rooms/{roomId}/join が呼ばれる
    And 成功時はルーム待機画面に遷移する
    And 満員時はエラーメッセージが表示される
    ```
  - _Requirements: R-001.3, R-001.4, R-007.1_

- [ ] 2.6 ルーム待機画面（フロントエンド）
  - プレイヤーリスト表示コンポーネントを実装
  - ホストマークの表示機能を実装
  - ゲーム開始ボタン（ホストのみ表示）を実装
  - ルーム退出ボタンを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ルームに参加済みである
    When ルーム待機画面が表示される
    Then 参加プレイヤーのリストが表示される
    And ホストには特別なマークが表示される
    And ホストのみ"ゲーム開始"ボタンが表示される
    ```
  - _Requirements: R-001.5, R-007.1_

---

## 3. WebSocket通信とリアルタイム同期の実装

- [ ] 3.1 WebSocket接続管理（バックエンド）
  - API Gateway WebSocket APIの接続ハンドラーを実装
  - DynamoDB ConnectionsテーブルへのconnectionId記録処理を実装
  - 切断ハンドラーと接続削除処理を実装
  - 接続状態の管理ロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given クライアントがWebSocket接続を確立する
    When 接続イベントが発火する
    Then DynamoDB ConnectionsテーブルにconnectionIdが保存される
    And クライアントに接続成功レスポンスが返る

    Given WebSocket接続が切断される
    When 切断イベントが発火する
    Then DynamoDB ConnectionsテーブルからconnectionIdが削除される
    ```
  - _Requirements: R-002.1 (WebSocket通信), R-004.1 (リアルタイム更新)_

- [ ] 3.2 WebSocketメッセージルーティング（バックエンド）
  - submitAnswerメッセージハンドラーを実装
  - syncGameStateメッセージハンドラーを実装
  - メッセージ型に応じたルーティングロジックを実装
  - エラーハンドリングと再試行ロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given WebSocket接続が確立されている
    When クライアントが { type: "submitAnswer", payload: {...} } を送信する
    Then submitAnswerハンドラーが呼ばれる
    And 適切なレスポンスが返される

    Given 不正なメッセージ型が送信される
    When バックエンドがメッセージを受信する
    Then エラーレスポンスが返される
    ```
  - _Requirements: R-002.1, R-010.1 (エラーハンドリング)_

- [ ] 3.3 WebSocketブロードキャスト機能（バックエンド）
  - ルーム内の全接続にメッセージを配信する機能を実装
  - DynamoDB Connectionsテーブルからルーム内の接続を取得する処理を実装
  - API Gateway Management APIを使用したメッセージ送信を実装
  - 配信失敗時の接続削除処理を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ルームに複数のプレイヤーが接続している
    When ランキング更新イベントが発生する
    Then 全プレイヤーの接続にランキングデータがブロードキャストされる
    And 200ms以内に配信が完了する
    ```
  - _Requirements: R-004.2 (ランキング更新), R-011.2 (200ms以内配信)_

- [ ] 3.4 WebSocket通信（フロントエンド）
  - useWebSocket カスタムHookを実装
  - Socket.io-clientを使用した接続確立ロジックを実装
  - 自動再接続機能（指数バックオフ）を実装
  - メッセージ送信・受信の型安全なインターフェースを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given useWebSocket Hookがマウントされる
    When 環境変数のWebSocket URLに接続する
    Then isConnected が true になる
    And メッセージ送受信が可能になる

    Given WebSocket接続が切断される
    When 自動再接続ロジックが実行される
    Then 指数バックオフで再接続が試みられる
    And 最大3回まで再試行される
    ```
  - _Requirements: R-002.1, R-004.1, R-010.2 (接続エラー時の再接続)_

- [ ] 3.5 リアルタイム状態同期（フロントエンド）
  - useGameState カスタムHookを実装
  - WebSocketメッセージに基づく状態更新ロジックを実装
  - questionStart、answerResult、rankingUpdate、gameOverイベントのハンドリングを実装
  - 状態の楽観的更新とサーバー確認の仕組みを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given WebSocketから questionStart メッセージを受信する
    When useGameState が状態を更新する
    Then 問題データが state.question に保存される
    And タイマーが30秒から開始される

    Given WebSocketから answerResult メッセージを受信する
    When 正解判定が返される
    Then state.answers に回答が追加される
    And state.currentTurn が次の順番に進む
    ```
  - _Requirements: R-002.1, R-002.8 (ゲーム状態の同期), R-004.1_

---

## 4. ゲームプレイ機能の実装

- [ ] 4.1 ゲーム開始処理（バックエンド）
  - GameSessionsテーブルへのセッション作成処理を実装
  - S3から問題データを取得する機能を実装
  - WebSocketで問題文のみをクライアントに配信する処理を実装（正解は送信しない）
  - ゲーム開始タイムスタンプの記録を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ホストがゲーム開始ボタンをクリックする
    When バックエンドがゲーム開始リクエストを受信する
    Then DynamoDB GameSessionsテーブルにセッションが作成される
    And S3から問題JSONが取得される
    And 問題文のみが全プレイヤーにWebSocketで配信される
    And 正解データはクライアントに送信されない
    ```
  - _Requirements: R-002.8, R-002.9 (問題データ配信), R-010.3 (正解データの秘匿)_

- [ ] 4.2 タイマー機能（フロントエンド）
  - Timerコンポーネントを実装
  - 30秒カウントダウンロジックを実装
  - 残り5秒以下で強調表示する機能を実装
  - タイムアップ時のイベント発火を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームが開始される
    When Timerコンポーネントがマウントされる
    Then 30秒からカウントダウンが始まる
    And 毎秒1ずつ減少する

    Given 残り時間が5秒以下になる
    When タイマーが表示される
    Then 強調表示（色・サイズ変更）される

    Given カウントダウンが0秒になる
    When タイムアップイベントが発火する
    Then ゲームオーバー処理が実行される
    ```
  - _Requirements: R-002.6, R-002.7, R-002.13 (タイムアップ処理)_

- [ ] 4.3 回答入力UI（フロントエンド）
  - AnswerInputコンポーネントを実装
  - 回答順の視覚的表示（5つの回答枠）を実装
  - 現在の回答順のハイライト表示を実装
  - 自分の回答枠の特別な強調表示を実装
  - 回答送信ボタンとバリデーションを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームプレイ画面が表示されている
    When プレイヤーが自分の回答順を確認する
    Then 5つの回答枠が表示される
    And 現在の回答順の枠がハイライトされる
    And 自分の回答枠が特別な色で強調される

    Given 自分の回答順である
    When 回答を入力して送信ボタンをクリックする
    Then WebSocketで回答が送信される
    And 送信中は入力が無効化される
    ```
  - _Requirements: R-002.3, R-002.4, R-002.5, R-007.3 (タップ可能な十分なサイズ)_

- [ ] 4.4 ゲームボード表示（フロントエンド）
  - GameBoardコンポーネントを実装
  - 問題文表示エリアを実装
  - Timer、AnswerInput、Scoreboardの統合を実装
  - プレイヤーリストと回答状況の表示を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームが開始されている
    When GameBoardが表示される
    Then 問題文が表示される
    And Timerがカウントダウンを表示する
    And AnswerInputが適切な回答順で表示される
    And プレイヤーリストと各自の回答状況が表示される
    ```
  - _Requirements: R-002.2, R-007.1 (レスポンシブデザイン)_

---

## 5. 正誤判定と表記ゆれ処理の実装

- [ ] 5.1 文字列正規化ユーティリティ（バックエンド）
  - 全角・半角変換機能を実装
  - ひらがな・カタカナ変換機能を実装
  - トリミングと空白正規化を実装
  - 異体字対応（将来拡張用）のための基盤を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 入力文字列が"Tokyo"（全角）である
    When normalize関数を実行する
    Then "Tokyo"（半角）に変換される

    Given 入力文字列が"とうきょう"である
    When toKatakana関数を実行する
    Then "トウキョウ"に変換される
    ```
  - _Requirements: R-006.3, R-006.4_

- [ ] 5.2 正誤判定ロジック（バックエンド）
  - AnswerValidatorサービスを実装
  - 正解リストとの完全一致判定を実装
  - acceptableVariationsを使用した表記ゆれ判定を実装
  - 正規化後の比較ロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 正解が["東京", "Tokyo"]である
    When プレイヤーが"とうきょう"と回答する
    Then 正規化処理が実行される
    And acceptableVariationsと照合される
    And 正解と判定される

    Given 正解が"富士山"である
    When プレイヤーが"エベレスト"と回答する
    Then 不正解と判定される
    ```
  - _Requirements: R-006.1, R-006.2, R-006.5_

- [ ] 5.3 回答送信処理（バックエンド）
  - submitAnswer WebSocketハンドラーを実装
  - 回答のバリデーション（空文字チェック等）を実装
  - AnswerValidatorを使用した正誤判定を実装
  - 正誤結果のレスポンス生成を実装（50-100ms以内）
  - **Acceptance Criteria**:
    ```gherkin
    Given プレイヤーが回答を送信する
    When submitAnswerハンドラーが回答を受信する
    Then 回答がバリデーションされる
    And AnswerValidatorで正誤判定が実行される
    And 50-100ms以内にWebSocketでレスポンスが返る
    And レスポンスに { correct: boolean, score?: number } が含まれる
    ```
  - _Requirements: R-002.1, R-006.1, R-011.1 (50-100ms以内)_

- [ ] 5.4 回答結果の反映（フロントエンド）
  - answerResultメッセージのハンドリングを実装
  - 正解時の正解マーク表示を実装
  - 不正解時のフィードバック表示を実装
  - 次のプレイヤーへのフォーカス移動ロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 回答が正解である
    When answerResultメッセージを受信する
    Then 回答枠に正解マークが表示される
    And 次のプレイヤーの回答枠にフォーカスが移動する

    Given 回答が不正解である
    When answerResultメッセージを受信する
    Then 不正解フィードバックが表示される
    And 同じプレイヤーが再回答できる
    ```
  - _Requirements: R-002.10, R-002.11_

---

## 6. スコアリングとランキング機能の実装

- [ ] 6.1 スコア計算ロジック（バックエンド）
  - ScoreCalculatorサービスを実装
  - 正解スコア計算（10点/回答）を実装
  - 時間ボーナス計算（1点/秒）を実装
  - 合計スコア計算を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 5回答すべて正解した
    And 残り時間が10秒である
    When calculateTotalScoreを実行する
    Then 正解スコアが50点（10×5）である
    And 時間ボーナスが10点（1×10）である
    And 合計スコアが60点である
    ```
  - _Requirements: R-003.1, R-003.2, R-003.3_

- [ ] 6.2 スコア記録処理（バックエンド）
  - DynamoDB Scoresテーブルへのスコア保存処理を実装
  - セッション完了時のスコア計算と記録を実装
  - TTL設定（24時間後自動削除）を実装
  - スコア履歴の管理を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームが完了する
    When スコアが計算される
    Then DynamoDB Scoresテーブルにスコアが保存される
    And sessionId, playerId, score, timeBonus が記録される
    And TTLが24時間後に設定される
    ```
  - _Requirements: R-003.4_

- [ ] 6.3 ランキング計算処理（バックエンド）
  - 全ルームのスコアを取得する処理を実装
  - スコア順でのランキングソート処理を実装
  - GSI（score降順）を使用した効率的なクエリを実装
  - ランキングキャッシュの管理を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 複数ルームがゲームを完了している
    When ランキングを計算する
    Then DynamoDB Scoresテーブルから全スコアが取得される
    And スコアの降順でソートされる
    And ランキング順位が付与される
    ```
  - _Requirements: R-004.1_

- [ ] 6.4 ランキング更新配信（バックエンド）
  - スコア更新時のランキング再計算トリガーを実装
  - 全ルームへのランキングブロードキャスト処理を実装
  - 200ms以内の配信を実現する最適化を実装
  - ランキング差分更新の仕組みを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given あるルームがゲームを完了する
    When スコアが記録される
    Then ランキングが再計算される
    And 全ルームの接続にランキングデータがブロードキャストされる
    And 配信が200ms以内に完了する
    ```
  - _Requirements: R-004.2, R-004.3, R-011.2_

- [ ] 6.5 スコアボード表示（フロントエンド）
  - Scoreboardコンポーネントを実装
  - リアルタイムスコア表示を実装
  - ランキングリストの表示を実装
  - ランキング更新時のアニメーションを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームプレイ中である
    When Scoreboardが表示される
    Then 現在のスコアが表示される
    And ランキングリストが表示される

    Given WebSocketからrankingUpdateメッセージを受信する
    When ランキングが更新される
    Then 新しいランキングが反映される
    And 順位変動のアニメーションが表示される
    ```
  - _Requirements: R-003.5, R-004.4_

---

## 7. ゲーム終了処理と演出の実装

- [ ] 7.1 ゲーム完了処理（バックエンド）
  - 5回答完了検知ロジックを実装
  - ゲームセッションのステータス更新（completed）を実装
  - 最終スコア計算と記録を実装
  - gameOverイベントの配信を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 5つの正解がすべて回答された
    When 最後の回答が正解と判定される
    Then ゲームセッションのstatusが"completed"に更新される
    And 最終スコアが計算される
    And 全プレイヤーにgameOverメッセージが配信される
    ```
  - _Requirements: R-002.12, R-003.4_

- [ ] 7.2 タイムアップ処理（バックエンド）
  - タイムアウト検知ロジックを実装
  - ゲームセッションのステータス更新（timeout）を実装
  - タイムアップ時のスコア計算を実装
  - gameOverイベントの配信を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲーム開始から30秒経過する
    When タイムアウトが検知される
    Then ゲームセッションのstatusが"timeout"に更新される
    And その時点までの正解数でスコアが計算される
    And 全プレイヤーにgameOver（失敗）メッセージが配信される
    ```
  - _Requirements: R-002.13, R-003.4_

- [ ] 7.3 クリア演出（フロントエンド）
  - 5回答完了時のクリアアニメーションを実装
  - 最終スコア表示画面を実装
  - 正解数と時間ボーナスの内訳表示を実装
  - 次の問題への遷移UIを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 5回答すべて完了する
    When gameOverメッセージ（success: true）を受信する
    Then クリアアニメーションが表示される
    And 最終スコア画面が表示される
    And 正解数、時間ボーナス、合計スコアが表示される
    ```
  - _Requirements: R-002.12, R-003.5_

- [ ] 7.4 爆弾演出（フロントエンド）
  - BombExplosionコンポーネントを実装
  - タイムアップ時の爆発アニメーションを実装
  - ゲームオーバー表示を実装
  - リトライUIを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given タイムアップが発生する
    When gameOverメッセージ（success: false）を受信する
    Then 爆発アニメーションが表示される
    And ゲームオーバー画面が表示される
    And リトライボタンが表示される
    ```
  - _Requirements: R-002.13, R-002.14_

---

## 8. 問題管理機能の実装

- [ ] 8.1 問題データモデル（バックエンド）
  - QuestionファイルのJSONスキーマを定義
  - S3バケット構造（categories/difficulty階層）を設計
  - 問題メタデータ（index.json）の構造を定義
  - 問題バリデーションロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 問題JSONファイルが作成される
    When バリデーションを実行する
    Then 必須フィールド（id, question, answers, category, difficulty）が存在する
    And answersが5つ以上の配列である
    And acceptableVariationsが適切な形式である
    ```
  - _Requirements: R-005.1_

- [ ] 8.2 問題CRUD処理（バックエンド）
  - S3への問題JSONアップロード機能を実装
  - S3からの問題取得機能を実装
  - 問題更新機能を実装
  - 問題削除機能を実装
  - REST API（/api/questions）ハンドラー群を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 管理者が問題を作成する
    When POST /api/questions にデータを送信する
    Then S3バケットに問題JSONがアップロードされる
    And メタデータが更新される
    And 問題IDが返される

    Given 問題IDが指定される
    When GET /api/questions/{questionId} をリクエストする
    Then S3から問題データが取得される
    And 問題データが返される
    ```
  - _Requirements: R-005.2, R-005.3, R-005.4, R-005.5_

- [ ] 8.3 問題フィルタリング機能（バックエンド）
  - カテゴリ別の問題取得機能を実装
  - 難易度別の問題取得機能を実装
  - 問題一覧のクエリ処理を実装
  - ランダム問題選択ロジックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 問題がS3に保存されている
    When GET /api/questions?category=geography&difficulty=easy をリクエストする
    Then 地理カテゴリーのeasy問題のみが返される

    Given ゲーム開始時に問題を選択する
    When ランダム選択ロジックを実行する
    Then 指定されたカテゴリ・難易度の問題がランダムに選ばれる
    ```
  - _Requirements: R-005.6_

- [ ] 8.4 問題管理UI（フロントエンド）
  - 問題一覧表示コンポーネントを実装
  - 問題作成フォームを実装
  - 問題編集フォームを実装
  - 問題削除確認ダイアログを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 管理者が問題管理画面を開く
    When 画面が表示される
    Then 既存の問題一覧が表示される
    And 問題作成ボタンが表示される

    Given 問題作成ボタンをクリックする
    When フォームが表示される
    Then 問題文、正解リスト、表記ゆれ、カテゴリ、難易度を入力できる
    And 送信すると POST /api/questions が呼ばれる
    ```
  - _Requirements: R-005.7, R-007.1_

---

## 9. レスポンシブデザインとUI/UX改善

- [ ] 9.1 モバイル対応レイアウト（フロントエンド）
  - Tailwind CSSのレスポンシブユーティリティを適用
  - スマートフォン（375x667）向けのレイアウトを実装
  - タブレット（768x1024）向けのレイアウトを実装
  - デスクトップ（1920x1080）向けのレイアウトを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームプレイ画面が表示される
    When 画面幅が375px（スマホ）である
    Then 全要素が縦並びレイアウトで表示される
    And ボタンのタップ領域が44px以上である

    Given 画面幅が1920px（デスクトップ）である
    When ゲームプレイ画面が表示される
    Then 全要素が横並びレイアウトで表示される
    ```
  - _Requirements: R-007.1, R-007.2, R-007.3_

- [ ] 9.2 タッチ操作の最適化（フロントエンド）
  - ボタンのタップ領域を44px以上に設定
  - スワイプジェスチャー対応を実装
  - タップフィードバック（視覚・触覚）を実装
  - 誤タップ防止のための余白設定を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given スマートフォンでゲームをプレイする
    When ボタンをタップする
    Then タップ領域が十分に大きい（44px以上）
    And タップ時に視覚的フィードバックがある
    And 誤タップが発生しにくい
    ```
  - _Requirements: R-007.3_

- [ ] 9.3 ローディング状態とエラー表示（フロントエンド）
  - LoadingSpinnerコンポーネントを実装
  - API呼び出し中のローディング表示を実装
  - エラーメッセージ表示コンポーネントを実装
  - リトライ機能付きエラーハンドリングを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given API呼び出しが実行される
    When レスポンス待機中である
    Then ローディングスピナーが表示される
    And ユーザー操作が無効化される

    Given APIエラーが発生する
    When エラーレスポンスを受信する
    Then エラーメッセージが表示される
    And リトライボタンが表示される
    ```
  - _Requirements: R-010.1_

- [ ] 9.4 アクセシビリティ対応（フロントエンド）
  - ARIA属性の適切な設定を実装
  - キーボードナビゲーション対応を実装
  - フォーカス管理を実装
  - カラーコントラスト比の確保を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given キーボードでアプリを操作する
    When Tabキーで要素を移動する
    Then フォーカスが適切な順序で移動する
    And フォーカス中の要素が視覚的に識別できる

    Given スクリーンリーダーで操作する
    When 要素がフォーカスされる
    Then ARIA属性に基づいて適切に読み上げられる
    ```
  - _Requirements: R-007.4, R-007.5_

---

## 10. セキュリティとエラーハンドリングの実装

- [ ] 10.1 入力バリデーション（バックエンド）
  - リクエストボディのスキーマバリデーションを実装
  - 必須パラメータチェックを実装
  - 型チェックとフォーマット検証を実装
  - 400 Bad Requestエラーレスポンスを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 不正なリクエストボディが送信される
    When バックエンドが受信する
    Then 400 Bad Requestエラーが返される
    And エラーメッセージに不正な項目が含まれる

    Given 必須パラメータが欠けている
    When リクエストを受信する
    Then バリデーションエラーが返される
    ```
  - _Requirements: R-010.1_

- [ ] 10.2 正解データの秘匿（バックエンド）
  - 問題配信時に正解を除外する処理を実装
  - 正誤判定は必ずバックエンドで実行する仕組みを確保
  - フロントエンドに送信するデータのフィルタリングを実装
  - セキュリティログの記録を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ゲームが開始される
    When 問題データがクライアントに配信される
    Then 問題文のみが送信される
    And 正解データ（answers, acceptableVariations）は含まれない

    Given クライアントから正誤判定リクエストが送信される
    When バックエンドが受信する
    Then バックエンドで正誤判定が実行される
    And クライアント側で判定は行われない
    ```
  - _Requirements: R-010.3_

- [ ] 10.3 レート制限とスロットリング（バックエンド）
  - API Gatewayのスロットリング設定を実装
  - 同一ユーザーからの過剰リクエスト検知を実装
  - 429 Too Many Requestsエラーレスポンスを実装
  - WebSocket接続数の制限を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ユーザーが短時間に大量のリクエストを送信する
    When API Gatewayがリクエストを受信する
    Then スロットリング制限に達する
    And 429 Too Many Requestsエラーが返される

    Given WebSocket接続数が上限に達している
    When 新しい接続が試みられる
    Then 接続が拒否される
    ```
  - _Requirements: R-010.4_

- [ ] 10.4 データ暗号化（インフラ）
  - DynamoDBの保存時暗号化（at-rest）を有効化
  - HTTPS/WSS通信の強制を設定
  - S3バケットの暗号化を有効化
  - CloudFrontのHTTPS強制を設定
  - **Acceptance Criteria**:
    ```gherkin
    Given DynamoDBテーブルが作成される
    When テーブル設定を確認する
    Then at-rest暗号化が有効化されている

    Given クライアントがHTTPでアクセスする
    When CloudFrontがリクエストを受信する
    Then HTTPSにリダイレクトされる
    ```
  - _Requirements: R-010.5_

- [ ] 10.5 エラーロギングとモニタリング（バックエンド）
  - CloudWatch Logsへの構造化ログ出力を実装
  - エラーレベル（ERROR/WARN/INFO）の分類を実装
  - リクエストIDとユーザーIDの記録を実装
  - CloudWatch Metricsへのカスタムメトリクス送信を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given Lambda関数内でエラーが発生する
    When エラーハンドリングが実行される
    Then CloudWatch Logsに構造化ログが出力される
    And ログにtimestamp, level, message, requestId, userId が含まれる

    Given エラー率が閾値を超える
    When CloudWatch Alarmsが監視する
    Then SNS通知が送信される
    ```
  - _Requirements: R-010.6_

---

## 11. テストの実装

- [ ] 11.1 ユニットテスト（バックエンド）
  - GameServiceの各メソッドのテストを実装
  - AnswerValidator（正誤判定・表記ゆれ）のテストを実装
  - ScoreCalculatorのテストを実装
  - TextNormalizerのテストを実装
  - DynamoDB操作のモックテストを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given AnswerValidatorのテストスイートを実行する
    When 正解"東京"に対して"とうきょう"を判定する
    Then 正解と判定される

    Given ScoreCalculatorのテストを実行する
    When 5正解、残り10秒でスコアを計算する
    Then 60点（50+10）が返される
    ```
  - _Requirements: All requirements（基盤的機能）_

- [ ] 11.2 ユニットテスト（フロントエンド）
  - useWebSocket Hookのテストを実装
  - useGameState Hookのテストを実装
  - AnswerInputコンポーネントのテストを実装
  - Timerコンポーネントのテストを実装
  - React Testing Libraryによるコンポーネントテストを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given useWebSocket Hookのテストを実行する
    When 接続が確立される
    Then isConnected が true になる

    Given Timerコンポーネントのテストを実行する
    When 30秒からカウントダウンする
    Then 毎秒1ずつ減少する
    ```
  - _Requirements: All requirements（基盤的機能）_

- [ ] 11.3 統合テスト（バックエンド）
  - REST API統合テスト（API Gateway → Lambda → DynamoDB）を実装
  - WebSocket統合テスト（接続 → メッセージ送信 → Lambda処理 → レスポンス）を実装
  - 正誤判定統合テスト（submitAnswer → AnswerValidator → ScoreCalculator → DynamoDB更新）を実装
  - LocalStackを使用したDynamoDB・S3のモックを実装
  - **Acceptance Criteria**:
    ```gherkin
    Given LocalStackでDynamoDBをエミュレートする
    When REST API（POST /api/rooms）を呼び出す
    Then ルームが作成される
    And DynamoDBテーブルにデータが保存される
    And レスポンスにroomIdが含まれる
    ```
  - _Requirements: All requirements（システム全体の動作確認）_

- [ ] 11.4 E2Eテスト（ATDD形式）
  - Playwrightでブラウザ自動化環境を構築
  - ルーム管理機能のE2Eテスト（room-management.spec.ts）を実装
  - ゲームプレイフローのE2Eテスト（game-play.spec.ts）を実装
  - スコアリングのE2Eテスト（scoring.spec.ts）を実装
  - ランキング更新のE2Eテスト（ranking.spec.ts）を実装
  - 正誤判定・表記ゆれのE2Eテスト（answer-validation.spec.ts）を実装
  - レスポンシブUIのE2Eテスト（responsive-design.spec.ts）を実装
  - パフォーマンスのE2Eテスト（performance.spec.ts）を実装
  - **Acceptance Criteria**:
    ```gherkin
    # R-001: ルーム管理機能
    Scenario: ホストがルームを作成する
      Given ユーザーがトップ画面を開いている
      When "ルーム作成"ボタンをクリックする
      Then ユニークなルームIDが生成される
      And ホストとしてルームに登録される
      And ルーム待機画面に遷移する

    # R-002: ゲームプレイ機能
    Scenario: 5人で順番に回答する
      Given ゲームが開始されている
      And 5人のプレイヤーが参加している
      When 1番目のプレイヤーが回答を送信する
      Then WebSocketで正誤判定が50-100ms以内に返却される
      And 正解の場合、2番目のプレイヤーにフォーカスが移動する

    # R-006: 正誤判定・表記ゆれ対応
    Scenario: 表記ゆれの許容判定
      Given 正解が"東京"である
      When プレイヤーが"とうきょう"と回答する
      Then 正解として判定される
    ```
  - _Requirements: R-001 ~ R-011（全要件の受け入れテスト）_

- [ ] 11.5 パフォーマンステスト
  - Artilleryで負荷テストシナリオを作成
  - 同時接続数テスト（100ルーム・500接続）を実装
  - 正誤判定レイテンシテスト（50-100ms目標）を実装
  - ランキング更新レイテンシテスト（200ms以内）を実装
  - DynamoDBスループットテストを実装
  - CloudWatch Metricsでパフォーマンス監視を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given 100ルーム（500接続）が同時にゲームをプレイする
    When 負荷テストを実行する
    Then すべての接続が維持される
    And 正誤判定が50-100ms以内で返る
    And ランキング更新が200ms以内に配信される
    ```
  - _Requirements: R-011.1, R-011.2, R-011.3, R-011.4, R-011.5_

---

## 12. CI/CDパイプラインの構築

- [ ] 12.1 GitHub Actions ワークフロー（Lint & Test）
  - CI用のGitHub Actionsワークフローファイルを作成
  - フロントエンドのLint + Testジョブを実装
  - バックエンドのLint + Testジョブを実装
  - プルリクエスト時の自動実行を設定
  - **Acceptance Criteria**:
    ```gherkin
    Given プルリクエストが作成される
    When GitHub Actionsがトリガーされる
    Then フロントエンドのESLint + Jestが実行される
    And バックエンドのESLint + Jestが実行される
    And すべてのテストがパスする
    ```
  - _Requirements: R-009.1, R-009.2_

- [ ] 12.2 GitHub Actions ワークフロー（Build）
  - フロントエンドのビルドジョブを実装
  - バックエンドのビルドジョブを実装
  - ビルド成果物のアーティファクト保存を実装
  - ビルド失敗時の通知を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given CIパイプラインが実行される
    When Buildジョブが開始される
    Then フロントエンドがViteでビルドされる
    And バックエンドがTypeScriptコンパイルされる
    And ビルド成果物がアーティファクトとして保存される
    ```
  - _Requirements: R-009.3_

- [ ] 12.3 GitHub Actions ワークフロー（Deploy Application）
  - S3へのフロントエンドデプロイジョブを実装
  - Lambda関数へのバックエンドデプロイジョブを実装
  - CloudFrontキャッシュ無効化を実装
  - デプロイ成功時の通知を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given ビルドジョブが成功する
    When Deployジョブが開始される
    Then フロントエンドビルド成果物がS3にアップロードされる
    And Lambda関数がデプロイされる
    And CloudFrontキャッシュが無効化される
    ```
  - _Requirements: R-009.4, R-009.5_

- [ ] 12.4 デプロイトリガーと承認フロー
  - mainブランチへのマージ時の自動デプロイトリガーを設定
  - タグトリガー（v1.0.0等）によるリリースデプロイを設定
  - 手動承認ステップの実装
  - デプロイ履歴の記録を実装
  - **Acceptance Criteria**:
    ```gherkin
    Given mainブランチにマージされる
    When GitHub Actionsがトリガーされる
    Then 手動承認待ちステータスになる
    And 承認されるとデプロイが実行される

    Given タグ（v1.0.0）がプッシュされる
    When リリースワークフローがトリガーされる
    Then 本番環境へのデプロイが実行される
    ```
  - _Requirements: R-009.6_

---

## 13. 統合とエンドツーエンド接続

- [ ] 13.1 フロントエンド・バックエンド統合
  - 環境変数でAPI Gateway URLとWebSocket URLを設定
  - CORS設定の確認と調整
  - API呼び出しの実際の動作確認
  - WebSocket接続の実際の動作確認
  - **Acceptance Criteria**:
    ```gherkin
    Given フロントエンドがローカルで起動している
    And バックエンドがAWSにデプロイされている
    When フロントエンドからAPI呼び出しを実行する
    Then CORS設定が正しく、リクエストが成功する
    And レスポンスが正しく受信される

    Given WebSocket接続を確立する
    When フロントエンドがWebSocket URLに接続する
    Then 接続が成功する
    And メッセージ送受信が可能になる
    ```
  - _Requirements: All requirements（システム全体の接続）_

- [ ] 13.2 エンドツーエンドフローの検証
  - ルーム作成 → プレイヤー参加 → ゲーム開始 → 回答 → スコア表示の一連のフローを実行
  - 複数ルームの同時プレイとランキング更新を検証
  - エラーケース（満員、タイムアップ等）の動作確認
  - パフォーマンス（50-100ms、200ms以内）の実測確認
  - **Acceptance Criteria**:
    ```gherkin
    Given システムが完全にデプロイされている
    When ルーム作成からゲーム完了までの一連の流れを実行する
    Then すべての機能が正常に動作する
    And 正誤判定が50-100ms以内で返る
    And ランキング更新が200ms以内に配信される
    And UI/UXが快適である
    ```
  - _Requirements: All requirements（全要件の統合確認）_

- [ ] 13.3 不具合修正と最適化
  - E2Eテストで発見された不具合を修正
  - パフォーマンスボトルネックの特定と最適化
  - ユーザビリティ改善
  - コードレビューとリファクタリング
  - **Acceptance Criteria**:
    ```gherkin
    Given E2Eテストですべてのシナリオが実行される
    When 不具合が発見される
    Then 不具合が修正される
    And 修正後に再度テストが実行される
    And すべてのテストがパスする
    ```
  - _Requirements: All requirements（品質確保）_

---

## Requirements Coverage Summary

| 要件ID | 要件概要 | 対応タスク |
|--------|----------|-----------|
| R-001.1-1.7 | ルーム管理機能 | 2.1, 2.2, 2.3, 2.4, 2.5, 2.6 |
| R-002.1-2.16 | ゲームプレイ機能 | 3.1-3.5, 4.1-4.4, 5.3-5.4, 7.1-7.4 |
| R-003.1-3.5 | スコアリング機能 | 1.3, 6.1, 6.2, 6.5, 7.1-7.2 |
| R-004.1-4.4 | リアルタイムランキング | 3.3, 6.3, 6.4, 6.5 |
| R-005.1-5.7 | 問題管理機能 | 8.1, 8.2, 8.3, 8.4 |
| R-006.1-6.6 | 正誤判定・表記ゆれ | 5.1, 5.2, 5.3, 5.4 |
| R-007.1-7.5 | レスポンシブデザイン | 9.1, 9.2, 9.4 |
| R-008.1-8.5 | インフラストラクチャ | 1.1, 1.2（※インフラコードは別リポジトリで管理） |
| R-009.1-9.6 | CI/CDパイプライン | 12.1, 12.2, 12.3, 12.4 |
| R-010.1-10.7 | セキュリティ対策 | 10.1, 10.2, 10.3, 10.4, 10.5 |
| R-011.1-11.5 | パフォーマンス要件 | 5.3, 6.4, 11.5, 13.2 |

---

## Implementation Notes

### 推奨実装順序
1. **基盤構築**（タスク1）: プロジェクトセットアップ
2. **ルーム管理**（タスク2）: ユーザーがルームを作成・参加できる状態
3. **WebSocket通信**（タスク3）: リアルタイム通信の基盤
4. **ゲームプレイ**（タスク4）: コア機能の実装
5. **正誤判定**（タスク5）: ゲームロジックの完成
6. **スコアリング**（タスク6）: スコアとランキングの実装
7. **ゲーム終了**（タスク7）: ゲームフローの完成
8. **問題管理**（タスク8）: 管理機能の追加
9. **UI/UX改善**（タスク9）: レスポンシブとアクセシビリティ
10. **セキュリティ**（タスク10）: セキュリティ強化
11. **テスト**（タスク11）: 品質保証
12. **CI/CD**（タスク12）: 自動化
13. **統合**（タスク13）: 最終確認と本番リリース準備

### ATDD実装プロセス
各タスクの実装時は以下のATDDサイクルに従います：

1. **Red**: 受け入れテスト（Acceptance Criteria）を先に書き、失敗することを確認
2. **Green**: 実装コードを書き、テストをパスさせる
3. **Refactor**: コードをリファクタリングし、品質を向上

### テスト優先順位
- **Unit Tests**: 各タスク実装時に並行して実装
- **Integration Tests**: タスク3-8完了後に実装
- **E2E Tests**: タスク9完了後、全機能統合後に実装
- **Performance Tests**: タスク13.2で実施

### インフラ管理について
- インフラコード（Terraform）は別リポジトリ（`hima-five-bomber-infrastructure`）で管理
- アプリケーションコードとインフラコードのデプロイは独立して実行
- CI/CDパイプライン（タスク12）はアプリケーションデプロイのみを対象

---

## 完了基準

すべてのタスクが完了し、以下の条件を満たしたとき、実装フェーズは完了とします：

- [ ] 全タスクのAcceptance Criteriaがパスする
- [ ] すべての要件（R-001 ~ R-011）がカバーされている
- [ ] E2Eテストがすべてパスする
- [ ] パフォーマンス要件（50-100ms、200ms）を満たす
- [ ] セキュリティ要件がすべて実装されている
- [ ] CI/CDパイプラインが正常に動作する
- [ ] 本番環境へのデプロイが成功する
