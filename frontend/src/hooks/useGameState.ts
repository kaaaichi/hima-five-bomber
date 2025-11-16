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
        handleQuestionStart(message.payload);
        break;
      case 'answerResult':
        handleAnswerResult(message.payload);
        break;
      case 'rankingUpdate':
        handleRankingUpdate(message.payload);
        break;
      case 'gameOver':
        handleGameOver(message.payload);
        break;
      case 'error':
        handleError(message.payload);
        break;
      default:
        console.warn('[useGameState] Unknown message type', message);
    }
  }, []);

  /**
   * questionStart メッセージ処理
   */
  const handleQuestionStart = useCallback((payload: QuestionPayload) => {
    console.log('[useGameState] Question started', payload);
    setGameState({
      question: payload,
      answers: [],
      currentTurn: 0,
      timeRemaining: 30,
      isPlaying: true,
    });
  }, []);

  /**
   * answerResult メッセージ処理
   */
  const handleAnswerResult = useCallback((payload: { correct: boolean; score?: number; nextTurn: number }) => {
    console.log('[useGameState] Answer result received', payload);
    setGameState((prev) => ({
      ...prev,
      currentTurn: payload.nextTurn,
      answers: [
        ...prev.answers,
        {
          correct: payload.correct,
          score: payload.score,
        },
      ],
    }));
  }, []);

  /**
   * rankingUpdate メッセージ処理
   */
  const handleRankingUpdate = useCallback((payload: RankingPayload) => {
    console.log('[useGameState] Ranking updated', payload);
    setGameState((prev) => ({
      ...prev,
      rankings: payload.rankings,
    }));
  }, []);

  /**
   * gameOver メッセージ処理
   */
  const handleGameOver = useCallback((payload: GameOverPayload) => {
    console.log('[useGameState] Game over', payload);
    setGameState((prev) => ({
      ...prev,
      isPlaying: false,
      gameResult: payload,
    }));
  }, []);

  /**
   * error メッセージ処理
   */
  const handleError = useCallback((payload: ErrorPayload) => {
    console.error('[useGameState] Error received', payload);
    setGameState((prev) => ({
      ...prev,
      error: payload,
    }));
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
