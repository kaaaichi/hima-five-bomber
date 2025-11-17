/**
 * AnswerFeedback Component - Unit Tests (TDD)
 * タスク6.4: 回答結果の反映（フロントエンド）
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnswerFeedback } from './AnswerFeedback';

describe('AnswerFeedback Component', () => {
  describe('正解時の表示', () => {
    it('Given 回答が正解である When コンポーネントがレンダリングされる Then 正解マークが表示される', () => {
      // Arrange & Act
      render(<AnswerFeedback correct={true} />);

      // Assert
      const correctMark = screen.getByText('✓');
      expect(correctMark).toBeInTheDocument();
      expect(correctMark).toHaveClass('text-green-500');
    });

    it('Given スコアが提供される When 正解の場合 Then スコアが表示される', () => {
      // Arrange & Act
      render(<AnswerFeedback correct={true} score={10} />);

      // Assert
      const score = screen.getByText('+10点');
      expect(score).toBeInTheDocument();
    });
  });

  describe('不正解時の表示', () => {
    it('Given 回答が不正解である When コンポーネントがレンダリングされる Then 不正解マークが表示される', () => {
      // Arrange & Act
      render(<AnswerFeedback correct={false} />);

      // Assert
      const incorrectMark = screen.getByText('✗');
      expect(incorrectMark).toBeInTheDocument();
      expect(incorrectMark).toHaveClass('text-red-500');
    });

    it('Given 不正解である When コンポーネントがレンダリングされる Then フィードバックメッセージが表示される', () => {
      // Arrange & Act
      render(<AnswerFeedback correct={false} />);

      // Assert
      const feedback = screen.getByText('不正解');
      expect(feedback).toBeInTheDocument();
    });
  });

  describe('未回答時の表示', () => {
    it('Given correctがnullである When コンポーネントがレンダリングされる Then 空の表示になる', () => {
      // Arrange & Act
      const { container } = render(<AnswerFeedback correct={null} />);

      // Assert
      expect(container.firstChild).toBeNull();
    });
  });

  describe('アニメーション', () => {
    it('Given 正解である When コンポーネントがレンダリングされる Then アニメーションクラスが適用される', () => {
      // Arrange & Act
      render(<AnswerFeedback correct={true} />);

      // Assert
      const container = screen.getByText('✓').parentElement;
      expect(container).toHaveClass('animate-pulse');
    });
  });
});
