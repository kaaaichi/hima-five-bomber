import { useCallback, useEffect } from 'react';
import { useGameState } from './useGameState';
import { useTimer } from './useTimer';
import type { WebSocketMessage } from './useWebSocket';

export interface UseGameWithTimerOptions {
  /**
   * タイムアップ時のコールバック
   */
  onTimeUp?: () => void;
}

export interface UseGameWithTimerReturn {
  /**
   * ゲーム状態
   */
  gameState: ReturnType<typeof useGameState>['gameState'];

  /**
   * 残り時間（秒）
   */
  timeRemaining: number;

  /**
   * タイマーが動作中かどうか
   */
  isTimerRunning: boolean;

  /**
   * WebSocketメッセージを処理する
   */
  handleMessage: (message: WebSocketMessage) => void;

  /**
   * ゲーム状態とタイマーをリセットする
   */
  reset: () => void;
}

/**
 * useGameWithTimer Hook
 *
 * ゲーム状態管理とタイマー機能を統合したカスタムフック。
 * questionStartメッセージを受信すると自動的にタイマーが開始され、
 * gameOverメッセージを受信するとタイマーが停止します。
 *
 * @example
 * ```tsx
 * const { gameState, timeRemaining, handleMessage, reset } = useGameWithTimer({
 *   onTimeUp: () => console.log('Time up!'),
 * });
 * ```
 */
export const useGameWithTimer = (
  options: UseGameWithTimerOptions = {}
): UseGameWithTimerReturn => {
  const { onTimeUp } = options;

  // ゲーム状態管理
  const { gameState, handleMessage: handleGameMessage, resetState } = useGameState();

  // タイマー管理
  const {
    timeRemaining,
    isRunning: isTimerRunning,
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
  } = useTimer({
    onTimeUp: () => {
      if (onTimeUp) {
        onTimeUp();
      }
    },
  });

  // WebSocketメッセージを処理し、必要に応じてタイマーを制御
  const handleMessage = useCallback(
    (message: WebSocketMessage) => {
      // ゲーム状態を更新
      handleGameMessage(message);

      // メッセージタイプに応じてタイマーを制御
      switch (message.type) {
        case 'questionStart':
          // 問題開始時にタイマーをリセットして開始
          resetTimer();
          startTimer();
          break;

        case 'gameOver':
          // ゲーム終了時にタイマーを停止
          stopTimer();
          break;

        // その他のメッセージタイプではタイマーを操作しない
        default:
          break;
      }
    },
    [handleGameMessage, startTimer, stopTimer, resetTimer]
  );

  // ゲーム状態とタイマーをリセット
  const reset = useCallback(() => {
    resetState();
    resetTimer();
  }, [resetState, resetTimer]);

  // gameState.timeRemainingをタイマーの値で同期
  useEffect(() => {
    // この処理は将来的にgameStateにtimeRemainingを持たせる必要がなくなった場合に削除可能
  }, [timeRemaining]);

  return {
    gameState,
    timeRemaining,
    isTimerRunning,
    handleMessage,
    reset,
  };
};
