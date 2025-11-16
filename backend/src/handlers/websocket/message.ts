/**
 * WebSocket Message Handler
 * タスク4.2: WebSocketメッセージルーティング
 */

import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import {
  InboundWebSocketMessage,
  OutboundWebSocketMessage,
  SubmitAnswerPayload,
  SyncGameStatePayload,
} from '../../types-shared/models';

/**
 * WebSocket API のレスポンス型
 */
interface WebSocketResponse {
  statusCode: number;
  body: string;
}

/**
 * WebSocketメッセージハンドラー
 * クライアントからのメッセージを受信し、適切なハンドラーにルーティングする
 */
export const messageHandler = async (
  event: APIGatewayProxyWebsocketEventV2,
  context: Context
): Promise<WebSocketResponse> => {
  const { connectionId } = event.requestContext;
  const { body } = event;

  console.log('[MESSAGE] Received WebSocket message', {
    connectionId,
    body,
  });

  try {
    // バリデーション: bodyが存在するかチェック
    if (!body) {
      console.error('[MESSAGE] Empty message body', { connectionId });
      return createErrorResponse(400, 'Empty message body');
    }

    // JSONパース
    let message: InboundWebSocketMessage;
    try {
      message = JSON.parse(body);
    } catch (error) {
      console.error('[MESSAGE] Invalid JSON', { connectionId, error });
      return createErrorResponse(400, 'Invalid JSON format');
    }

    // メッセージ型に応じてルーティング
    switch (message.type) {
      case 'submitAnswer':
        return await handleSubmitAnswer(message.payload, connectionId);
      case 'syncGameState':
        return await handleSyncGameState(message.payload, connectionId);
      default:
        console.error('[MESSAGE] Unknown message type', { type: (message as any).type });
        return createErrorResponse(400, `Unknown message type: ${(message as any).type}`);
    }
  } catch (error) {
    console.error('[MESSAGE] Internal error', { error });
    return createErrorResponse(500, 'Internal server error');
  }
};

/**
 * submitAnswerメッセージハンドラー
 */
async function handleSubmitAnswer(
  payload: SubmitAnswerPayload,
  connectionId: string
): Promise<WebSocketResponse> {
  console.log('[MESSAGE] Handling submitAnswer', { payload, connectionId });

  // バリデーション
  if (!payload.sessionId || !payload.playerId || payload.answer === undefined) {
    console.error('[MESSAGE] Invalid submitAnswer payload', { payload });
    return createErrorResponse(400, 'Invalid submitAnswer payload: missing required fields');
  }

  // TODO: GameServiceに委譲して回答を処理する（タスク6で実装予定）
  // 現在はモックレスポンスを返す
  const response: OutboundWebSocketMessage = {
    type: 'answerResult',
    payload: {
      correct: true, // モック
      score: 100, // モック
      nextTurn: 1, // モック
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
}

/**
 * syncGameStateメッセージハンドラー
 */
async function handleSyncGameState(
  payload: SyncGameStatePayload,
  connectionId: string
): Promise<WebSocketResponse> {
  console.log('[MESSAGE] Handling syncGameState', { payload, connectionId });

  // バリデーション
  if (!payload.sessionId) {
    console.error('[MESSAGE] Invalid syncGameState payload', { payload });
    return createErrorResponse(400, 'Invalid syncGameState payload: missing sessionId');
  }

  // TODO: GameSessionRepositoryからゲーム状態を取得する（タスク6で実装予定）
  // 現在はモックレスポンスを返す
  const response: OutboundWebSocketMessage = {
    type: 'questionStart',
    payload: {
      questionId: 'mock-question-id',
      questionText: 'モック問題',
      category: 'general',
      difficulty: 'medium',
    },
  };

  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
}

/**
 * エラーレスポンスを作成するヘルパー関数
 */
function createErrorResponse(statusCode: number, message: string): WebSocketResponse {
  const errorResponse: OutboundWebSocketMessage = {
    type: 'error',
    payload: {
      message,
      code: statusCode.toString(),
    },
  };

  return {
    statusCode,
    body: JSON.stringify(errorResponse),
  };
}
