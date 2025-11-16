/**
 * useGameState Hook
 * タスク4.5: リアルタイム状態同期（フロントエンド）
 */

import { useState, useCallback } from 'react';
import type {
  WebSocketMessage,
  QuestionPayload,
  RankingPayload,
  GameOverPayload,
  ErrorPayload,
} from './useWebSocket';

/**
 * ゲーム状態
 */
export interface GameState {
  /**
   * 現在の問題
   */
  question: QuestionPayload | null;

  /**
   * 回答履歴
   */
  answers: AnswerRecord[];

  /**
   * 現在のターン（0-4: 5人の回答順）
   */
  currentTurn: number;

  /**
   * 残り時間（秒）
   */
  timeRemaining: number;

  /**
   * ゲーム中かどうか
   */
  isPlaying: boolean;

  /**
   * ランキング情報（オプション）
   */
  rankings?: RankingPayload['rankings'];

  /**
   * ゲーム結果（オプション）
   */
  gameResult?: GameOverPayload;

  /**
   * エラー情報（オプション）
   */
  error?: ErrorPayload;
}

/**
 * 回答記録
 */
export interface AnswerRecord {
  correct: boolean;
  score?: number;
}

/**
 * useGameState Hookの戻り値
 */
export interface UseGameStateReturn {
  /**
   * 現在のゲーム状態
   */
  gameState: GameState;

  /**
   * WebSocketメッセージを処理する
   */
  handleMessage: (message: WebSocketMessage) => void;

  /**
   * ゲーム状態をリセットする
   */
  resetState: () => void;
}

/**
 * 初期ゲーム状態
 */
const initialGameState: GameState = {
  question: null,
  answers: [],
  currentTurn: 0,
  timeRemaining: 30,
  isPlaying: false,
};

/**
 * useGameState カスタムHook
 *
 * WebSocketメッセージに基づいてゲーム状態を管理します。
 *
 * @returns ゲーム状態と制御関数
 */
export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  /**
   * WebSocketメッセージを処理する
   */
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('[useGameState] Handling message', { type: message.type });

    switch (message.type) {
      case 'questionStart':
        console.log('[useGameState] Question started', message.payload);
        setGameState({
          question: message.payload,
          answers: [],
          currentTurn: 0,
          timeRemaining: 30,
          isPlaying: true,
        });
        break;
      case 'answerResult':
        console.log('[useGameState] Answer result received', message.payload);
        setGameState((prev) => ({
          ...prev,
          currentTurn: message.payload.nextTurn,
          answers: [
            ...prev.answers,
            {
              correct: message.payload.correct,
              score: message.payload.score,
            },
          ],
        }));
        break;
      case 'rankingUpdate':
        console.log('[useGameState] Ranking updated', message.payload);
        setGameState((prev) => ({
          ...prev,
          rankings: message.payload.rankings,
        }));
        break;
      case 'gameOver':
        console.log('[useGameState] Game over', message.payload);
        setGameState((prev) => ({
          ...prev,
          isPlaying: false,
          gameResult: message.payload,
        }));
        break;
      case 'error':
        console.error('[useGameState] Error received', message.payload);
        setGameState((prev) => ({
          ...prev,
          error: message.payload,
        }));
        break;
      default:
        console.warn('[useGameState] Unknown message type', message);
    }
  }, []);

  /**
   * ゲーム状態をリセットする
   */
  const resetState = useCallback(() => {
    console.log('[useGameState] Resetting state');
    setGameState(initialGameState);
  }, []);

  return {
    gameState,
    handleMessage,
    resetState,
  };
}
