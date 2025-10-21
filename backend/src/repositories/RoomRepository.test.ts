/**
 * RoomRepository Unit Tests (TDD: Red Phase)
 * DynamoDBへのRoom CRUD操作のテスト
 */

import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { RoomRepository } from './RoomRepository';
import { Room, Player } from '@five-bomber/shared/types/models';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('RoomRepository', () => {
  let repository: RoomRepository;

  beforeEach(() => {
    ddbMock.reset();
    repository = new RoomRepository(process.env.DYNAMODB_ROOMS_TABLE || 'five-bomber-rooms');
  });

  describe('create', () => {
    test('Given valid room data WHEN create is called THEN room is saved to DynamoDB', async () => {
      // Arrange
      const hostPlayer: Player = {
        playerId: 'player-123',
        name: 'Host Player',
        joinedAt: Date.now(),
      };

      const room: Room = {
        roomId: 'room-abc123',
        hostId: 'player-123',
        players: [hostPlayer],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await repository.create(room);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.roomId).toBe('room-abc123');
        expect(result.value.hostId).toBe('player-123');
        expect(result.value.players).toHaveLength(1);
      }

      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.Item).toMatchObject({
        PK: 'ROOM#room-abc123',
        SK: 'METADATA',
        roomId: 'room-abc123',
        hostId: 'player-123',
        status: 'waiting',
      });
    });

    test('Given DynamoDB error WHEN create is called THEN error result is returned', async () => {
      // Arrange
      const room: Room = {
        roomId: 'room-abc123',
        hostId: 'player-123',
        players: [],
        status: 'waiting',
        createdAt: Date.now(),
      };

      ddbMock.on(PutCommand).rejects(new Error('DynamoDB connection failed'));

      // Act
      const result = await repository.create(room);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ConnectionError');
        if (result.error.type === 'ConnectionError') {
          expect(result.error.message).toContain('DynamoDB connection failed');
        }
      }
    });
  });

  describe('get', () => {
    test('Given existing roomId WHEN get is called THEN room is retrieved', async () => {
      // Arrange
      const roomId = 'room-abc123';
      const mockItem = {
        PK: 'ROOM#room-abc123',
        SK: 'METADATA',
        roomId: 'room-abc123',
        hostId: 'player-123',
        players: [
          {
            playerId: 'player-123',
            name: 'Host Player',
            joinedAt: 1234567890,
          },
        ],
        status: 'waiting',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      ddbMock.on(GetCommand).resolves({ Item: mockItem });

      // Act
      const result = await repository.get(roomId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).not.toBeNull();
        if (result.value) {
          expect(result.value.roomId).toBe('room-abc123');
          expect(result.value.hostId).toBe('player-123');
          expect(result.value.players).toHaveLength(1);
        }
      }

      expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
      const getCall = ddbMock.commandCalls(GetCommand)[0];
      expect(getCall.args[0].input.Key).toEqual({
        PK: 'ROOM#room-abc123',
        SK: 'METADATA',
      });
    });

    test('Given non-existing roomId WHEN get is called THEN null is returned', async () => {
      // Arrange
      const roomId = 'room-nonexistent';
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      // Act
      const result = await repository.get(roomId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeNull();
      }
    });
  });
});
