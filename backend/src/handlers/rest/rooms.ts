/**
 * Rooms REST API Handler
 * タスク3.1: ルーム作成APIの実装
 * タスク3.2: ルーム参加APIの実装
 * タスク3.3: ルーム退出APIの実装
 * リファクタリング: Zodバリデーションとリポジトリ層の統合
 */

import {
  APIGatewayProxyEventV2,
  APIGatewayProxyStructuredResultV2,
  Context,
} from 'aws-lambda';
import { RoomService } from '../../services/RoomService';
import { RoomRepository } from '../../repositories/RoomRepository';
import { validateCreateRoomRequest, validatePlayerName } from '../../types-shared/schemas';

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
    details?: unknown;
  };
}

/**
 * ルーム参加リクエストボディ型
 */
interface JoinRoomRequestBody {
  playerName?: string;
}

/**
 * POST /api/rooms - ルーム作成ハンドラー
 * @param event API Gateway イベント (Payload Format v2.0)
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function createRoomHandler(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log('POST /api/rooms - createRoom handler', { requestId: context.awsRequestId });

  try {
    // リクエストボディのパース
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'MISSING_BODY',
            message: 'Request body is required',
          },
        } as ErrorResponse),
      };
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        } as ErrorResponse),
      };
    }

    // Zodによるバリデーション
    const validation = validateCreateRoomRequest(requestBody);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: validation.errors.reduce(
              (acc, err) => ({ ...acc, [err.field]: err.message }),
              {}
            ),
          },
        } as ErrorResponse),
      };
    }

    const request = validation.data;

    // サービス初期化（Repository層を経由）
    const tableName = process.env.DYNAMODB_ROOMS_TABLE || 'FiveBomber-Rooms';
    const roomRepository = new RoomRepository(tableName);
    const roomService = new RoomService(roomRepository);

    // ルーム作成
    const result = await roomService.createRoom(request.hostName);

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
                message: error.message,
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
 * GET /api/rooms/:roomId - ルーム取得ハンドラー
 * @param event API Gateway イベント (Payload Format v2.0)
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function getRoomHandler(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log('GET /api/rooms/:roomId - getRoom handler', {
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

    // サービス層の呼び出し
    const tableName = process.env.DYNAMODB_ROOMS_TABLE || 'FiveBomber-Rooms';
    const roomRepository = new RoomRepository(tableName);
    const roomService = new RoomService(roomRepository);
    const result = await roomService.getRoom(roomId);

    // エラーハンドリング
    if (!result.success) {
      if (result.error === 'Room not found') {
        return {
          statusCode: 404,
          headers: CORS_HEADERS,
          body: JSON.stringify({
            error: {
              code: 'NOT_FOUND',
              message: `Room not found: ${roomId}`,
            },
          } as ErrorResponse),
        };
      }

      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'SERVICE_ERROR',
            message: result.error || 'Failed to retrieve room',
          },
        } as ErrorResponse),
      };
    }

    // 成功レスポンス
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(result.value),
    };
  } catch (error) {
    console.error('Unexpected error in getRoomHandler:', error);

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
 * @param event API Gateway イベント (Payload Format v2.0)
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function joinRoomHandler(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
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
            code: 'MISSING_BODY',
            message: 'Request body is required',
          },
        } as ErrorResponse),
      };
    }

    let requestBody: unknown;
    try {
      requestBody = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON',
          },
        } as ErrorResponse),
      };
    }

    // playerNameのバリデーション
    const validation = validatePlayerName((requestBody as JoinRoomRequestBody)?.playerName);
    if (!validation.success) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: validation.errors.reduce(
              (acc, err) => ({ ...acc, [err.field]: err.message }),
              {}
            ),
          },
        } as ErrorResponse),
      };
    }

    // サービス初期化（Repository層を経由）
    const tableName = process.env.DYNAMODB_ROOMS_TABLE || 'FiveBomber-Rooms';
    const roomRepository = new RoomRepository(tableName);
    const roomService = new RoomService(roomRepository);

    // ルーム参加
    const result = await roomService.joinRoom(roomId, validation.data);

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
                message: error.message,
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
 * @param event API Gateway イベント (Payload Format v2.0)
 * @param context Lambda コンテキスト
 * @returns API Gateway レスポンス
 */
export async function leaveRoomHandler(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
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

    // サービス初期化（Repository層を経由）
    const tableName = process.env.DYNAMODB_ROOMS_TABLE || 'FiveBomber-Rooms';
    const roomRepository = new RoomRepository(tableName);
    const roomService = new RoomService(roomRepository);

    // ルーム退出
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
                message: error.message,
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

/**
 * 統合ハンドラー - API Gatewayからのルーティング
 * Lambda Container Imageのエントリーポイント (Payload Format v2.0)
 */
export async function handler(
  event: APIGatewayProxyEventV2,
  context: Context
): Promise<APIGatewayProxyStructuredResultV2> {
  console.log('Rooms handler - Routing request', {
    method: event.requestContext.http.method,
    path: event.requestContext.http.path,
    routeKey: event.routeKey,
    rawPath: event.rawPath,
  });

  // HTTPメソッドとパスに基づいてルーティング
  const method = event.requestContext.http.method;
  const roomId = event.pathParameters?.roomId;

  try {
    // POST /rooms - ルーム作成
    if (method === 'POST' && !roomId) {
      return await createRoomHandler(event, context);
    }

    // GET /rooms/:roomId - ルーム取得
    if (method === 'GET' && roomId) {
      return await getRoomHandler(event, context);
    }

    // POST /rooms/:roomId/join - ルーム参加
    if (method === 'POST' && roomId && event.rawPath.endsWith('/join')) {
      return await joinRoomHandler(event, context);
    }

    // DELETE /rooms/:roomId/leave - ルーム退出
    if (method === 'DELETE' && roomId && event.rawPath.endsWith('/leave')) {
      return await leaveRoomHandler(event, context);
    }

    // 該当するルートがない場合
    return {
      statusCode: 404,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: {
          code: 'NOT_FOUND',
          message: 'Route not found',
        },
      } as ErrorResponse),
    };
  } catch (error) {
    console.error('Unexpected error in rooms handler:', error);
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
