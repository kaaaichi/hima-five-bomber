/**
 * RoomService - ルーム管理サービス
 * タスク3.1: ルーム作成機能の実装
 * タスク3.2: ルーム参加機能の実装
 * タスク3.3: ルーム退出機能の実装
 * リファクタリング: Repository層の導入
 */

import { Room, Player } from '../types-shared/models';
import { Result, RepositoryError } from '../types/common';
import { randomBytes } from 'crypto';
import { RoomRepository } from '../repositories/RoomRepository';

/**
 * ルーム作成レスポンス
 */
export interface CreateRoomResponse {
  roomId: string;
  hostId: string;
}

/**
 * ルーム参加レスポンス
 */
export interface JoinRoomResponse {
  playerId: string;
}

/**
 * RoomService - ルームの作成・管理を担当するサービス
 * ビジネスロジックに集中し、データアクセスはRepositoryに委譲
 */
export class RoomService {
  private readonly roomRepository: RoomRepository;

  constructor(roomRepository?: RoomRepository) {
    this.roomRepository = roomRepository || new RoomRepository();
  }

  /**
   * ルームを作成する
   * @param hostName ホスト名
   * @returns ルームIDとホストID
   */
  async createRoom(hostName: string): Promise<Result<CreateRoomResponse, RepositoryError>> {
    // バリデーション
    const validationError = this.validateHostName(hostName);
    if (validationError) {
      return validationError;
    }

    try {
      // ユニークなルームIDを生成
      const roomId = await this.generateUniqueRoomId();

      // ホストプレイヤーIDを生成
      const hostId = this.generatePlayerId();

      // ホストプレイヤーを作成
      const hostPlayer: Player = {
        playerId: hostId,
        name: hostName,
        joinedAt: Date.now(),
      };

      // ルームオブジェクトを作成
      const room: Room = {
        roomId,
        hostId,
        players: [hostPlayer],
        status: 'waiting',
        createdAt: Date.now(),
      };

      // Repositoryを使用してDBに保存
      await this.roomRepository.save(room);

      return {
        success: true,
        value: {
          roomId,
          hostId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: `Failed to create room: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * ホスト名のバリデーション
   * @param hostName ホスト名
   * @returns エラーがある場合はエラーレスポンス、なければundefined
   */
  private validateHostName(hostName: string): Result<never, RepositoryError> | undefined {
    if (!hostName || hostName.trim() === '') {
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: 'ホスト名は必須です',
        },
      };
    }

    if (hostName.length > 20) {
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: 'ホスト名は20文字以内で入力してください',
        },
      };
    }

    return undefined;
  }

  /**
   * ユニークなルームIDを生成する
   * 6桁の英数字（大文字）
   * @returns ルームID
   */
  private async generateUniqueRoomId(): Promise<string> {
    let roomId: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      roomId = this.generateRoomId();

      // Repositoryを使用してルームIDが既に存在するかチェック
      const exists = await this.roomRepository.existsById(roomId);

      if (!exists) {
        isUnique = true;
        return roomId;
      }

      attempts++;
    }

    // 最大試行回数に達した場合でも新しいIDを返す（衝突の可能性は非常に低い）
    return this.generateRoomId();
  }

  /**
   * ルームIDを生成する
   * 6桁の英数字（大文字）
   * @returns ルームID
   */
  private generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bytes = randomBytes(6);
    let result = '';

    for (let i = 0; i < 6; i++) {
      result += chars[bytes[i] % chars.length];
    }

    return result;
  }

  /**
   * プレイヤーIDを生成する
   * UUIDv4形式
   * @returns プレイヤーID
   */
  private generatePlayerId(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * ルームに参加する
   * @param roomId ルームID
   * @param playerName プレイヤー名
   * @returns プレイヤーID
   */
  async joinRoom(roomId: string, playerName: string): Promise<Result<JoinRoomResponse, RepositoryError>> {
    // バリデーション
    const validationError = this.validatePlayerName(playerName);
    if (validationError) {
      return validationError;
    }

    try {
      // Repositoryを使用してルームを取得
      const room = await this.roomRepository.findById(roomId);

      if (!room) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            id: roomId,
          },
        };
      }

      // ルームのステータスチェック
      if (room.status !== 'waiting') {
        return {
          success: false,
          error: {
            type: 'ValidationError',
            message: 'ゲーム中のルームには参加できません',
          },
        };
      }

      // プレイヤー数のチェック（最大5人）
      if (room.players.length >= 5) {
        return {
          success: false,
          error: {
            type: 'ValidationError',
            message: 'ルームが満員です（最大5人）',
          },
        };
      }

      // 新しいプレイヤーを作成
      const playerId = this.generatePlayerId();
      const newPlayer: Player = {
        playerId,
        name: playerName,
        joinedAt: Date.now(),
      };

      // プレイヤーをルームに追加
      room.players.push(newPlayer);

      // Repositoryを使用してDBを更新
      await this.roomRepository.save(room);

      return {
        success: true,
        value: {
          playerId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: `Failed to join room: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * プレイヤー名のバリデーション
   * @param playerName プレイヤー名
   * @returns エラーがある場合はエラーレスポンス、なければundefined
   */
  private validatePlayerName(playerName: string): Result<never, RepositoryError> | undefined {
    if (!playerName || playerName.trim() === '') {
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: 'プレイヤー名は必須です',
        },
      };
    }

    if (playerName.length > 20) {
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: 'プレイヤー名は20文字以内で入力してください',
        },
      };
    }

    return undefined;
  }

  /**
   * ルームから退出する
   * @param roomId ルームID
   * @param playerId プレイヤーID
   * @returns 成功または失敗
   */
  async leaveRoom(roomId: string, playerId: string): Promise<Result<void, RepositoryError>> {
    try {
      // Repositoryを使用してルームを取得
      const room = await this.roomRepository.findById(roomId);

      if (!room) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            id: roomId,
          },
        };
      }

      // プレイヤーが存在するかチェック
      const playerIndex = room.players.findIndex((p) => p.playerId === playerId);
      if (playerIndex === -1) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            id: playerId,
          },
        };
      }

      // プレイヤーを削除
      room.players.splice(playerIndex, 1);

      // 全プレイヤーが退出した場合、ルームを削除
      if (room.players.length === 0) {
        await this.roomRepository.delete(roomId);

        return {
          success: true,
          value: undefined,
        };
      }

      // ホストが退出した場合、新しいホストを選定
      if (room.hostId === playerId) {
        // 最も早く参加したプレイヤーを新ホストにする
        const sortedPlayers = [...room.players].sort((a, b) => a.joinedAt - b.joinedAt);
        room.hostId = sortedPlayers[0].playerId;
      }

      // Repositoryを使用してDBを更新
      await this.roomRepository.save(room);

      return {
        success: true,
        value: undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: `Failed to leave room: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      };
    }
  }

  /**
   * ルームを取得する
   * @param roomId ルームID
   * @returns ルーム情報
   */
  async getRoom(roomId: string): Promise<Result<Room, string>> {
    try {
      // Repositoryを使用してルームを取得
      const room = await this.roomRepository.findById(roomId);

      if (!room) {
        return {
          success: false,
          error: 'Room not found',
        };
      }

      return {
        success: true,
        value: room,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get room: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}
