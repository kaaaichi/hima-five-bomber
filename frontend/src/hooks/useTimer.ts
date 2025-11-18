import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_RULES } from '@five-bomber/shared';

export interface UseTimerOptions {
  /**
   * タイムアップ時のコールバック
   */
  onTimeUp: () => void;

  /**
   * 初期時間（秒）
   * デフォルトは30秒
   */
  initialTime?: number;
}

export interface UseTimerReturn {
  /**
   * 残り時間（秒）
   */
  timeRemaining: number;

  /**
   * タイマーが動作中かどうか
   */
  isRunning: boolean;

  /**
   * タイマーを開始
   */
  start: () => void;

  /**
   * タイマーを停止
   */
  stop: () => void;

  /**
   * タイマーをリセット
   */
  reset: () => void;
}

/**
 * useTimer Hook
 *
 * ゲームのカウントダウンタイマーを管理するカスタムフック。
 * 1秒ごとに残り時間を減算し、0秒になるとonTimeUpコールバックを呼び出します。
 *
 * @example
 * ```tsx
 * const { timeRemaining, isRunning, start, stop, reset } = useTimer({
 *   onTimeUp: () => console.log('Time up!'),
 * });
 *
 * return (
 *   <div>
 *     <Timer timeRemaining={timeRemaining} />
 *     <button onClick={start}>Start</button>
 *     <button onClick={stop}>Stop</button>
 *     <button onClick={reset}>Reset</button>
 *   </div>
 * );
 * ```
 */
export const useTimer = ({
  onTimeUp,
  initialTime = GAME_RULES.TIME_LIMIT,
}: UseTimerOptions): UseTimerReturn => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // onTimeUpコールバックを最新の状態に保つ
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // タイマー開始
  const start = useCallback(() => {
    if (isRunning) {
      return; // 既に開始済みの場合は何もしない
    }

    setIsRunning(true);
  }, [isRunning]);

  // タイマー停止
  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // タイマーリセット
  const reset = useCallback(() => {
    stop();
    setTimeRemaining(initialTime);
  }, [stop, initialTime]);

  // タイマーの動作ロジック
  useEffect(() => {
    if (!isRunning) {
      return;
    }

    intervalRef.current = window.setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;

        // 0秒になった場合
        if (next <= 0) {
          setIsRunning(false);
          if (intervalRef.current !== null) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onTimeUpRef.current();
          return 0;
        }

        return next;
      });
    }, 1000);

    // クリーンアップ
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  return {
    timeRemaining,
    isRunning,
    start,
    stop,
    reset,
  };
};
