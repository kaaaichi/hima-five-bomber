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
