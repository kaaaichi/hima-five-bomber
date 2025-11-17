/**
 * AnswerGrid Component - Unit Tests (TDD)
 * タスク6.4: 回答結果の反映（フロントエンド）
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerGrid } from './AnswerGrid';

describe('AnswerGrid Component', () => {
  describe('5つの回答枠の表示', () => {
    it('Given ゲームが開始される When コンポーネントがレンダリングされる Then 5つの回答枠が表示される', () => {
      // Arrange & Act
      render(
        <AnswerGrid
          currentTurn={0}
          answers={[]}
          mySlotIndex={0}
        />
      );

      // Assert
      expect(screen.getByText('1番目')).toBeInTheDocument();
      expect(screen.getByText('2番目')).toBeInTheDocument();
      expect(screen.getByText('3番目')).toBeInTheDocument();
      expect(screen.getByText('4番目')).toBeInTheDocument();
      expect(screen.getByText('5番目')).toBeInTheDocument();
    });
  });

  describe('現在の回答順のハイライト', () => {
    it('Given currentTurnが2 When レンダリングされる Then 3番目の回答枠がハイライトされる', () => {
      // Arrange & Act
      const { container } = render(
        <AnswerGrid
          currentTurn={2}
          answers={[]}
          mySlotIndex={0}
        />
      );

      // Assert
      const slots = container.querySelectorAll('.ring-2.ring-blue-500');
      expect(slots.length).toBe(1);
    });
  });

  describe('自分の回答枠の強調', () => {
    it('Given mySlotIndexが1 When レンダリングされる Then 2番目の回答枠が強調される', () => {
      // Arrange & Act
      const { container } = render(
        <AnswerGrid
          currentTurn={0}
          answers={[]}
          mySlotIndex={1}
        />
      );

      // Assert
      const mySlots = container.querySelectorAll('.bg-yellow-50.border-yellow-400');
      expect(mySlots.length).toBe(1);
    });
  });

  describe('回答結果の表示', () => {
    it('Given 2つの正解が記録されている When レンダリングされる Then 正解マークが2つ表示される', () => {
      // Arrange
      const answers = [
        { correct: true, score: 10 },
        { correct: true, score: 10 },
      ];

      // Act
      render(
        <AnswerGrid
          currentTurn={2}
          answers={answers}
          mySlotIndex={0}
        />
      );

      // Assert
      const correctMarks = screen.getAllByText('✓');
      expect(correctMarks.length).toBe(2);
    });

    it('Given 1つの不正解と1つの正解がある When レンダリングされる Then それぞれのマークが表示される', () => {
      // Arrange
      const answers = [
        { correct: false },
        { correct: true, score: 10 },
      ];

      // Act
      render(
        <AnswerGrid
          currentTurn={2}
          answers={answers}
          mySlotIndex={0}
        />
      );

      // Assert
      const incorrectMark = screen.getByText('✗');
      expect(incorrectMark).toBeInTheDocument();

      const correctMark = screen.getByText('✓');
      expect(correctMark).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('Given コンポーネントがレンダリングされる When 画面サイズに応じて Then グリッドレイアウトが適用される', () => {
      // Arrange & Act
      const { container } = render(
        <AnswerGrid
          currentTurn={0}
          answers={[]}
          mySlotIndex={0}
        />
      );

      // Assert
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('gap-4');
    });
  });
});
