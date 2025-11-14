/**
 * RoomRepository - Unit Tests (TDD)
 * Repository層: データアクセスロジックのテスト
 */

import { RoomRepository } from './RoomRepository';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Room } from '../types-shared/models';

// DynamoDB Document Client のモック
const ddbMock = mockClient(DynamoDBDocumentClient);

describe('RoomRepository', () => {
  let roomRepository: RoomRepository;
  const testTableName = 'test-rooms-table';

  beforeEach(() => {
    ddbMock.reset();
    roomRepository = new RoomRepository(testTableName);
  });

  describe('findById', () => {
    it('Given ルームが存在する When findById が呼ばれる Then ルームオブジェクトが返される', async () => {
      // Arrange
      const roomId = 'TEST01';
      const mockRoom: Room = {
        roomId,
        hostId: 'host-123',
        players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(GetCommand).resolves({ Item: mockRoom });

      // Act
      const result = await roomRepository.findById(roomId);

      // Assert
      expect(result).toEqual(mockRoom);
      const getCalls = ddbMock.commandCalls(GetCommand);
      expect(getCalls.length).toBe(1);
      expect(getCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `METADATA`,
        },
      });
    });

    it('Given ルームが存在しない When findById が呼ばれる Then null が返される', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      // Act
      const result = await roomRepository.findById('NONEXIST');

      // Assert
      expect(result).toBeNull();
    });

    it('Given DynamoDBエラーが発生 When findById が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(roomRepository.findById('TEST01')).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('save', () => {
    it('Given ルームオブジェクト When save が呼ばれる Then DynamoDBに保存される', async () => {
      // Arrange
      const room: Room = {
        roomId: 'TEST01',
        hostId: 'host-123',
        players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(PutCommand).resolves({});

      // Act
      await roomRepository.save(room);

      // Assert
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls.length).toBe(1);
      expect(putCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Item: {
          PK: `ROOM#${room.roomId}`,
          SK: `METADATA`,
          ...room,
        },
      });
    });

    it('Given DynamoDBエラーが発生 When save が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      const room: Room = {
        roomId: 'TEST01',
        hostId: 'host-123',
        players: [],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(roomRepository.save(room)).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('delete', () => {
    it('Given ルームID When delete が呼ばれる Then DynamoDBから削除される', async () => {
      // Arrange
      const roomId = 'TEST01';
      ddbMock.on(DeleteCommand).resolves({});

      // Act
      await roomRepository.delete(roomId);

      // Assert
      const deleteCalls = ddbMock.commandCalls(DeleteCommand);
      expect(deleteCalls.length).toBe(1);
      expect(deleteCalls[0].args[0].input).toEqual({
        TableName: testTableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `METADATA`,
        },
      });
    });

    it('Given DynamoDBエラーが発生 When delete が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      ddbMock.on(DeleteCommand).rejects(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(roomRepository.delete('TEST01')).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('existsById', () => {
    it('Given ルームが存在する When existsById が呼ばれる Then true が返される', async () => {
      // Arrange
      const mockRoom: Room = {
        roomId: 'TEST01',
        hostId: 'host-123',
        players: [],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(GetCommand).resolves({ Item: mockRoom });

      // Act
      const result = await roomRepository.existsById('TEST01');

      // Assert
      expect(result).toBe(true);
    });

    it('Given ルームが存在しない When existsById が呼ばれる Then false が返される', async () => {
      // Arrange
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      // Act
      const result = await roomRepository.existsById('NONEXIST');

      // Assert
      expect(result).toBe(false);
    });
  });
});
