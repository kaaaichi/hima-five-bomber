/**
 * RoomService - Unit Tests (TDD)
 * タスク3.1: ルーム作成機能のテスト
 * タスク3.2: ルーム参加機能のテスト
 * タスク3.3: ルーム退出機能のテスト
 * リファクタリング: Repository層のモックを使用
 */

import { RoomService } from './RoomService';
import { RoomRepository } from '../repositories/RoomRepository';
import { Room, Player } from '../types-shared/models';

// RoomRepository をモック
jest.mock('../repositories/RoomRepository');

describe('RoomService', () => {
  let roomService: RoomService;
  let mockRoomRepository: jest.Mocked<RoomRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    // モックインスタンスを作成
    mockRoomRepository = new RoomRepository() as jest.Mocked<RoomRepository>;

    // RoomServiceにモックを注入
    roomService = new RoomService(mockRoomRepository);
  });

  describe('Acceptance Criteria: ルーム作成機能', () => {
    describe('Given ホストユーザーがルーム作成をリクエストする', () => {
      const hostName = 'TestHost';

      it('When createRoom が呼ばれる Then ユニークなルームIDが生成される', async () => {
        // Arrange
        mockRoomRepository.existsById = jest.fn().mockResolvedValue(false);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.createRoom(hostName);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.roomId).toBeDefined();
          expect(result.value.roomId).toMatch(/^[A-Z0-9]{6}$/); // 6桁の英数字
        }
      });

      it('When createRoom が呼ばれる Then DynamoDB Roomsテーブルにルームが保存される', async () => {
        // Arrange
        mockRoomRepository.existsById = jest.fn().mockResolvedValue(false);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        await roomService.createRoom(hostName);

        // Assert
        expect(mockRoomRepository.save).toHaveBeenCalledTimes(1);
        expect(mockRoomRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            roomId: expect.any(String),
            hostId: expect.any(String),
            status: 'waiting',
            players: expect.arrayContaining([
              expect.objectContaining({
                playerId: expect.any(String),
                name: hostName,
                joinedAt: expect.any(Number),
              }),
            ]),
            createdAt: expect.any(Number),
          })
        );
      });

      it('When createRoom が呼ばれる Then レスポンスに roomId と hostId が含まれる', async () => {
        // Arrange
        mockRoomRepository.existsById = jest.fn().mockResolvedValue(false);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.createRoom(hostName);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.roomId).toBeDefined();
          expect(result.value.hostId).toBeDefined();
          expect(typeof result.value.roomId).toBe('string');
          expect(typeof result.value.hostId).toBe('string');
        }
      });

      it('When DynamoDBエラーが発生する Then エラーレスポンスが返される', async () => {
        // Arrange
        mockRoomRepository.existsById = jest.fn().mockResolvedValue(false);
        mockRoomRepository.save = jest.fn().mockRejectedValue(new Error('DynamoDB Connection Error'));

        // Act
        const result = await roomService.createRoom(hostName);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('ConnectionError');
          if (result.error.type === 'ConnectionError') {
            expect(result.error.message).toContain('DynamoDB Connection Error');
          }
        }
      });

      it('When ホスト名が空文字列である Then バリデーションエラーが返される', async () => {
        // Arrange & Act
        const result = await roomService.createRoom('');

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('ValidationError');
          if (result.error.type === 'ValidationError') {
            expect(result.error.message).toContain('ホスト名');
          }
        }
      });

      it('When ホスト名が20文字を超える Then バリデーションエラーが返される', async () => {
        // Arrange
        const longHostName = 'a'.repeat(21);

        // Act
        const result = await roomService.createRoom(longHostName);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('ValidationError');
          if (result.error.type === 'ValidationError') {
            expect(result.error.message).toContain('20文字以内');
          }
        }
      });
    });
  });

  describe('ルームID生成のユニークネス', () => {
    it('Given 連続でルームを作成する When createRoom が複数回呼ばれる Then 異なるルームIDが生成される', async () => {
      // Arrange
      mockRoomRepository.existsById = jest.fn().mockResolvedValue(false);
      mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

      // Act
      const result1 = await roomService.createRoom('Host1');
      const result2 = await roomService.createRoom('Host2');
      const result3 = await roomService.createRoom('Host3');

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result3.success).toBe(true);

      if (result1.success && result2.success && result3.success) {
        const roomIds = [result1.value.roomId, result2.value.roomId, result3.value.roomId];
        const uniqueRoomIds = new Set(roomIds);
        expect(uniqueRoomIds.size).toBe(3); // すべて異なるID
      }
    });
  });

  describe('Acceptance Criteria: ルーム参加機能', () => {
    describe('Given ルームが存在し、プレイヤー数が5未満である', () => {
      const roomId = 'TEST01';
      const playerName = 'NewPlayer';

      it('When joinRoom が呼ばれる Then プレイヤーがルームに追加される', async () => {
        // Arrange
        const existingRoom: Room = {
          roomId,
          hostId: 'host-123',
          players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.joinRoom(roomId, playerName);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value.playerId).toBeDefined();
          expect(typeof result.value.playerId).toBe('string');
        }
      });

      it('When joinRoom が呼ばれる Then DynamoDBが更新される', async () => {
        // Arrange
        const existingRoom: Room = {
          roomId,
          hostId: 'host-123',
          players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        await roomService.joinRoom(roomId, playerName);

        // Assert
        expect(mockRoomRepository.save).toHaveBeenCalledTimes(1);
        const savedRoom = mockRoomRepository.save.mock.calls[0][0];
        expect(savedRoom.players.length).toBe(2);
        expect(savedRoom.players[1].name).toBe(playerName);
      });

      it('When joinRoom が呼ばれる Then レスポンスに playerId が含まれる', async () => {
        // Arrange
        const existingRoom: Room = {
          roomId,
          hostId: 'host-123',
          players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.joinRoom(roomId, playerName);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.value).toHaveProperty('playerId');
          expect(typeof result.value.playerId).toBe('string');
        }
      });
    });

    describe('Given ルームが満員（5人）である', () => {
      const roomId = 'FULL01';
      const playerName = 'NewPlayer';

      it('When 新しいプレイヤーが参加しようとする Then ValidationErrorが返される', async () => {
        // Arrange
        const fullRoom: Room = {
          roomId,
          hostId: 'host-123',
          players: Array(5)
            .fill(null)
            .map((_, i) => ({
              playerId: `player-${i}`,
              name: `Player${i}`,
              joinedAt: Date.now(),
            })),
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(fullRoom);

        // Act
        const result = await roomService.joinRoom(roomId, playerName);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('ValidationError');
          if (result.error.type === 'ValidationError') {
            expect(result.error.message).toContain('満員');
          }
        }
      });
    });

    describe('Given ルームが存在しない', () => {
      it('When joinRoom が呼ばれる Then NotFoundErrorが返される', async () => {
        // Arrange
        mockRoomRepository.findById = jest.fn().mockResolvedValue(null);

        // Act
        const result = await roomService.joinRoom('NONEXIST', 'Player');

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('NotFoundError');
        }
      });
    });

    describe('Given ルームがゲーム中である', () => {
      it('When joinRoom が呼ばれる Then ValidationErrorが返される', async () => {
        // Arrange
        const playingRoom: Room = {
          roomId: 'PLAY01',
          hostId: 'host-123',
          players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
          status: 'playing',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(playingRoom);

        // Act
        const result = await roomService.joinRoom('PLAY01', 'NewPlayer');

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('ValidationError');
          if (result.error.type === 'ValidationError') {
            expect(result.error.message).toContain('ゲーム中');
          }
        }
      });
    });
  });

  describe('Acceptance Criteria: ルーム退出機能', () => {
    describe('Given プレイヤーがルームに参加している', () => {
      const roomId = 'TEST01';
      const playerId = 'player-2';

      it('When leaveRoom が呼ばれる Then プレイヤーがルームから削除される', async () => {
        // Arrange
        const existingRoom = {
          roomId,
          hostId: 'host-123',
          players: [
            { playerId: 'host-123', name: 'Host', joinedAt: Date.now() },
            { playerId: 'player-2', name: 'Player2', joinedAt: Date.now() },
            { playerId: 'player-3', name: 'Player3', joinedAt: Date.now() },
          ],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.leaveRoom(roomId, playerId);

        // Assert
        expect(result.success).toBe(true);
      });

      it('When leaveRoom が呼ばれる Then DynamoDBが更新される', async () => {
        // Arrange
        const existingRoom = {
          roomId,
          hostId: 'host-123',
          players: [
            { playerId: 'host-123', name: 'Host', joinedAt: Date.now() },
            { playerId: 'player-2', name: 'Player2', joinedAt: Date.now() },
          ],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        await roomService.leaveRoom(roomId, playerId);

        // Assert
        expect(mockRoomRepository.save).toHaveBeenCalled();
        const saveCalls = mockRoomRepository.save.mock.calls;
        expect(saveCalls.length).toBeGreaterThan(0);

        const lastSaveCall = saveCalls[saveCalls.length - 1];
        const updatedRoom = lastSaveCall[0];

        expect(updatedRoom).toBeDefined();
        if (updatedRoom) {
          expect(updatedRoom.players.length).toBe(1);
          expect(updatedRoom.players.find((p: Player) => p.playerId === playerId)).toBeUndefined();
        }
      });
    });

    describe('Given ホストが退出する', () => {
      it('When 他のプレイヤーが残っている Then 残ったプレイヤーの1人が新ホストになる', async () => {
        // Arrange
        const roomId = 'TEST01';
        const hostId = 'host-123';
        const existingRoom = {
          roomId,
          hostId,
          players: [
            { playerId: 'host-123', name: 'Host', joinedAt: Date.now() - 2000 },
            { playerId: 'player-2', name: 'Player2', joinedAt: Date.now() - 1000 },
            { playerId: 'player-3', name: 'Player3', joinedAt: Date.now() },
          ],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.save = jest.fn().mockResolvedValue(undefined);

        // Act
        await roomService.leaveRoom(roomId, hostId);

        // Assert
        expect(mockRoomRepository.save).toHaveBeenCalled();
        const saveCalls = mockRoomRepository.save.mock.calls;
        expect(saveCalls.length).toBeGreaterThan(0);

        const lastSaveCall = saveCalls[saveCalls.length - 1];
        const updatedRoom = lastSaveCall[0];

        expect(updatedRoom).toBeDefined();
        if (updatedRoom) {
          expect(updatedRoom.players.length).toBe(2);
          expect(updatedRoom.hostId).not.toBe(hostId);
          expect(updatedRoom.hostId).toBe('player-2'); // 最も古いプレイヤーが新ホストになる
        }
      });
    });

    describe('Given 全プレイヤーが退出する', () => {
      it('When 最後のプレイヤーが退出する Then ルームが削除される', async () => {
        // Arrange
        const roomId = 'TEST01';
        const lastPlayerId = 'host-123';
        const existingRoom = {
          roomId,
          hostId: lastPlayerId,
          players: [{ playerId: lastPlayerId, name: 'Host', joinedAt: Date.now() }],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);
        mockRoomRepository.delete = jest.fn().mockResolvedValue(undefined);

        // Act
        const result = await roomService.leaveRoom(roomId, lastPlayerId);

        // Assert
        expect(result.success).toBe(true);
        expect(mockRoomRepository.delete).toHaveBeenCalledWith(roomId);
        expect(mockRoomRepository.delete).toHaveBeenCalledTimes(1);
      });
    });

    describe('Given ルームが存在しない', () => {
      it('When leaveRoom が呼ばれる Then NotFoundErrorが返される', async () => {
        // Arrange
        mockRoomRepository.findById = jest.fn().mockResolvedValue(null);

        // Act
        const result = await roomService.leaveRoom('NONEXIST', 'player-1');

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('NotFoundError');
        }
      });
    });

    describe('Given プレイヤーがルームに存在しない', () => {
      it('When leaveRoom が呼ばれる Then NotFoundErrorが返される', async () => {
        // Arrange
        const existingRoom = {
          roomId: 'TEST01',
          hostId: 'host-123',
          players: [{ playerId: 'host-123', name: 'Host', joinedAt: Date.now() }],
          status: 'waiting',
          createdAt: Date.now(),
        };

        mockRoomRepository.findById = jest.fn().mockResolvedValue(existingRoom);

        // Act
        const result = await roomService.leaveRoom('TEST01', 'nonexistent-player');

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.type).toBe('NotFoundError');
        }
      });
    });
  });
});
