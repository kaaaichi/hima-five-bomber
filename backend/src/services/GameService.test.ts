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

  describe('submitAnswer', () => {
    /**
     * Acceptance Criteria:
     * Given プレイヤーが回答を送信する
     * When submitAnswerハンドラーが回答を受信する
     * Then 回答がバリデーションされる
     * And AnswerValidatorで正誤判定が実行される
     * And レスポンスに { correct: boolean, score?: number } が含まれる
     */
    it('should validate answer and return correct result', async () => {
      // Arrange
      const sessionId = 'session-123';
      const playerId = 'player-1';
      const answer = 'とうきょう';

      // セッションデータをモック
      mockSessionRepository.findById.mockResolvedValue({
        sessionId,
        roomId: 'room-123',
        questionId: 'question-456',
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      });

      // 問題データをモック
      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: 'question-456',
          question: '日本の首都は？',
          answers: ['東京', 'Tokyo'],
          acceptableVariations: {
            '東京': ['とうきょう', 'トウキョウ'],
          },
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockResolvedValue();

      // Act
      const result = await gameService.submitAnswer(sessionId, playerId, answer);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.correct).toBe(true);
        expect(result.value.score).toBe(10); // 正解1つあたり10点
        expect(result.value.nextTurn).toBe(1);
        expect(result.value.gameCompleted).toBe(false);
      }
    });

    it('should return incorrect result for wrong answer', async () => {
      // Arrange
      const sessionId = 'session-123';
      const playerId = 'player-1';
      const answer = '大阪'; // 不正解

      mockSessionRepository.findById.mockResolvedValue({
        sessionId,
        roomId: 'room-123',
        questionId: 'question-456',
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      });

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: 'question-456',
          question: '日本の首都は？',
          answers: ['東京', 'Tokyo'],
          acceptableVariations: {
            '東京': ['とうきょう', 'トウキョウ'],
          },
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      // Act
      const result = await gameService.submitAnswer(sessionId, playerId, answer);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.correct).toBe(false);
        expect(result.value.score).toBe(0);
        expect(result.value.nextTurn).toBe(0); // 不正解なので同じプレイヤーが再回答
      }
    });

    it('should return error when session does not exist', async () => {
      // Arrange
      const sessionId = 'invalid-session';
      const playerId = 'player-1';
      const answer = '東京';

      mockSessionRepository.findById.mockResolvedValue(null);

      // Act
      const result = await gameService.submitAnswer(sessionId, playerId, answer);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('SessionNotFound');
      }
    });

    it('should detect game completion when 5 correct answers are collected', async () => {
      // Arrange
      const sessionId = 'session-123';
      const playerId = 'player-5';
      const answer = '東京';

      mockSessionRepository.findById.mockResolvedValue({
        sessionId,
        roomId: 'room-123',
        questionId: 'question-456',
        startedAt: Date.now(),
        currentTurn: 4,
        answers: [
          { playerId: 'player-1', answer: '答え1', isCorrect: true, timestamp: Date.now() },
          { playerId: 'player-2', answer: '答え2', isCorrect: true, timestamp: Date.now() },
          { playerId: 'player-3', answer: '答え3', isCorrect: true, timestamp: Date.now() },
          { playerId: 'player-4', answer: '答え4', isCorrect: true, timestamp: Date.now() },
        ],
        status: 'playing',
      });

      mockQuestionService.getQuestionById.mockResolvedValue({
        success: true,
        value: {
          id: 'question-456',
          question: '日本の首都は？',
          answers: ['東京', 'Tokyo'],
          acceptableVariations: {},
          category: 'geography',
          difficulty: 'easy',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      mockSessionRepository.save.mockResolvedValue();

      // Act
      const result = await gameService.submitAnswer(sessionId, playerId, answer);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.correct).toBe(true);
        expect(result.value.gameCompleted).toBe(true);
      }
    });
  });
});
