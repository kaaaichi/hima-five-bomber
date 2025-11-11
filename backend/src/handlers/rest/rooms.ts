/**
 * Rooms REST API Handler
 * タスク3.1: ルーム作成APIの実装
 * タスク3.2: ルーム参加APIの実装
 * タスク3.3: ルーム退出APIの実装
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { RoomService } from '../../services/RoomService';

/**
 * CORS ヘッダー
 */
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * エラーレスポンス型
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

/**
 * POST /api/rooms - ルーム作成ハンドラー
 * @param event API Gateway イベント
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function createRoomHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('POST /api/rooms - createRoom handler', { requestId: context.awsRequestId });

  try {
    // リクエストボディのパース
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'リクエストボディが空です',
          },
        } as ErrorResponse),
      };
    }

    let requestBody: { hostName?: string };
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'リクエストボディが不正なJSON形式です',
          },
        } as ErrorResponse),
      };
    }

    // バリデーション
    if (!requestBody.hostName) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'hostName は必須パラメータです',
          },
        } as ErrorResponse),
      };
    }

    // RoomService を使用してルームを作成
    const roomService = new RoomService();
    const result = await roomService.createRoom(requestBody.hostName);

    // エラーハンドリング
    if (!result.success) {
      const { error } = result;

      switch (error.type) {
        case 'ValidationError':
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'ConnectionError':
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'NotFoundError':
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: `Room not found: ${error.id}`,
              },
            } as ErrorResponse),
          };

        default:
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Unknown error occurred',
              },
            } as ErrorResponse),
          };
      }
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.value),
    };
  } catch (error) {
    console.error('Unexpected error in createRoomHandler:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ErrorResponse),
    };
  }
}

/**
 * POST /api/rooms/:roomId/join - ルーム参加ハンドラー
 * @param event API Gateway イベント
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function joinRoomHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('POST /api/rooms/:roomId/join - joinRoom handler', {
    requestId: context.awsRequestId,
  });

  try {
    // パスパラメータの取得
    const roomId = event.pathParameters?.roomId;
    if (!roomId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'roomId は必須パラメータです',
          },
        } as ErrorResponse),
      };
    }

    // リクエストボディのパース
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'リクエストボディが空です',
          },
        } as ErrorResponse),
      };
    }

    let requestBody: { playerName?: string };
    try {
      requestBody = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'リクエストボディが不正なJSON形式です',
          },
        } as ErrorResponse),
      };
    }

    // バリデーション
    if (!requestBody.playerName) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'playerName は必須パラメータです',
          },
        } as ErrorResponse),
      };
    }

    // RoomService を使用してルームに参加
    const roomService = new RoomService();
    const result = await roomService.joinRoom(roomId, requestBody.playerName);

    // エラーハンドリング
    if (!result.success) {
      const { error } = result;

      switch (error.type) {
        case 'ValidationError':
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'ConnectionError':
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'NotFoundError':
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: `Room not found: ${error.id}`,
              },
            } as ErrorResponse),
          };

        default:
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Unknown error occurred',
              },
            } as ErrorResponse),
          };
      }
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.value),
    };
  } catch (error) {
    console.error('Unexpected error in joinRoomHandler:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ErrorResponse),
    };
  }
}

/**
 * DELETE /api/rooms/:roomId/players/:playerId - ルーム退出ハンドラー
 * @param event API Gateway イベント
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function leaveRoomHandler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('DELETE /api/rooms/:roomId/players/:playerId - leaveRoom handler', {
    requestId: context.awsRequestId,
  });

  try {
    // パスパラメータの取得
    const roomId = event.pathParameters?.roomId;
    const playerId = event.pathParameters?.playerId;

    if (!roomId || !playerId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'roomId と playerId は必須パラメータです',
          },
        } as ErrorResponse),
      };
    }

    // RoomService を使用してルームから退出
    const roomService = new RoomService();
    const result = await roomService.leaveRoom(roomId, playerId);

    // エラーハンドリング
    if (!result.success) {
      const { error } = result;

      switch (error.type) {
        case 'ValidationError':
          return {
            statusCode: 400,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'VALIDATION_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'ConnectionError':
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: error.message,
              },
            } as ErrorResponse),
          };

        case 'NotFoundError':
          return {
            statusCode: 404,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'NOT_FOUND',
                message: `Resource not found: ${error.id}`,
              },
            } as ErrorResponse),
          };

        default:
          return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({
              error: {
                code: 'INTERNAL_ERROR',
                message: 'Unknown error occurred',
              },
            } as ErrorResponse),
          };
      }
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'Successfully left the room' }),
    };
  } catch (error) {
    console.error('Unexpected error in leaveRoomHandler:', error);

    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      } as ErrorResponse),
    };
  }
}
