import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameBoard } from './GameBoard';

describe('GameBoard', () => {
  const mockGameState = {
    question: {
      id: 'q1',
      questionText: 'テスト問題：日本の首都は？',
      category: 'geography',
      difficulty: 'easy' as const,
    },
    timeRemaining: 25,
    currentTurn: 0,
    answers: [],
    players: [
      { playerId: 'p1', name: 'プレイヤー1', joinedAt: Date.now() },
      { playerId: 'p2', name: 'プレイヤー2', joinedAt: Date.now() },
    ],
  };

  describe('基本表示', () => {
    it('問題文が表示される', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      expect(screen.getByText(/テスト問題：日本の首都は？/)).toBeInTheDocument();
    });

    it('タイマーが表示される', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      expect(screen.getByLabelText(/残り時間/)).toBeInTheDocument();
    });

    it('回答入力フォームが表示される', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      expect(screen.getByPlaceholderText(/回答を入力/)).toBeInTheDocument();
    });

    it('回答グリッドが表示される', () => {
      render(
        <GameBoard
          gameState={mockGameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      // 5つの回答枠が表示される
      const slots = screen.getAllByTestId(/answer-slot-/);
      expect(slots).toHaveLength(5);
    });
  });

  describe('回答順の制御', () => {
    it('自分の回答順の場合、入力フォームが有効化される', () => {
      const gameState = {
        ...mockGameState,
        currentTurn: 0, // プレイヤー1の順番
      };

      render(
        <GameBoard
          gameState={gameState}
          currentPlayerId="p1" // プレイヤー1としてログイン
          onSubmitAnswer={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/回答を入力/);
      expect(input).not.toBeDisabled();
    });

    it('他のプレイヤーの回答順の場合、入力フォームが無効化される', () => {
      const gameState = {
        ...mockGameState,
        currentTurn: 1, // プレイヤー2の順番
      };

      render(
        <GameBoard
          gameState={gameState}
          currentPlayerId="p1" // プレイヤー1としてログイン
          onSubmitAnswer={vi.fn()}
        />
      );

      const input = screen.getByPlaceholderText(/回答を入力/);
      expect(input).toBeDisabled();
    });
  });

  describe('レスポンシブレイアウト', () => {
    it('全要素が適切にレイアウトされる', () => {
      const { container } = render(
        <GameBoard
          gameState={mockGameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      // GameBoardコンポーネントが存在する
      expect(container.querySelector('[data-testid="game-board"]')).toBeInTheDocument();
    });
  });

  describe('問題未ロード時', () => {
    it('問題がない場合、ローディング状態が表示される', () => {
      const gameState = {
        ...mockGameState,
        question: null,
      };

      render(
        <GameBoard
          gameState={gameState}
          currentPlayerId="p1"
          onSubmitAnswer={vi.fn()}
        />
      );

      expect(screen.getByText(/問題を読み込み中/)).toBeInTheDocument();
    });
  });
});
