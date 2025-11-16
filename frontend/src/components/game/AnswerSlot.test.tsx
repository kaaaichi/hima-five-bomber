/**
 * AnswerSlot Component - Unit Tests (TDD)
 * タスク6.4: 回答結果の反映（フロントエンド）
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerSlot } from './AnswerSlot';

describe('AnswerSlot Component', () => {
  describe('回答枠の基本表示', () => {
    it('Given 回答枠がレンダリングされる When 回答順が表示される Then 1番目として表示される', () => {
      // Arrange & Act
      render(
        <AnswerSlot
          slotIndex={0}
          isCurrent={false}
          isMySlot={false}
          answer={null}
        />
      );

      // Assert
      const slotNumber = screen.getByText('1番目');
      expect(slotNumber).toBeInTheDocument();
    });

    it('Given slotIndexが4 When レンダリングされる Then 5番目として表示される', () => {
      // Arrange & Act
      render(
        <AnswerSlot
          slotIndex={4}
          isCurrent={false}
          isMySlot={false}
          answer={null}
        />
      );

      // Assert
      const slotNumber = screen.getByText('5番目');
      expect(slotNumber).toBeInTheDocument();
    });
  });

  describe('現在の回答順のハイライト', () => {
    it('Given isCurrentがtrue When レンダリングされる Then ハイライト表示される', () => {
      // Arrange & Act
      const { container } = render(
        <AnswerSlot
          slotIndex={0}
          isCurrent={true}
          isMySlot={false}
          answer={null}
        />
      );

      // Assert
      const slot = container.firstChild;
      expect(slot).toHaveClass('ring-2');
      expect(slot).toHaveClass('ring-blue-500');
    });
  });

  describe('自分の回答枠の強調表示', () => {
    it('Given isMySlotがtrue When レンダリングされる Then 特別な色で強調される', () => {
      // Arrange & Act
      const { container } = render(
        <AnswerSlot
          slotIndex={0}
          isCurrent={false}
          isMySlot={true}
          answer={null}
        />
      );

      // Assert
      const slot = container.firstChild;
      expect(slot).toHaveClass('bg-yellow-50');
      expect(slot).toHaveClass('border-yellow-400');
    });
  });

  describe('正解の表示', () => {
    it('Given 回答が正解 When レンダリングされる Then 正解マークが表示される', () => {
      // Arrange & Act
      render(
        <AnswerSlot
          slotIndex={0}
          isCurrent={false}
          isMySlot={false}
          answer={{ correct: true, score: 10 }}
        />
      );

      // Assert
      const correctMark = screen.getByText('✓');
      expect(correctMark).toBeInTheDocument();
    });
  });

  describe('不正解の表示', () => {
    it('Given 回答が不正解 When レンダリングされる Then 不正解マークが表示される', () => {
      // Arrange & Act
      render(
        <AnswerSlot
          slotIndex={0}
          isCurrent={false}
          isMySlot={false}
          answer={{ correct: false }}
        />
      );

      // Assert
      const incorrectMark = screen.getByText('✗');
      expect(incorrectMark).toBeInTheDocument();
    });
  });
});
