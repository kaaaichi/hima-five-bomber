/**
 * Rooms REST API Handler - Unit Tests (TDD)
 * タスク3.1: ルーム作成APIのテスト
 * タスク3.2: ルーム参加APIのテスト
 * タスク3.3: ルーム退出APIのテスト
 */

import { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { createRoomHandler, joinRoomHandler, leaveRoomHandler } from './rooms';
import { RoomService } from '../../services/RoomService';

// RoomService をモック
jest.mock('../../services/RoomService');

/**
 * v2.0形式のモックイベントを生成するヘルパー関数
 */
function createMockEventV2(options: {
  method: string;
  path: string;
  body?: string;
  pathParameters?: Record<string, string>;
}): Partial<APIGatewayProxyEventV2> {
  return {
    version: '2.0',
    routeKey: `${options.method} ${options.path}`,
    rawPath: options.path,
    rawQueryString: '',
    headers: {
      'content-type': 'application/json',
    },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api-id',
      domainName: 'test.execute-api.ap-northeast-1.amazonaws.com',
      domainPrefix: 'test',
      http: {
        method: options.method,
        path: options.path,
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest-test',
      },
      requestId: 'test-request-id',
      routeKey: `${options.method} ${options.path}`,
      stage: '$default',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    body: options.body,
    pathParameters: options.pathParameters,
    isBase64Encoded: false,
  };
}

describe('POST /api/rooms - createRoomHandler', () => {
  let mockRoomService: jest.Mocked<RoomService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoomService = new RoomService() as jest.Mocked<RoomService>;
    (RoomService as jest.MockedClass<typeof RoomService>).mockImplementation(() => mockRoomService);
  });

  describe('Acceptance Criteria: POST /api/rooms エンドポイント', () => {
    it('Given 有効なリクエストボディ When POST /api/rooms Then 200レスポンスとルーム情報が返される', async () => {
      // Arrange
      const hostName = 'TestHost';
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: JSON.stringify({ hostName }),
      });

      mockRoomService.createRoom = jest.fn().mockResolvedValue({
        success: true,
        value: {
          roomId: 'ABC123',
          hostId: 'host-123',
        },
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(200);
      expect(result.headers).toEqual({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });

      const body = JSON.parse(result.body!);
      expect(body).toEqual({
        roomId: 'ABC123',
        hostId: 'host-123',
      });

      expect(mockRoomService.createRoom).toHaveBeenCalledWith(hostName);
    });

    it('Given hostNameが欠けている When POST /api/rooms Then 400エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: JSON.stringify({}),
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toBe('Invalid request parameters');
      expect(body.error.details).toHaveProperty('hostName');

      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('Given リクエストボディが不正なJSON When POST /api/rooms Then 400エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: 'invalid json',
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('INVALID_JSON');
      expect(body.error.message).toBe('Request body must be valid JSON');

      expect(mockRoomService.createRoom).not.toHaveBeenCalled();
    });

    it('Given RoomServiceがエラーを返す When POST /api/rooms Then 適切なエラーレスポンスが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: JSON.stringify({ hostName: 'TestHost' }),
      });

      mockRoomService.createRoom = jest.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'ValidationError',
          message: 'ホスト名は20文字以内で入力してください',
        },
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);

      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(body.error.message).toContain('20文字以内');
    });

    it('Given RoomServiceが接続エラーを返す When POST /api/rooms Then 500エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: JSON.stringify({ hostName: 'TestHost' }),
      });

      mockRoomService.createRoom = jest.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'ConnectionError',
          message: 'DynamoDB connection failed',
        },
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(500);

      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('INTERNAL_ERROR');
      expect(body.error.message).toContain('DynamoDB connection failed');
    });
  });

  describe('CORS ヘッダー', () => {
    it('Given すべてのレスポンス When レスポンスを返す Then CORS ヘッダーが含まれる', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms',
        body: JSON.stringify({ hostName: 'TestHost' }),
      });

      mockRoomService.createRoom = jest.fn().mockResolvedValue({
        success: true,
        value: {
          roomId: 'ABC123',
          hostId: 'host-123',
        },
      });

      // Act
      const result = await createRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
    });
  });
});

describe('POST /api/rooms/:roomId/join - joinRoomHandler', () => {
  let mockRoomService: jest.Mocked<RoomService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoomService = new RoomService() as jest.Mocked<RoomService>;
    (RoomService as jest.MockedClass<typeof RoomService>).mockImplementation(() => mockRoomService);
  });

  describe('Acceptance Criteria: POST /api/rooms/:roomId/join エンドポイント', () => {
    it('Given 有効なリクエスト When POST /api/rooms/:roomId/join Then 200レスポンスとplayerIdが返される', async () => {
      // Arrange
      const roomId = 'ABC123';
      const playerName = 'TestPlayer';
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms/{roomId}/join',
        body: JSON.stringify({ playerName }),
        pathParameters: { roomId },
      });

      mockRoomService.joinRoom = jest.fn().mockResolvedValue({
        success: true,
        value: {
          playerId: 'player-456',
        },
      });

      // Act
      const result = await joinRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body!);
      expect(body).toEqual({ playerId: 'player-456' });
      expect(mockRoomService.joinRoom).toHaveBeenCalledWith(roomId, playerName);
    });

    it('Given roomIdが欠けている When POST /api/rooms/:roomId/join Then 400エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms/{roomId}/join',
        body: JSON.stringify({ playerName: 'TestPlayer' }),
        pathParameters: {},
      });

      // Act
      const result = await joinRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockRoomService.joinRoom).not.toHaveBeenCalled();
    });

    it('Given ルームが満員 When POST /api/rooms/:roomId/join Then 409エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'POST',
        path: '/rooms/{roomId}/join',
        body: JSON.stringify({ playerName: 'TestPlayer' }),
        pathParameters: { roomId: 'ABC123' },
      });

      mockRoomService.joinRoom = jest.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'ValidationError',
          message: 'ルームが満員です（最大5人）',
        },
      });

      // Act
      const result = await joinRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body!);
      expect(body.error.message).toContain('満員');
    });
  });
});

describe('DELETE /api/rooms/:roomId/players/:playerId - leaveRoomHandler', () => {
  let mockRoomService: jest.Mocked<RoomService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoomService = new RoomService() as jest.Mocked<RoomService>;
    (RoomService as jest.MockedClass<typeof RoomService>).mockImplementation(() => mockRoomService);
  });

  describe('Acceptance Criteria: DELETE /api/rooms/:roomId/players/:playerId エンドポイント', () => {
    it('Given 有効なリクエスト When DELETE /api/rooms/:roomId/players/:playerId Then 200レスポンスが返される', async () => {
      // Arrange
      const roomId = 'ABC123';
      const playerId = 'player-456';
      const event = createMockEventV2({
        method: 'DELETE',
        path: '/rooms/{roomId}/players/{playerId}',
        pathParameters: { roomId, playerId },
      });

      mockRoomService.leaveRoom = jest.fn().mockResolvedValue({
        success: true,
        value: undefined,
      });

      // Act
      const result = await leaveRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body!);
      expect(body).toEqual({ message: 'Successfully left the room' });
      expect(mockRoomService.leaveRoom).toHaveBeenCalledWith(roomId, playerId);
    });

    it('Given pathParametersが欠けている When DELETE Then 400エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'DELETE',
        path: '/rooms/{roomId}/players/{playerId}',
        pathParameters: {},
      });

      // Act
      const result = await leaveRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('VALIDATION_ERROR');
      expect(mockRoomService.leaveRoom).not.toHaveBeenCalled();
    });

    it('Given ルームが存在しない When DELETE Then 404エラーが返される', async () => {
      // Arrange
      const event = createMockEventV2({
        method: 'DELETE',
        path: '/rooms/{roomId}/players/{playerId}',
        pathParameters: { roomId: 'ABC123', playerId: 'player-456' },
      });

      mockRoomService.leaveRoom = jest.fn().mockResolvedValue({
        success: false,
        error: {
          type: 'NotFoundError',
          id: 'ABC123',
        },
      });

      // Act
      const result = await leaveRoomHandler(event as APIGatewayProxyEventV2, {} as Context);

      // Assert
      expect(result.statusCode).toBe(404);
      const body = JSON.parse(result.body!);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});
