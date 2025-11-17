/**
 * GameService - ゲームセッション管理サービス
 * タスク5.1: ゲーム開始処理の実装
 */

import { GameSession, QuestionPayload } from '../types-shared/models';
import { Result } from '../types/common';
import { randomBytes } from 'crypto';
import { SessionRepository } from '../repositories/SessionRepository';
import { QuestionService } from './QuestionService';
import { AnswerValidator } from './AnswerValidator';
import { SCORING_RULES, GAME_RULES } from '../types-shared/constants';

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
 * 回答結果
 */
export interface AnswerResult {
  correct: boolean;
  score: number;
  nextTurn: number;
  gameCompleted: boolean;
}

/**
 * GameService - ゲームセッションの状態管理とビジネスロジックを担当
 */
export class GameService {
  private readonly sessionRepository: SessionRepository;
  private readonly questionService: QuestionService;
  private readonly answerValidator: AnswerValidator;

  constructor(
    sessionRepository?: SessionRepository,
    questionService?: QuestionService,
    answerValidator?: AnswerValidator
  ) {
    this.sessionRepository = sessionRepository || new SessionRepository();
    this.questionService = questionService || new QuestionService();
    this.answerValidator = answerValidator || new AnswerValidator();
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
   * 回答を送信して正誤判定を行う
   * @param sessionId セッションID
   * @param playerId プレイヤーID
   * @param answer 回答
   * @returns 回答結果
   */
  async submitAnswer(
    sessionId: string,
    playerId: string,
    answer: string
  ): Promise<Result<AnswerResult, GameServiceError>> {
    try {
      // セッションを取得
      const session = await this.sessionRepository.findById(sessionId);
      if (!session) {
        return {
          success: false,
          error: {
            type: 'SessionNotFound',
            message: `Session not found: ${sessionId}`,
          },
        };
      }

      // 問題データを取得
      const questionResult = await this.questionService.getQuestionById(session.questionId);
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

      // AnswerValidatorで正誤判定
      const validationResult = this.answerValidator.validate(
        answer,
        question.answers,
        question.acceptableVariations
      );

      // 回答結果を作成
      let nextTurn = session.currentTurn;
      let score = 0;
      let gameCompleted = false;

      if (validationResult.isCorrect) {
        // 正解の場合
        score = SCORING_RULES.SCORE_PER_ANSWER;
        nextTurn = session.currentTurn + 1;

        // 回答をセッションに追加
        session.answers.push({
          playerId,
          answer,
          isCorrect: true,
          timestamp: Date.now(),
        });

        // 5つの正解が揃ったかチェック
        const correctAnswersCount = session.answers.filter((a) => a.isCorrect).length;
        if (correctAnswersCount >= GAME_RULES.REQUIRED_ANSWERS) {
          gameCompleted = true;
          session.status = 'completed';
        }
      } else {
        // 不正解の場合、同じプレイヤーが再回答
        session.answers.push({
          playerId,
          answer,
          isCorrect: false,
          timestamp: Date.now(),
        });
      }

      // セッションを更新
      session.currentTurn = nextTurn;
      await this.sessionRepository.save(session);

      return {
        success: true,
        value: {
          correct: validationResult.isCorrect,
          score,
          nextTurn,
          gameCompleted,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          type: 'DatabaseError',
          message: `Failed to submit answer: ${error.message}`,
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
