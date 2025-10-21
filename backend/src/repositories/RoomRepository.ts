/**
 * RoomRepository
 * DynamoDBへのRoom CRUD操作を管理するリポジトリ
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { Room, Player } from '@five-bomber/shared/types/models';
import { Result, RepositoryError } from '../types/common';

/**
 * DynamoDB RoomsテーブルのItem構造
 */
interface RoomsTableItem {
  PK: string; // "ROOM#<roomId>"
  SK: string; // "METADATA"
  roomId: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  updatedAt: number;
  ttl?: number; // ゲーム終了後24時間で自動削除
}

export class RoomRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName: string, client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      const ddbClient = new DynamoDBClient({});
      this.docClient = DynamoDBDocumentClient.from(ddbClient);
    }
    this.tableName = tableName;
  }

  /**
   * ルームを作成
   */
  async create(room: Room): Promise<Result<Room, RepositoryError>> {
    try {
      const item: RoomsTableItem = {
        PK: `ROOM#${room.roomId}`,
        SK: 'METADATA',
        roomId: room.roomId,
        hostId: room.hostId,
        players: room.players,
        status: room.status,
        createdAt: room.createdAt,
        updatedAt: room.createdAt,
      };

      await this.docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );

      return { success: true, value: room };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * ルームIDでルームを取得
   */
  async get(roomId: string): Promise<Result<Room | null, RepositoryError>> {
    try {
      const result = await this.docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: {
            PK: `ROOM#${roomId}`,
            SK: 'METADATA',
          },
        })
      );

      if (!result.Item) {
        return { success: true, value: null };
      }

      const item = result.Item as RoomsTableItem;
      const room: Room = {
        roomId: item.roomId,
        hostId: item.hostId,
        players: item.players,
        status: item.status,
        createdAt: item.createdAt,
      };

      return { success: true, value: room };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * プレイヤーをルームに追加
   */
  async addPlayer(roomId: string, player: Player): Promise<Result<Room, RepositoryError>> {
    try {
      // まず現在のルームを取得
      const getResult = await this.get(roomId);
      if (!getResult.success) {
        return getResult;
      }

      if (!getResult.value) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            sessionId: roomId,
          },
        };
      }

      const room = getResult.value;

      // プレイヤー数制限（最大5人）
      if (room.players.length >= 5) {
        return {
          success: false,
          error: {
            type: 'ValidationError',
            message: 'Room is full (maximum 5 players)',
          },
        };
      }

      // プレイヤーを追加
      const updatedPlayers = [...room.players, player];

      const result = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `ROOM#${roomId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'SET players = :players, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':players': updatedPlayers,
            ':updatedAt': Date.now(),
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      if (!result.Attributes) {
        throw new Error('Failed to update room');
      }

      const updatedItem = result.Attributes as RoomsTableItem;
      const updatedRoom: Room = {
        roomId: updatedItem.roomId,
        hostId: updatedItem.hostId,
        players: updatedItem.players,
        status: updatedItem.status,
        createdAt: updatedItem.createdAt,
      };

      return { success: true, value: updatedRoom };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * プレイヤーをルームから削除
   */
  async removePlayer(roomId: string, playerId: string): Promise<Result<Room, RepositoryError>> {
    try {
      // まず現在のルームを取得
      const getResult = await this.get(roomId);
      if (!getResult.success) {
        return getResult;
      }

      if (!getResult.value) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            sessionId: roomId,
          },
        };
      }

      const room = getResult.value;

      // プレイヤーを削除
      const updatedPlayers = room.players.filter((p) => p.playerId !== playerId);

      const result = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `ROOM#${roomId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'SET players = :players, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':players': updatedPlayers,
            ':updatedAt': Date.now(),
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      if (!result.Attributes) {
        throw new Error('Failed to update room');
      }

      const updatedItem = result.Attributes as RoomsTableItem;
      const updatedRoom: Room = {
        roomId: updatedItem.roomId,
        hostId: updatedItem.hostId,
        players: updatedItem.players,
        status: updatedItem.status,
        createdAt: updatedItem.createdAt,
      };

      return { success: true, value: updatedRoom };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }

  /**
   * ホストを更新
   */
  async updateHost(roomId: string, newHostId: string): Promise<Result<Room, RepositoryError>> {
    try {
      const result = await this.docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: {
            PK: `ROOM#${roomId}`,
            SK: 'METADATA',
          },
          UpdateExpression: 'SET hostId = :hostId, updatedAt = :updatedAt',
          ExpressionAttributeValues: {
            ':hostId': newHostId,
            ':updatedAt': Date.now(),
          },
          ReturnValues: 'ALL_NEW',
        })
      );

      if (!result.Attributes) {
        return {
          success: false,
          error: {
            type: 'NotFoundError',
            sessionId: roomId,
          },
        };
      }

      const updatedItem = result.Attributes as RoomsTableItem;
      const updatedRoom: Room = {
        roomId: updatedItem.roomId,
        hostId: updatedItem.hostId,
        players: updatedItem.players,
        status: updatedItem.status,
        createdAt: updatedItem.createdAt,
      };

      return { success: true, value: updatedRoom };
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'ConnectionError',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
        },
      };
    }
  }
}
