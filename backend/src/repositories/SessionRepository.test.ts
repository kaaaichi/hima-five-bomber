/**
 * SessionRepository - ゲームセッションリポジトリのテスト
 * タスク5.1: GameSessionsテーブルへのCRUD操作テスト
 */

import { SessionRepository } from './SessionRepository';
import { GameSession } from '../types-shared/models';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

// DynamoDB DocumentClient のモックを作成
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('SessionRepository', () => {
  let repository: SessionRepository;

  beforeEach(() => {
    // モックをリセット
    ddbMock.reset();

    // テスト用のリポジトリインスタンスを作成
    repository = new SessionRepository('test-sessions-table', ddbMock as any);
  });

  describe('save', () => {
    it('should save a game session to DynamoDB', async () => {
      // Arrange
      const session: GameSession = {
        sessionId: 'session-abc123',
        roomId: 'room-123',
        questionId: 'question-456',
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      };

      ddbMock.on(PutCommand).resolves({});

      // Act
      await repository.save(session);

      // Assert
      expect(ddbMock.calls()).toHaveLength(1);
      const putCall = ddbMock.call(0);
      expect(putCall.args[0].input).toEqual({
        TableName: 'test-sessions-table',
        Item: {
          PK: `SESSION#${session.sessionId}`,
          SK: 'METADATA',
          ...session,
        },
      });
    });
  });

  describe('findById', () => {
    it('should retrieve a game session by ID', async () => {
      // Arrange
      const sessionId = 'session-abc123';
      const mockSession: GameSession = {
        sessionId,
        roomId: 'room-123',
        questionId: 'question-456',
        startedAt: Date.now(),
        currentTurn: 2,
        answers: [],
        status: 'playing',
      };

      ddbMock.on(GetCommand).resolves({
        Item: {
          PK: `SESSION#${sessionId}`,
          SK: 'METADATA',
          ...mockSession,
        },
      });

      // Act
      const result = await repository.findById(sessionId);

      // Assert
      expect(result).toEqual(expect.objectContaining(mockSession));
      expect(ddbMock.calls()).toHaveLength(1);
      const getCall = ddbMock.call(0);
      expect(getCall.args[0].input).toEqual({
        TableName: 'test-sessions-table',
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: 'METADATA',
        },
      });
    });

    it('should return null when session does not exist', async () => {
      // Arrange
      const sessionId = 'non-existent-session';

      ddbMock.on(GetCommand).resolves({
        Item: undefined,
      });

      // Act
      const result = await repository.findById(sessionId);

      // Assert
      expect(result).toBeNull();
    });
  });
});
