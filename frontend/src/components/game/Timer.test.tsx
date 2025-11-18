import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Timer } from './Timer';

describe('Timer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('カウントダウン表示', () => {
    it('30秒からカウントダウンが開始される', () => {
      render(<Timer timeRemaining={30} />);

      expect(screen.getByText('30')).toBeInTheDocument();
    });

    it('残り時間が1秒ずつ減少する', () => {
      const { rerender } = render(<Timer timeRemaining={30} />);
      expect(screen.getByText('30')).toBeInTheDocument();

      rerender(<Timer timeRemaining={29} />);
      expect(screen.getByText('29')).toBeInTheDocument();

      rerender(<Timer timeRemaining={28} />);
      expect(screen.getByText('28')).toBeInTheDocument();
    });

    it('0秒まで正しく表示される', () => {
      render(<Timer timeRemaining={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('強調表示', () => {
    it('残り時間が6秒以上の場合、通常表示される', () => {
      const { container } = render(<Timer timeRemaining={10} />);
      const timerValue = container.querySelector('[data-testid="timer-value"]');

      expect(timerValue).not.toHaveClass('text-red-600');
      expect(timerValue).not.toHaveClass('scale-110');
    });

    it('残り時間が5秒以下の場合、警告表示される', () => {
      const { container } = render(<Timer timeRemaining={5} />);
      const timerValue = container.querySelector('[data-testid="timer-value"]');

      expect(timerValue).toHaveClass('text-red-600');
    });

    it('残り時間が3秒以下の場合、さらに強調表示される', () => {
      const { container } = render(<Timer timeRemaining={3} />);
      const timerValue = container.querySelector('[data-testid="timer-value"]');

      expect(timerValue).toHaveClass('text-red-600');
      expect(timerValue).toHaveClass('scale-110');
    });

    it('残り時間が0秒の場合、最大強調表示される', () => {
      const { container } = render(<Timer timeRemaining={0} />);
      const timerValue = container.querySelector('[data-testid="timer-value"]');

      expect(timerValue).toHaveClass('text-red-600');
      expect(timerValue).toHaveClass('scale-125');
    });
  });

  describe('アクセシビリティ', () => {
    it('aria-label属性が設定されている', () => {
      render(<Timer timeRemaining={15} />);

      const timerElement = screen.getByLabelText(/残り時間/);
      expect(timerElement).toBeInTheDocument();
    });

    it('残り時間が5秒以下の場合、aria-live属性が設定される', () => {
      const { container } = render(<Timer timeRemaining={5} />);
      const timerElement = container.querySelector('[data-testid="timer"]');

      expect(timerElement).toHaveAttribute('aria-live', 'assertive');
    });
  });
});
