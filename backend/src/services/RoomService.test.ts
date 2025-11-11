/**
 * RoomService Unit Tests (TDD: Red Phase)
 * ルーム管理のビジネスロジックをテスト
 */

import { RoomService } from './RoomService';
import { RoomRepository } from '../repositories/RoomRepository';
import { Room, Player } from '../types-shared/models';

// モックリポジトリ
jest.mock('../repositories/RoomRepository');

describe('RoomService', () => {
  let service: RoomService;
  let mockRepository: jest.Mocked<RoomRepository>;

  beforeEach(() => {
    mockRepository = new RoomRepository('test-table') as jest.Mocked<RoomRepository>;
    service = new RoomService(mockRepository);
  });

  describe('createRoom', () => {
    test('Given valid host name WHEN createRoom is called THEN unique roomId is generated and room is created', async () => {
      // Arrange
      const hostName = 'Host Player';

      mockRepository.create = jest.fn().mockImplementation((room: Room) => {
        return Promise.resolve({ success: true, value: room });
      });

      // Act
      const result = await service.createRoom(hostName);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value.roomId).toMatch(/^[a-z0-9]{6}$/); // 6文字のランダムID
        expect(result.value.hostId).toBeTruthy();
        expect(result.value.players).toHaveLength(1);
        expect(result.value.players[0].name).toBe(hostName);
        expect(result.value.status).toBe('waiting');
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    test('Given empty host name WHEN createRoom is called THEN validation error is returned', async () => {
      // Arrange
      const hostName = '';

      // Act
      const result = await service.createRoom(hostName);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('ValidationError');
        if (result.error.type === 'ValidationError') {
          expect(result.error.message).toContain('Host name');
        }
      }
    });

    test('Given repository error WHEN createRoom is called THEN error is returned', async () => {
      // Arrange
      const hostName = 'Host Player';

      mockRepository.create = jest.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'ConnectionError',
          message: 'Database connection failed',
        },
      });

      // Act
      const result = await service.createRoom(hostName);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.type).toBe('DatabaseError');
      }
    });
  });

  describe('getRoom', () => {
    test('Given existing roomId WHEN getRoom is called THEN room is returned', async () => {
      // Arrange
      const roomId = 'abc123';
      const mockRoom: Room = {
        roomId: 'abc123',
        hostId: 'player-123',
        players: [
          {
            playerId: 'player-123',
            name: 'Host Player',
            joinedAt: Date.now(),
          },
        ],
        status: 'waiting',
        createdAt: Date.now(),
      };

      mockRepository.get = jest.fn().mockResolvedValue({
        success: true,
        value: mockRoom,
      });

      // Act
      const result = await service.getRoom(roomId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).not.toBeNull();
        if (result.value) {
          expect(result.value.roomId).toBe('abc123');
        }
      }

      expect(mockRepository.get).toHaveBeenCalledWith('abc123');
    });

    test('Given non-existing roomId WHEN getRoom is called THEN null is returned', async () => {
      // Arrange
      const roomId = 'nonexistent';

      mockRepository.get = jest.fn().mockResolvedValue({
        success: true,
        value: null,
      });

      // Act
      const result = await service.getRoom(roomId);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.value).toBeNull();
      }
    });
  });
});
