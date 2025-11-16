/**
 * GameService - ゲームセッション管理サービス
 * タスク5.1: ゲーム開始処理の実装
 */

import { GameSession, QuestionPayload } from '../types-shared/models';
import { Result, RepositoryError } from '../types/common';
import { randomBytes } from 'crypto';
import { SessionRepository } from '../repositories/SessionRepository';
import { QuestionService } from './QuestionService';

/**
 * GameServiceエラー型
 */
export type GameServiceError =
  | { type: 'QuestionNotFound'; message: string }
  | { type: 'DatabaseError'; message: string }
  | { type: 'SessionNotFound'; message: string }
  | { type: 'InvalidTurn'; message: string };

/**
 * ゲーム開始レスポンス
 */
export interface StartGameResponse {
  sessionId: string;
  roomId: string;
  questionId: string;
  startedAt: number;
  currentTurn: number;
  answers: any[];
  status: 'playing' | 'completed' | 'timeout';
  questionPayload: QuestionPayload;
}

/**
 * GameService - ゲームセッションの状態管理とビジネスロジックを担当
 */
export class GameService {
  private readonly sessionRepository: SessionRepository;
  private readonly questionService: QuestionService;

  constructor(sessionRepository?: SessionRepository, questionService?: QuestionService) {
    this.sessionRepository = sessionRepository || new SessionRepository();
    this.questionService = questionService || new QuestionService();
  }

  /**
   * ゲームを開始する
   * @param roomId ルームID
   * @param questionId 問題ID
   * @returns ゲームセッションと問題ペイロード
   */
  async startGame(roomId: string, questionId: string): Promise<Result<StartGameResponse, GameServiceError>> {
    try {
      // S3から問題データを取得
      const questionResult = await this.questionService.getQuestionById(questionId);

      if (!questionResult.success) {
        return {
          success: false,
          error: {
            type: 'QuestionNotFound',
            message: `Failed to retrieve question: ${questionResult.error.message}`,
          },
        };
      }

      const question = questionResult.value;

      // ユニークなセッションIDを生成
      const sessionId = this.generateSessionId();

      // ゲームセッションオブジェクトを作成
      const session: GameSession = {
        sessionId,
        roomId,
        questionId,
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      };

      // SessionRepositoryを使用してDBに保存
      await this.sessionRepository.save(session);

      // 問題ペイロード（問題文のみ、正解は含まない）を作成
      const questionPayload: QuestionPayload = {
        questionId: question.id,
        questionText: question.question,
        category: question.category,
        difficulty: question.difficulty,
      };

      return {
        success: true,
        value: {
          ...session,
          questionPayload,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'DatabaseError',
          message: `Failed to start game: ${error.message}`,
        },
      };
    }
  }

  /**
   * セッションIDを生成
   * @returns セッションID
   */
  private generateSessionId(): string {
    return `session-${randomBytes(8).toString('hex')}`;
  }
}
