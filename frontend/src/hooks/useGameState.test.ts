/**
 * useGameState Hook - Unit Tests (TDD)
 * タスク4.5: リアルタイム状態同期（フロントエンド）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import type { WebSocketMessage } from './useWebSocket';

describe('useGameState Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('Given useGameStateがマウントされる When 初期化される Then 初期状態が設定される', () => {
      // Arrange & Act
      const { result } = renderHook(() => useGameState());

      // Assert
      expect(result.current.gameState).toEqual({
        question: null,
        answers: [],
        currentTurn: 0,
        timeRemaining: 30,
        isPlaying: false,
      });
    });
  });

  describe('questionStart メッセージ処理', () => {
    it('Given questionStartメッセージを受信 When handleMessageが呼ばれる Then 問題データが保存される', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      const message: WebSocketMessage = {
        type: 'questionStart',
        payload: {
          questionId: 'q-123',
          questionText: 'テスト問題',
          category: 'general',
          difficulty: 'medium',
        },
      };

      // Act
      act(() => {
        result.current.handleMessage(message);
      });

      // Assert
      expect(result.current.gameState.question).toEqual({
        questionId: 'q-123',
        questionText: 'テスト問題',
        category: 'general',
        difficulty: 'medium',
      });
      expect(result.current.gameState.isPlaying).toBe(true);
      expect(result.current.gameState.timeRemaining).toBe(30);
      expect(result.current.gameState.currentTurn).toBe(0);
      expect(result.current.gameState.answers).toEqual([]);
    });
  });

  describe('answerResult メッセージ処理', () => {
    it('Given answerResultメッセージを受信 When 正解判定が返される Then answersに回答が追加される', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      // まず問題を開始
      const questionMessage: WebSocketMessage = {
        type: 'questionStart',
        payload: {
          questionId: 'q-123',
          questionText: 'テスト問題',
          category: 'general',
          difficulty: 'medium',
        },
      };

      act(() => {
        result.current.handleMessage(questionMessage);
      });

      // Act - 回答結果を受信
      const answerMessage: WebSocketMessage = {
        type: 'answerResult',
        payload: {
          correct: true,
          score: 100,
          nextTurn: 1,
        },
      };

      act(() => {
        result.current.handleMessage(answerMessage);
      });

      // Assert
      expect(result.current.gameState.currentTurn).toBe(1);
      expect(result.current.gameState.answers.length).toBe(1);
      expect(result.current.gameState.answers[0]).toEqual({
        correct: true,
        score: 100,
      });
    });

    it('Given 不正解の回答結果 When handleMessageが呼ばれる Then currentTurnが進む', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      // 問題開始
      const questionMessage: WebSocketMessage = {
        type: 'questionStart',
        payload: {
          questionId: 'q-123',
          questionText: 'テスト問題',
          category: 'general',
          difficulty: 'medium',
        },
      };

      act(() => {
        result.current.handleMessage(questionMessage);
      });

      // Act - 不正解の結果
      const answerMessage: WebSocketMessage = {
        type: 'answerResult',
        payload: {
          correct: false,
          nextTurn: 1,
        },
      };

      act(() => {
        result.current.handleMessage(answerMessage);
      });

      // Assert
      expect(result.current.gameState.currentTurn).toBe(1);
      expect(result.current.gameState.answers[0]).toEqual({
        correct: false,
        score: undefined,
      });
    });
  });

  describe('rankingUpdate メッセージ処理', () => {
    it('Given rankingUpdateメッセージを受信 When handleMessageが呼ばれる Then ランキング情報が保存される', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      const message: WebSocketMessage = {
        type: 'rankingUpdate',
        payload: {
          rankings: [
            {
              roomId: 'room-1',
              teamName: 'Team A',
              score: 500,
              rank: 1,
            },
            {
              roomId: 'room-2',
              teamName: 'Team B',
              score: 300,
              rank: 2,
            },
          ],
        },
      };

      // Act
      act(() => {
        result.current.handleMessage(message);
      });

      // Assert
      expect(result.current.gameState.rankings).toEqual([
        {
          roomId: 'room-1',
          teamName: 'Team A',
          score: 500,
          rank: 1,
        },
        {
          roomId: 'room-2',
          teamName: 'Team B',
          score: 300,
          rank: 2,
        },
      ]);
    });
  });

  describe('gameOver メッセージ処理', () => {
    it('Given gameOverメッセージを受信 When handleMessageが呼ばれる Then ゲーム結果が保存される', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      // 問題開始
      const questionMessage: WebSocketMessage = {
        type: 'questionStart',
        payload: {
          questionId: 'q-123',
          questionText: 'テスト問題',
          category: 'general',
          difficulty: 'medium',
        },
      };

      act(() => {
        result.current.handleMessage(questionMessage);
      });

      // Act - ゲーム終了
      const gameOverMessage: WebSocketMessage = {
        type: 'gameOver',
        payload: {
          success: true,
          totalScore: 500,
          timeBonus: 100,
        },
      };

      act(() => {
        result.current.handleMessage(gameOverMessage);
      });

      // Assert
      expect(result.current.gameState.isPlaying).toBe(false);
      expect(result.current.gameState.gameResult).toEqual({
        success: true,
        totalScore: 500,
        timeBonus: 100,
      });
    });
  });

  describe('error メッセージ処理', () => {
    it('Given errorメッセージを受信 When handleMessageが呼ばれる Then エラー情報が保存される', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      const message: WebSocketMessage = {
        type: 'error',
        payload: {
          message: 'テストエラー',
          code: '400',
        },
      };

      // Act
      act(() => {
        result.current.handleMessage(message);
      });

      // Assert
      expect(result.current.gameState.error).toEqual({
        message: 'テストエラー',
        code: '400',
      });
    });
  });

  describe('状態リセット', () => {
    it('Given ゲーム状態が存在する When resetStateが呼ばれる Then 初期状態にリセットされる', () => {
      // Arrange
      const { result } = renderHook(() => useGameState());

      // 問題を開始してゲーム状態を設定
      const questionMessage: WebSocketMessage = {
        type: 'questionStart',
        payload: {
          questionId: 'q-123',
          questionText: 'テスト問題',
          category: 'general',
          difficulty: 'medium',
        },
      };

      act(() => {
        result.current.handleMessage(questionMessage);
      });

      // Act - リセット
      act(() => {
        result.current.resetState();
      });

      // Assert
      expect(result.current.gameState).toEqual({
        question: null,
        answers: [],
        currentTurn: 0,
        timeRemaining: 30,
        isPlaying: false,
      });
    });
  });
});
