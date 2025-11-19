/**
 * QuestionService - 問題管理サービスのテスト
 * タスク5.1: S3から問題データを取得する機能のテスト
 */

import { QuestionService } from './QuestionService';
import { Question } from '../types-shared/models';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { mockClient } from 'aws-sdk-client-mock';
import { sdkStreamMixin } from '@smithy/util-stream';
import { Readable } from 'stream';

// S3 Client のモックを作成
const s3Mock = mockClient(S3Client);

describe('QuestionService', () => {
  let questionService: QuestionService;

  beforeEach(() => {
    // モックをリセット
    s3Mock.reset();

    // テスト用のサービスインスタンスを作成
    questionService = new QuestionService('test-questions-bucket', s3Mock as any);
  });

  describe('getQuestionById', () => {
    it('should retrieve question data from S3', async () => {
      // Arrange
      const questionId = 'geography-easy-001';
      const mockQuestion: Question = {
        id: questionId,
        question: '日本の首都はどこですか？',
        answers: ['東京', 'Tokyo', 'とうきょう', 'トウキョウ', '東京都'],
        acceptableVariations: {
          '東京': ['とうきょう', 'トウキョウ'],
          'Tokyo': ['tokyo', 'TOKYO'],
        },
        category: 'geography',
        difficulty: 'easy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuestionsFile = {
        questions: [mockQuestion],
      };

      // S3レスポンスのモック（questions.jsonを返す）
      const stream = new Readable();
      stream.push(JSON.stringify(mockQuestionsFile));
      stream.push(null);
      const sdkStream = sdkStreamMixin(stream);

      s3Mock.on(GetObjectCommand).resolves({
        Body: sdkStream,
      });

      // Act
      const result = await questionService.getQuestionById(questionId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toEqual(mockQuestion);
      }

      expect(s3Mock.calls()).toHaveLength(1);
      const getObjectCall = s3Mock.call(0);
      expect(getObjectCall.args[0].input).toEqual({
        Bucket: 'test-questions-bucket',
        Key: 'questions.json',
      });
    });

    it('should return error when questions.json does not exist in S3', async () => {
      // Arrange
      const questionId = 'non-existent-question';

      s3Mock.on(GetObjectCommand).rejects({
        name: 'NoSuchKey',
        message: 'The specified key does not exist.',
      });

      // Act
      const result = await questionService.getQuestionById(questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NotFoundError');
        expect(result.error.message).toContain('Questions file not found');
      }
    });

    it('should return error when question ID is not found in questions array', async () => {
      // Arrange
      const questionId = 'non-existent-id';
      const mockQuestion: Question = {
        id: 'existing-id',
        question: 'テスト問題',
        answers: ['答え'],
        acceptableVariations: {},
        category: 'test',
        difficulty: 'easy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockQuestionsFile = {
        questions: [mockQuestion],
      };

      const stream = new Readable();
      stream.push(JSON.stringify(mockQuestionsFile));
      stream.push(null);
      const sdkStream = sdkStreamMixin(stream);

      s3Mock.on(GetObjectCommand).resolves({
        Body: sdkStream,
      });

      // Act
      const result = await questionService.getQuestionById(questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('NotFoundError');
        expect(result.error.message).toContain(`Question not found: ${questionId}`);
      }
    });

    it('should return error when S3 access fails', async () => {
      // Arrange
      const questionId = 'question-123';

      s3Mock.on(GetObjectCommand).rejects(new Error('S3 Access Denied'));

      // Act
      const result = await questionService.getQuestionById(questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('S3Error');
      }
    });

    it('should return error when JSON parsing fails', async () => {
      // Arrange
      const questionId = 'question-123';

      const stream = new Readable();
      stream.push('{ invalid json }');
      stream.push(null);
      const sdkStream = sdkStreamMixin(stream);

      s3Mock.on(GetObjectCommand).resolves({
        Body: sdkStream,
      });

      // Act
      const result = await questionService.getQuestionById(questionId);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ParseError');
      }
    });
  });
});
