/**
 * RoomRepository - ルームデータアクセス層
 * DynamoDBへのCRUD操作を担当
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamodb';
import { Room } from '../types-shared/models';

/**
 * RoomRepository - ルームのデータアクセスを担当するリポジトリ
 */
export class RoomRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName?: string, client?: DynamoDBDocumentClient) {
    this.tableName = tableName || process.env.ROOMS_TABLE_NAME || 'FiveBomber-Rooms';
    this.client = client || docClient;
  }

  /**
   * ルームIDでルームを検索
   * @param roomId ルームID
   * @returns ルームオブジェクト、存在しない場合はnull
   */
  async findById(roomId: string): Promise<Room | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item ? (result.Item as Room) : null;
  }

  /**
   * ルームを保存（作成または更新）
   * @param room ルームオブジェクト
   */
  async save(room: Room): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `ROOM#${room.roomId}`,
          SK: `METADATA`,
          ...room,
        },
      })
    );
  }

  /**
   * ルームを削除
   * @param roomId ルームID
   */
  async delete(roomId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `ROOM#${roomId}`,
          SK: `METADATA`,
        },
      })
    );
  }

  /**
   * ルームが存在するかチェック
   * @param roomId ルームID
   * @returns 存在する場合true
   */
  async existsById(roomId: string): Promise<boolean> {
    const room = await this.findById(roomId);
    return room !== null;
  }
}
