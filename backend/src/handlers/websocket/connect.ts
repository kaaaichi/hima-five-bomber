/**
 * WebSocket Connect Handler
 * タスク4.1: WebSocket接続管理
 */

import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';
import { Connection } from '../../types-shared/models';

/**
 * WebSocket API のイベント型（queryStringParameters拡張）
 */
interface WebSocketConnectEvent extends APIGatewayProxyWebsocketEventV2 {
  queryStringParameters?: {
    [key: string]: string | undefined;
  };
}

/**
 * WebSocket API のレスポンス型
 */
interface WebSocketResponse {
  statusCode: number;
  body: string;
}

/**
 * WebSocket接続ハンドラー
 * クライアントがWebSocket接続を確立した際に呼ばれる
 */
export const connectHandler = async (
  event: WebSocketConnectEvent,
  _context: Context,
  connectionRepo?: ConnectionRepository
): Promise<WebSocketResponse> => {
  const { connectionId } = event.requestContext;
  const { playerId, roomId } = event.queryStringParameters || {};

  console.log('[CONNECT] WebSocket connection request', {
    connectionId,
    playerId,
    roomId,
  });

  try {
    // バリデーション: playerIdとroomIdが必須
    if (!playerId || !roomId) {
      console.error('[CONNECT] Missing required parameters', { playerId, roomId });
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Missing required parameters: playerId and roomId',
        }),
      };
    }

    // 接続情報をDynamoDBに保存
    const connection: Connection = {
      connectionId,
      playerId,
      roomId,
      connectedAt: Date.now(),
    };

    // テスト時はconnectionRepoが渡される、実運用時は新規作成
    // Lambda実行時は第3引数にcallback関数が渡されるため、saveメソッドの存在チェックで判定
    const repo = (connectionRepo && typeof connectionRepo.save === 'function')
      ? connectionRepo
      : new ConnectionRepository();
    await repo.save(connection);

    console.log('[CONNECT] Connection saved successfully', { connectionId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Connected successfully',
        connectionId,
      }),
    };
  } catch (error) {
    console.error('[CONNECT] Error saving connection', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
