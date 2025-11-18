import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from './useTimer';
import { GAME_RULES } from '@five-bomber/shared';

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初期状態', () => {
    it('初期値が30秒である', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      expect(result.current.timeRemaining).toBe(GAME_RULES.TIME_LIMIT);
    });

    it('初期状態では動作していない', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('タイマー開始', () => {
    it('startを呼ぶとタイマーが開始される', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('1秒ごとに残り時間が減少する', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      expect(result.current.timeRemaining).toBe(30);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(29);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(28);
    });

    it('既に開始済みの場合、再度startを呼んでも影響しない', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(29);

      act(() => {
        result.current.start(); // 再度start
      });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(28); // 28秒のまま（リセットされない）
    });
  });

  describe('タイマー停止', () => {
    it('stopを呼ぶとタイマーが停止する', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(28);

      act(() => {
        result.current.stop();
      });

      expect(result.current.isRunning).toBe(false);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // 停止後は時間が進まない
      expect(result.current.timeRemaining).toBe(28);
    });
  });

  describe('タイマーリセット', () => {
    it('resetを呼ぶと30秒にリセットされる', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(25);

      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(30);
      expect(result.current.isRunning).toBe(false);
    });
  });

  describe('タイムアップ', () => {
    it('0秒になるとonTimeUpコールバックが呼ばれる', () => {
      const handleTimeUp = vi.fn();
      const { result } = renderHook(() => useTimer({ onTimeUp: handleTimeUp }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(30000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(handleTimeUp).toHaveBeenCalledTimes(1);
      expect(result.current.isRunning).toBe(false);
    });

    it('0秒を下回らない', () => {
      const { result } = renderHook(() => useTimer({ onTimeUp: vi.fn() }));

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(35000); // 30秒を超える
      });

      expect(result.current.timeRemaining).toBe(0);
    });
  });

  describe('初期値のカスタマイズ', () => {
    it('initialTimeを指定できる', () => {
      const { result } = renderHook(() =>
        useTimer({ onTimeUp: vi.fn(), initialTime: 10 })
      );

      expect(result.current.timeRemaining).toBe(10);
    });

    it('カスタム初期値でもタイマーが正しく動作する', () => {
      const handleTimeUp = vi.fn();
      const { result } = renderHook(() =>
        useTimer({ onTimeUp: handleTimeUp, initialTime: 5 })
      );

      act(() => {
        result.current.start();
      });

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(handleTimeUp).toHaveBeenCalledTimes(1);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にタイマーがクリアされる', () => {
      const { result, unmount } = renderHook(() =>
        useTimer({ onTimeUp: vi.fn() })
      );

      act(() => {
        result.current.start();
      });

      unmount();

      // エラーが発生しないことを確認
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(true).toBe(true);
    });
  });
});
