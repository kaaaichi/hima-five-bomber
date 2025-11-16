/**
 * BroadcasterService - WebSocketブロードキャスト機能
 * タスク4.3: ルーム内の全接続にメッセージを配信
 */

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { ConnectionRepository } from '../repositories/ConnectionRepository';

/**
 * WebSocketメッセージの型
 */
export interface WebSocketMessage {
  type: string;
  payload: unknown;
}

/**
 * BroadcasterService - WebSocketブロードキャスト機能を提供
 */
export class BroadcasterService {
  private readonly apiGatewayClient: ApiGatewayManagementApiClient;
  private readonly connectionRepository: ConnectionRepository;

  constructor(endpoint?: string, connectionRepo?: ConnectionRepository) {
    const apiEndpoint = endpoint || process.env.WEBSOCKET_API_ENDPOINT;

    if (!apiEndpoint) {
      throw new Error('WebSocket API endpoint is not configured');
    }

    this.apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint: apiEndpoint,
      region: process.env.AWS_REGION || 'ap-northeast-1',
    });

    this.connectionRepository = connectionRepo || new ConnectionRepository();
  }

  /**
   * ルーム内の全接続にメッセージをブロードキャスト
   * @param roomId ルームID
   * @param message 送信するメッセージ
   */
  async broadcastToRoom(roomId: string, message: WebSocketMessage): Promise<void> {
    console.log('[BROADCAST] Broadcasting to room', { roomId, messageType: message.type });

    try {
      // ルーム内の全接続を取得
      const connections = await this.connectionRepository.findByRoomId(roomId);

      if (connections.length === 0) {
        console.log('[BROADCAST] No connections in room', { roomId });
        return;
      }

      console.log('[BROADCAST] Found connections', { roomId, count: connections.length });

      // 並列でメッセージを送信
      const sendPromises = connections.map(async (connection) => {
        const success = await this.sendToConnection(connection.connectionId, message);

        if (!success) {
          // 送信失敗（GoneException）の場合、接続を削除
          console.log('[BROADCAST] Removing stale connection', { connectionId: connection.connectionId });
          await this.connectionRepository.delete(connection.connectionId);
        }
      });

      await Promise.all(sendPromises);

      console.log('[BROADCAST] Broadcast completed', { roomId });
    } catch (error) {
      console.error('[BROADCAST] Error broadcasting to room', { roomId, error });
      throw error;
    }
  }

  /**
   * 特定の接続にメッセージを送信
   * @param connectionId 接続ID
   * @param message 送信するメッセージ
   * @returns 送信成功ならtrue、GoneExceptionならfalse
   */
  async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<boolean> {
    try {
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      });

      await this.apiGatewayClient.send(command);

      console.log('[BROADCAST] Message sent successfully', { connectionId, messageType: message.type });
      return true;
    } catch (error: any) {
      if (error.name === 'GoneException') {
        // 接続が切断済み
        console.warn('[BROADCAST] Connection is gone', { connectionId });
        return false;
      }

      // その他のエラーは再スロー
      console.error('[BROADCAST] Error sending message', { connectionId, error });
      throw error;
    }
  }
}
