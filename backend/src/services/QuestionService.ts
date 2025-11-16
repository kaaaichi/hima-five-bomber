/**
 * QuestionService - 問題管理サービス
 * タスク5.1: S3から問題データを取得する機能を担当
 */

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Question } from '../types-shared/models';
import { Result, RepositoryError } from '../types/common';

/**
 * QuestionService - 問題の取得・管理を担当するサービス
 */
export class QuestionService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(bucketName?: string, s3Client?: S3Client) {
    this.bucketName = bucketName || process.env.QUESTIONS_BUCKET_NAME || 'five-bomber-questions';
    this.s3Client = s3Client || new S3Client({ region: process.env.AWS_REGION || 'ap-northeast-1' });
  }

  /**
   * 問題IDで問題を取得
   * @param questionId 問題ID
   * @returns 問題オブジェクト
   */
  async getQuestionById(questionId: string): Promise<Result<Question, RepositoryError>> {
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: `questions/${questionId}.json`,
        })
      );

      if (!response.Body) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Question not found: ${questionId}`,
          },
        };
      }

      // ストリームをテキストに変換
      const bodyText = await response.Body.transformToString();

      // JSONをパース
      const question: Question = JSON.parse(bodyText);

      return {
        success: true,
        value: question,
      };
    } catch (error: any) {
      // S3エラーの処理
      if (error.name === 'NoSuchKey') {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            message: `Question not found: ${questionId}`,
          },
        };
      }

      // JSON parseエラーの処理
      if (error instanceof SyntaxError) {
        return {
          success: false,
          error: {
            type: 'ParseError',
            message: `Failed to parse question JSON: ${error.message}`,
          },
        };
      }

      // その他のS3エラー
      return {
        success: false,
        error: {
          type: 'S3Error',
          message: `S3 error: ${error.message}`,
        },
      };
    }
  }
}
