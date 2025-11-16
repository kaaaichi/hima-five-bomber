/**
 * SessionRepository - ゲームセッションデータアクセス層
 * タスク5.1: DynamoDB GameSessionsテーブルへのCRUD操作を担当
 */

import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient } from '../utils/dynamodb';
import { GameSession } from '../types-shared/models';

/**
 * SessionRepository - ゲームセッションのデータアクセスを担当するリポジトリ
 */
export class SessionRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName?: string, client?: DynamoDBDocumentClient) {
    this.tableName = tableName || process.env.SESSIONS_TABLE_NAME || 'FiveBomber-GameSessions';
    this.client = client || docClient;
  }

  /**
   * セッションIDでゲームセッションを検索
   * @param sessionId セッションID
   * @returns ゲームセッションオブジェクト、存在しない場合はnull
   */
  async findById(sessionId: string): Promise<GameSession | null> {
    const result = await this.client.send(
      new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: `METADATA`,
        },
      })
    );

    return result.Item ? (result.Item as GameSession) : null;
  }

  /**
   * ゲームセッションを保存（作成または更新）
   * @param session ゲームセッションオブジェクト
   */
  async save(session: GameSession): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: {
          PK: `SESSION#${session.sessionId}`,
          SK: `METADATA`,
          ...session,
        },
      })
    );
  }

  /**
   * ゲームセッションを削除
   * @param sessionId セッションID
   */
  async delete(sessionId: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: `SESSION#${sessionId}`,
          SK: `METADATA`,
        },
      })
    );
  }

  /**
   * ゲームセッションが存在するかチェック
   * @param sessionId セッションID
   * @returns 存在する場合true
   */
  async existsById(sessionId: string): Promise<boolean> {
    const session = await this.findById(sessionId);
    return session !== null;
  }
}
