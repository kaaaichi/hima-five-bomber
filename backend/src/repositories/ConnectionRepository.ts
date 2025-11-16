/**
 * ConnectionRepository - WebSocket接続データアクセス層
 * DynamoDBへのCRUD操作を担当
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamodb';
import { Connection } from '../types-shared/models';

/**
 * ConnectionRepository - WebSocket接続のデータアクセスを担当するリポジトリ
 */
export class ConnectionRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  // TTL: 接続切断後1時間で自動削除（3600秒）
  private readonly TTL_SECONDS = 3600;

  constructor(tableName?: string, client?: DynamoDBDocumentClient) {
    this.tableName = tableName || process.env.CONNECTIONS_TABLE_NAME || 'FiveBomber-Connections';
    this.client = client || docClient;
  }

  /**
   * 接続を保存（作成または更新）
   * @param connection 接続オブジェクト
   */
  async save(connection: Connection): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + this.TTL_SECONDS;

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `CONNECTION#${connection.connectionId}`,
          SK: `METADATA`,
          ...connection,
          ttl, // DynamoDBのTTL属性
        },
      })
    );
  }

  /**
   * connectionIDで接続を検索
   * @param connectionId 接続ID
   * @returns 接続オブジェクト、存在しない場合はnull
   */
  async findById(connectionId: string): Promise<Connection | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CONNECTION#${connectionId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item ? (result.Item as Connection) : null;
  }

  /**
   * 接続を削除
   * @param connectionId 接続ID
   */
  async delete(connectionId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `CONNECTION#${connectionId}`,
          SK: `METADATA`,
        },
      })
    );
  }

  /**
   * ルームID別に接続リストを取得
   * @param roomId ルームID
   * @returns 接続のリスト
   */
  async findByRoomId(roomId: string): Promise<Connection[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1', // roomId をパーティションキーとするGSI
        KeyConditionExpression: 'roomId = :roomId',
        ExpressionAttributeValues: {
          ':roomId': roomId,
        },
      })
    );

    return (result.Items as Connection[]) || [];
  }
}
