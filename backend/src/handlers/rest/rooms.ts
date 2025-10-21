/**
 * POST /api/rooms Lambda Handler
 * ルーム作成APIのハンドラー
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RoomService } from '../../services/RoomService';
import { RoomRepository } from '../../repositories/RoomRepository';

/**
 * POST /api/rooms Request Body
 */
interface CreateRoomRequest {
  hostName: string;
}

/**
 * POST /api/rooms Response Body
 */
interface CreateRoomResponse {
  roomId: string;
  hostId: string;
}

/**
 * Error Response Body
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * POST /api/rooms Handler
 * ルーム作成リクエストを処理
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // リクエストボディの解析
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'MISSING_BODY',
            message: 'Request body is required',
          },
        } as ErrorResponse),
      };
    }

    const request: CreateRoomRequest = JSON.parse(event.body);

    // バリデーション
    if (!request.hostName || request.hostName.trim().length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: {
              hostName: 'Host name is required and cannot be empty',
            },
          },
        } as ErrorResponse),
      };
    }

    // サービス初期化
    const tableName = process.env.DYNAMODB_ROOMS_TABLE || 'five-bomber-rooms';
    const roomRepository = new RoomRepository(tableName);
    const roomService = new RoomService(roomRepository);

    // ルーム作成
    const result = await roomService.createRoom(request.hostName);

    if (!result.success) {
      // エラーレスポンス
      const statusCode = result.error.type === 'ValidationError' ? 400 : 500;
      return {
        statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: {
            code: result.error.type.toUpperCase(),
            message: result.error.message,
          },
        } as ErrorResponse),
      };
    }

    // 成功レスポンス
    const response: CreateRoomResponse = {
      roomId: result.value.roomId,
      hostId: result.value.hostId,
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    // 予期しないエラー
    console.error('Unexpected error in POST /api/rooms:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred. Please try again later.',
        },
      } as ErrorResponse),
    };
  }
};
