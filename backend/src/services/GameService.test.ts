/**
 * GameService - ゲームセッション管理サービスのテスト
 * タスク5.1: ゲーム開始処理のテスト
 */

import { GameService } from './GameService';
import { SessionRepository } from '../repositories/SessionRepository';
import { QuestionService } from '../services/QuestionService';
import { GameSession } from '../types-shared/models';
import { Result } from '../types/common';

// モックの作成
jest.mock('../repositories/SessionRepository');
jest.mock('../services/QuestionService');

describe('GameService', () => {
  let gameService: GameService;
  let mockSessionRepository: jest.Mocked<SessionRepository>;
  let mockQuestionService: jest.Mocked<QuestionService>;

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();

    // モックインスタンスの作成
    mockSessionRepository = new SessionRepository() as jest.Mocked<SessionRepository>;
    mockQuestionService = new QuestionService() as jest.Mocked<QuestionService>;

    // GameServiceのインスタンス作成
    gameService = new GameService(mockSessionRepository, mockQuestionService);
  });

  describe('startGame', () => {
    /**
     * Acceptance Criteria:
     * Given ホストがゲーム開始ボタンをクリックする
     * When バックエンドがゲーム開始リクエストを受信する
     * Then DynamoDB GameSessionsテーブルにセッションが作成される
     */
    it('should create a game session in DynamoDB', async () => {
      // Arrange
      const roomId = 'room-123';
      const questionId = 'question-456';
      const expectedSessionId = expect.stringMatching(/^session-[a-f0-9]{16}$/);

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: questionId,
          question: 'テスト問題',
          answers: ['答え1', '答え2', '答え3', '答え4', '答え5'],
          acceptableVariations: {},
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockResolvedValue();

      // Act
      const result = await gameService.startGame(roomId, questionId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.sessionId).toEqual(expectedSessionId);
        expect(result.value.roomId).toBe(roomId);
        expect(result.value.questionId).toBe(questionId);
        expect(result.value.currentTurn).toBe(0);
        expect(result.value.answers).toEqual([]);
        expect(result.value.status).toBe('playing');
        expect(result.value.startedAt).toBeGreaterThan(0);
      }

      expect(mockSessionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: expectedSessionId,
          roomId,
          questionId,
          currentTurn: 0,
          answers: [],
          status: 'playing',
        })
      );
    });

    /**
     * Acceptance Criteria:
     * And S3から問題JSONが取得される
     */
    it('should retrieve question data from S3', async () => {
      // Arrange
      const roomId = 'room-123';
      const questionId = 'question-456';

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: questionId,
          question: 'テスト問題',
          answers: ['答え1', '答え2', '答え3', '答え4', '答え5'],
          acceptableVariations: {},
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockResolvedValue();

      // Act
      await gameService.startGame(roomId, questionId);

      // Assert
      expect(mockQuestionService.getQuestionById).toHaveBeenCalledWith(questionId);
    });

    /**
     * Acceptance Criteria:
     * And 正解データはクライアントに送信されない
     */
    it('should return question text only (without answers)', async () => {
      // Arrange
      const roomId = 'room-123';
      const questionId = 'question-456';

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: questionId,
          question: 'テスト問題',
          answers: ['答え1', '答え2', '答え3', '答え4', '答え5'],
          acceptableVariations: { '答え1': ['こたえ1'] },
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockResolvedValue();

      // Act
      const result = await gameService.startGame(roomId, questionId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        const questionPayload = result.value.questionPayload;
        expect(questionPayload.questionId).toBe(questionId);
        expect(questionPayload.questionText).toBe('テスト問題');
        expect(questionPayload.category).toBe('geography');
        expect(questionPayload.difficulty).toBe('easy');
        // 正解データが含まれていないことを確認
        expect(questionPayload).not.toHaveProperty('answers');
        expect(questionPayload).not.toHaveProperty('acceptableVariations');
      }
    });

    /**
     * Error case: 問題が存在しない
     */
    it('should return error when question does not exist', async () => {
      // Arrange
      const roomId = 'room-123';
      const questionId = 'invalid-question';

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: false,
        error: {
          type: 'NotFoundError',
          message: 'Question not found',
        },
      });

      // Act
      const result = await gameService.startGame(roomId, questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('QuestionNotFound');
      }

      expect(mockSessionRepository.save).not.toHaveBeenCalled();
    });

    /**
     * Error case: DynamoDBエラー
     */
    it('should handle DynamoDB errors', async () => {
      // Arrange
      const roomId = 'room-123';
      const questionId = 'question-456';

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: questionId,
          question: 'テスト問題',
          answers: ['答え1', '答え2', '答え3', '答え4', '答え5'],
          acceptableVariations: {},
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockRejectedValue(new Error('DynamoDB Error'));

      // Act
      const result = await gameService.startGame(roomId, questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('DatabaseError');
      }
    });
  });
});
