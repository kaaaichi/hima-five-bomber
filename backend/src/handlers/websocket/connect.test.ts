/**
 * WebSocket Connect Handler - Unit Tests (TDD)
 * タスク4.1: WebSocket接続管理のテスト
 */

import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import { connectHandler } from './connect';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';

// ConnectionRepository をモック
jest.mock('../../repositories/ConnectionRepository');

/**
 * WebSocketイベントのモックを生成するヘルパー関数
 */
function createMockWebSocketEvent(options: {
  connectionId: string;
  queryStringParameters?: Record<string, string>;
}): APIGatewayProxyWebsocketEventV2 {
  const now = Date.now();
  return {
    requestContext: {
      connectionId: options.connectionId,
      connectedAt: now,
      eventType: 'CONNECT',
      routeKey: '$connect',
      requestId: 'test-request-id',
      apiId: 'test-api-id',
      domainName: 'test.execute-api.ap-northeast-1.amazonaws.com',
      stage: 'prd',
      messageId: 'test-message-id',
      extendedRequestId: 'test-extended-request-id',
      requestTime: new Date(now).toISOString(),
      messageDirection: 'IN',
      requestTimeEpoch: now,
    },
    queryStringParameters: options.queryStringParameters,
    headers: {},
    isBase64Encoded: false,
  } as APIGatewayProxyWebsocketEventV2;
}

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:ap-northeast-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2024/01/01/[$LATEST]test',
  getRemainingTimeInMillis: () => 30000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('connectHandler', () => {
  let mockConnectionRepository: jest.Mocked<ConnectionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionRepository = new ConnectionRepository() as jest.Mocked<ConnectionRepository>;
    (ConnectionRepository as jest.Mock).mockImplementation(() => mockConnectionRepository);
  });

  it('Given クライアントがWebSocket接続を確立する When 接続イベントが発火する Then DynamoDB ConnectionsテーブルにconnectionIdが保存される And クライアントに接続成功レスポンスが返る', async () => {
    // Arrange
    const connectionId = 'test-conn-123';
    const playerId = 'player-456';
    const roomId = 'ROOM01';

    const event = createMockWebSocketEvent({
      connectionId,
      queryStringParameters: {
        playerId,
        roomId,
      },
    });

    mockConnectionRepository.save = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await connectHandler(event, mockContext, mockConnectionRepository);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Connected successfully',
      connectionId,
    });

    expect(mockConnectionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        connectionId,
        playerId,
        roomId,
        connectedAt: expect.any(Number),
      })
    );
  });

  it('Given クエリパラメータが不足している When 接続リクエストが送信される Then 400エラーが返される', async () => {
    // Arrange
    const event = createMockWebSocketEvent({
      connectionId: 'test-conn-123',
      queryStringParameters: {}, // playerIdとroomIdが不足
    });

    // Act
    const result = await connectHandler(event, mockContext, mockConnectionRepository);

    // Assert
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Missing required parameters: playerId and roomId',
    });

    expect(mockConnectionRepository.save).not.toHaveBeenCalled();
  });

  it('Given DynamoDBエラーが発生 When 接続を保存する Then 500エラーが返される', async () => {
    // Arrange
    const connectionId = 'test-conn-123';
    const event = createMockWebSocketEvent({
      connectionId,
      queryStringParameters: {
        playerId: 'player-456',
        roomId: 'ROOM01',
      },
    });

    mockConnectionRepository.save = jest.fn().mockRejectedValue(new Error('DynamoDB Error'));

    // Act
    const result = await connectHandler(event, mockContext, mockConnectionRepository);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Internal server error',
    });
  });
});
