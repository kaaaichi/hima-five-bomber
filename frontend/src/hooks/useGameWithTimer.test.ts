import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameWithTimer } from './useGameWithTimer';

describe('useGameWithTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('ゲーム状態とタイマーが初期化される', () => {
      const { result } = renderHook(() => useGameWithTimer());

      expect(result.current.gameState.isPlaying).toBe(false);
      expect(result.current.timeRemaining).toBe(30);
      expect(result.current.isTimerRunning).toBe(false);
    });
  });

  describe('問題開始時', () => {
    it('questionStartメッセージを受信するとタイマーが開始される', () => {
      const { result } = renderHook(() => useGameWithTimer());

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      expect(result.current.gameState.isPlaying).toBe(true);
      expect(result.current.isTimerRunning).toBe(true);
      expect(result.current.timeRemaining).toBe(30);
    });

    it('タイマーが1秒ごとにカウントダウンする', () => {
      const { result } = renderHook(() => useGameWithTimer());

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(29);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(27);
    });
  });

  describe('タイムアップ時', () => {
    it('0秒になるとonTimeUpコールバックが呼ばれる', () => {
      const handleTimeUp = vi.fn();
      const { result } = renderHook(() =>
        useGameWithTimer({ onTimeUp: handleTimeUp })
      );

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(handleTimeUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('回答結果受信時', () => {
    it('answerResultメッセージを受信してもタイマーは動き続ける', () => {
      const { result } = renderHook(() => useGameWithTimer());

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(25);

      act(() => {
        result.current.handleMessage({
          type: 'answerResult',
          payload: {
            correct: true,
            score: 15,
            nextTurn: 1,
          },
        });
      });

      expect(result.current.isTimerRunning).toBe(true);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(24);
    });
  });

  describe('ゲーム終了時', () => {
    it('gameOverメッセージを受信するとタイマーが停止する', () => {
      const { result } = renderHook(() => useGameWithTimer());

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(25);

      act(() => {
        result.current.handleMessage({
          type: 'gameOver',
          payload: {
            success: true,
            totalScore: 100,
            timeBonus: 0,
          },
        });
      });

      expect(result.current.isTimerRunning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // タイマーが停止しているので時間は進まない
      expect(result.current.timeRemaining).toBe(25);
    });
  });

  describe('リセット', () => {
    it('resetを呼ぶとゲーム状態とタイマーがリセットされる', () => {
      const { result } = renderHook(() => useGameWithTimer());

      act(() => {
        result.current.handleMessage({
          type: 'questionStart',
          payload: {
            questionId: 'q-test-1',
            questionText: 'テスト問題',
            category: 'テスト',
            difficulty: 'easy',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.timeRemaining).toBe(20);
      expect(result.current.gameState.isPlaying).toBe(true);

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(30);
      expect(result.current.gameState.isPlaying).toBe(false);
      expect(result.current.isTimerRunning).toBe(false);
    });
  });
});
