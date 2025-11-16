/**
 * WebSocket Disconnect Handler
 * タスク4.1: WebSocket接続管理
 */

import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';

/**
 * WebSocket API のレスポンス型
 */
interface WebSocketResponse {
  statusCode: number;
  body: string;
}

/**
 * WebSocket切断ハンドラー
 * クライアントがWebSocket接続を切断した際に呼ばれる
 */
export const disconnectHandler = async (
  event: APIGatewayProxyWebsocketEventV2,
  context: Context,
  connectionRepo: ConnectionRepository = new ConnectionRepository()
): Promise<WebSocketResponse> => {
  const { connectionId } = event.requestContext;

  console.log('[DISCONNECT] WebSocket disconnect request', {
    connectionId,
  });

  try {
    // 接続情報をDynamoDBから削除
    await connectionRepo.delete(connectionId);

    console.log('[DISCONNECT] Connection deleted successfully', { connectionId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Disconnected successfully',
      }),
    };
  } catch (error) {
    console.error('[DISCONNECT] Error deleting connection', { error });
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
      }),
    };
  }
};
