/**
 * RoomService
 * ルーム管理のビジネスロジック
 */

import { Room, Player } from '../types-shared/models';
import { validateHostName } from '../types-shared/schemas';
import { RoomRepository } from '../repositories/RoomRepository';
import { Result, ServiceError } from '../types/common';
import { randomBytes } from 'crypto';

export class RoomService {
  constructor(private roomRepository: RoomRepository) {}

  /**
   * ルームを作成
   * @param hostName ホストのプレイヤー名
   * @returns 作成されたルーム情報
   */
  async createRoom(hostName: unknown): Promise<Result<Room, ServiceError>> {
    // Zodによるバリデーション
    const validation = validateHostName(hostName);
    if (!validation.success) {
      return {
        success: false,
        error: {
          type: 'ValidationError',
          message: validation.errors.map((e) => e.message).join(', '),
        },
      };
    }

    const validatedHostName = validation.data;

    // ユニークなルームIDを生成（6文字の小文字英数字）
    const roomId = this.generateRoomId();

    // ユニークなプレイヤーIDを生成
    const playerId = this.generatePlayerId();

    // ホストプレイヤーを作成
    const hostPlayer: Player = {
      playerId,
      name: validatedHostName,
      joinedAt: Date.now(),
    };

    // ルームを作成
    const room: Room = {
      roomId,
      hostId: playerId,
      players: [hostPlayer],
      status: 'waiting',
      createdAt: Date.now(),
    };

    // リポジトリに保存
    const result = await this.roomRepository.create(room);

    if (!result.success) {
      return {
        success: false,
        error: {
          type: result.error.type === 'ConnectionError' ? 'DatabaseError' : 'ValidationError',
          message: result.error.type === 'ConnectionError' ? result.error.message : 'Failed to create room',
        },
      };
    }

    return { success: true, value: result.value };
  }

  /**
   * ルームIDでルームを取得
   * @param roomId ルームID
   * @returns ルーム情報（存在しない場合はnull）
   */
  async getRoom(roomId: string): Promise<Result<Room | null, ServiceError>> {
    const result = await this.roomRepository.get(roomId);

    if (!result.success) {
      return {
        success: false,
        error: {
          type: 'DatabaseError',
          message: result.error.type === 'ConnectionError' ? result.error.message : 'Failed to get room',
        },
      };
    }

    return { success: true, value: result.value };
  }

  /**
   * ユニークなルームIDを生成（6文字の小文字英数字）
   * @private
   */
  private generateRoomId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const bytes = randomBytes(6);
    for (let i = 0; i < 6; i++) {
      result += chars[bytes[i] % chars.length];
    }
    return result;
  }

  /**
   * ユニークなプレイヤーIDを生成（UUID形式）
   * @private
   */
  private generatePlayerId(): string {
    return `player-${randomBytes(16).toString('hex')}`;
  }
}
