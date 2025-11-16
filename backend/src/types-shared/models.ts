/**
 * Common type definitions for Five Bomber Web App
 * フロントエンドとバックエンドで共有する型定義
 */

/**
 * Player - プレイヤー情報
 */
export interface Player {
  playerId: string;
  name: string;
  joinedAt: number;
}

/**
 * Room - ルーム情報
 */
export interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

/**
 * GameSession - ゲームセッション情報
 */
export interface GameSession {
  sessionId: string;
  roomId: string;
  questionId: string;
  startedAt: number;
  currentTurn: number; // 0-4 (5人の回答順)
  answers: AnswerRecord[];
  status: 'playing' | 'completed' | 'timeout';
}

/**
 * AnswerRecord - 回答記録
 */
export interface AnswerRecord {
  playerId: string;
  answer: string;
  isCorrect: boolean;
  timestamp: number;
}

/**
 * Question - 問題データ
 */
export interface Question {
  id: string;
  question: string;
  answers: string[]; // 5つ以上の正解
  acceptableVariations: AcceptableVariations;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: number;
  updatedAt: number;
}

/**
 * AcceptableVariations - 許容表記のバリエーション
 */
export interface AcceptableVariations {
  [answer: string]: string[];
}

/**
 * GameResult - ゲーム結果
 */
export interface GameResult {
  success: boolean;
  totalScore: number;
  correctAnswers: number;
  timeBonus: number;
}

/**
 * RankingEntry - ランキングエントリ
 */
export interface RankingEntry {
  roomId: string;
  teamName: string;
  score: number;
  rank: number;
}

/**
 * Connection - WebSocket接続情報
 */
export interface Connection {
  connectionId: string;
  playerId: string;
  roomId: string;
  connectedAt: number;
}

/**
 * WebSocketメッセージ - クライアントからの受信メッセージ型
 */
export type InboundWebSocketMessage =
  | { type: 'submitAnswer'; payload: SubmitAnswerPayload }
  | { type: 'syncGameState'; payload: SyncGameStatePayload };

/**
 * WebSocketメッセージ - クライアントへの送信メッセージ型
 */
export type OutboundWebSocketMessage =
  | { type: 'questionStart'; payload: QuestionPayload }
  | { type: 'answerResult'; payload: AnswerResultPayload }
  | { type: 'rankingUpdate'; payload: RankingPayload }
  | { type: 'gameOver'; payload: GameOverPayload }
  | { type: 'error'; payload: ErrorPayload };

/**
 * SubmitAnswerPayload - 回答送信ペイロード
 */
export interface SubmitAnswerPayload {
  sessionId: string;
  playerId: string;
  answer: string;
}

/**
 * SyncGameStatePayload - ゲーム状態同期ペイロード
 */
export interface SyncGameStatePayload {
  sessionId: string;
}

/**
 * QuestionPayload - 問題開始ペイロード
 */
export interface QuestionPayload {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
}

/**
 * AnswerResultPayload - 回答結果ペイロード
 */
export interface AnswerResultPayload {
  correct: boolean;
  score?: number;
  nextTurn: number;
}

/**
 * RankingPayload - ランキング更新ペイロード
 */
export interface RankingPayload {
  rankings: RankingEntry[];
}

/**
 * GameOverPayload - ゲーム終了ペイロード
 */
export interface GameOverPayload {
  success: boolean;
  totalScore: number;
  timeBonus: number;
}

/**
 * ErrorPayload - エラーペイロード
 */
export interface ErrorPayload {
  message: string;
  code?: string;
}
