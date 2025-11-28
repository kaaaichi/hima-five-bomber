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
  _context: Context,
  connectionRepo?: ConnectionRepository
): Promise<WebSocketResponse> => {
  const { connectionId } = event.requestContext;

  console.log('[DISCONNECT] WebSocket disconnect request', {
    connectionId,
  });

  try {
    // 接続情報をDynamoDBから削除
    // テスト時はconnectionRepoが渡される、実運用時は新規作成
    // Lambda実行時は第3引数にcallback関数が渡されるため、deleteメソッドの存在チェックで判定
    const repo = (connectionRepo && typeof connectionRepo.delete === 'function')
      ? connectionRepo
      : new ConnectionRepository();
    await repo.delete(connectionId);

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
