/**
 * ConnectionRepository - Unit Tests (TDD)
 * Repository層: WebSocket接続データアクセスロジックのテスト
 */

import { ConnectionRepository } from './ConnectionRepository';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { Connection } from '../types-shared/models';

// DynamoDB Document Client のモック
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('ConnectionRepository', () => {
  let connectionRepository: ConnectionRepository;
  const testTableName = 'test-connections-table';

  beforeEach(() => {
    ddbMock.reset();
    connectionRepository = new ConnectionRepository(testTableName);
  });

  describe('save', () => {
    it('Given 接続オブジェクト When save が呼ばれる Then DynamoDBに保存される', async () => {
      // Arrange
      const connection: Connection = {
        connectionId: 'test-conn-123',
        playerId: 'player-456',
        roomId: 'ROOM01',
        connectedAt: Date.now(),
      };

      ddbMock.on(PutCommand).resolves({});

      // Act
      await connectionRepository.save(connection);

      // Assert
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).toBe(1);
      expect(putCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Item: {
          PK: `CONNECTION#${connection.connectionId}`,
          SK: `METADATA`,
          ...connection,
          ttl: expect.any(Number), // TTL は1時間後
        },
      });
    });

    it('Given DynamoDBエラーが発生 When save が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      const connection: Connection = {
        connectionId: 'test-conn-123',
        playerId: 'player-456',
        roomId: 'ROOM01',
        connectedAt: Date.now(),
      };

      ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(connectionRepository.save(connection)).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('findById', () => {
    it('Given 接続が存在する When findById が呼ばれる Then 接続オブジェクトが返される', async () => {
      // Arrange
      const connectionId = 'test-conn-123';
      const mockConnection: Connection = {
        connectionId,
        playerId: 'player-456',
        roomId: 'ROOM01',
        connectedAt: Date.now(),
      };

      ddbMock.on(GetCommand).resolves({ Item: mockConnection });

      // Act
      const result = await connectionRepository.findById(connectionId);

      // Assert
      expect(result).toEqual(mockConnection);
      const getCalls = ddbMock.commandCalls(GetCommand);
      expect(getCalls.length).toBe(1);
      expect(getCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Key: {
          PK: `CONNECTION#${connectionId}`,
          SK: `METADATA`,
        },
      });
    });

    it('Given 接続が存在しない When findById が呼ばれる Then null が返される', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      // Act
      const result = await connectionRepository.findById('NONEXIST');

      // Assert
      expect(result).toBeNull();
    });

    it('Given DynamoDBエラーが発生 When findById が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(connectionRepository.findById('test-conn-123')).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('delete', () => {
    it('Given connectionID When delete が呼ばれる Then DynamoDBから削除される', async () => {
      // Arrange
      const connectionId = 'test-conn-123';
      ddbMock.on(DeleteCommand).resolves({});

      // Act
      await connectionRepository.delete(connectionId);

      // Assert
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).toBe(1);
      expect(deleteCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Key: {
          PK: `CONNECTION#${connectionId}`,
          SK: `METADATA`,
        },
      });
    });

    it('Given DynamoDBエラーが発生 When delete が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      ddbMock.on(DeleteCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(connectionRepository.delete('test-conn-123')).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('findByRoomId', () => {
    it('Given ルーム内に複数の接続が存在する When findByRoomId が呼ばれる Then 接続のリストが返される', async () => {
      // Arrange
      const roomId = 'ROOM01';
      const mockConnections: Connection[] = [
        {
          connectionId: 'conn-1',
          playerId: 'player-1',
          roomId,
          connectedAt: Date.now(),
        },
        {
          connectionId: 'conn-2',
          playerId: 'player-2',
          roomId,
          connectedAt: Date.now(),
        },
      ];

      ddbMock.on(QueryCommand).resolves({ Items: mockConnections });

      // Act
      const result = await connectionRepository.findByRoomId(roomId);

      // Assert
      expect(result).toEqual(mockConnections);
      const queryCalls = ddbMock.commandCalls(QueryCommand);
      expect(queryCalls.length).toBe(1);
      expect(queryCalls[0].args[0].input).toMatchObject({
        TableName: testTableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId,
        },
      });
    });

    it('Given ルーム内に接続が存在しない When findByRoomId が呼ばれる Then 空の配列が返される', async () => {
      // Arrange
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      // Act
      const result = await connectionRepository.findByRoomId('NONEXIST');

      // Assert
      expect(result).toEqual([]);
    });

    it('Given DynamoDBエラーが発生 When findByRoomId が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      ddbMock.on(QueryCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(connectionRepository.findByRoomId('ROOM01')).rejects.toThrow('DynamoDB Error');
    });
  });
});
