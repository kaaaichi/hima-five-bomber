/**
 * WebSocket Disconnect Handler - Unit Tests (TDD)
 * タスク4.1: WebSocket接続管理のテスト
 */

import { APIGatewayProxyWebsocketEventV2, Context } from 'aws-lambda';
import { disconnectHandler } from './disconnect';
import { ConnectionRepository } from '../../repositories/ConnectionRepository';

// ConnectionRepository をモック
jest.mock('../../repositories/ConnectionRepository');

/**
 * WebSocket切断イベントのモックを生成するヘルパー関数
 */
function createMockDisconnectEvent(connectionId: string): APIGatewayProxyWebsocketEventV2 {
  const now = Date.now();
  return {
    requestContext: {
      connectionId,
      connectedAt: now,
      eventType: 'DISCONNECT',
      routeKey: '$disconnect',
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

describe('disconnectHandler', () => {
  let mockConnectionRepository: jest.Mocked<ConnectionRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnectionRepository = new ConnectionRepository() as jest.Mocked<ConnectionRepository>;
    (ConnectionRepository as jest.Mock).mockImplementation(() => mockConnectionRepository);
  });

  it('Given WebSocket接続が切断される When 切断イベントが発火する Then DynamoDB ConnectionsテーブルからconnectionIdが削除される', async () => {
    // Arrange
    const connectionId = 'test-conn-123';
    const event = createMockDisconnectEvent(connectionId);

    mockConnectionRepository.delete = jest.fn().mockResolvedValue(undefined);

    // Act
    const result = await disconnectHandler(event, mockContext, mockConnectionRepository);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      message: 'Disconnected successfully',
    });

    expect(mockConnectionRepository.delete).toHaveBeenCalledWith(connectionId);
  });

  it('Given DynamoDBエラーが発生 When 接続を削除する Then 500エラーが返される', async () => {
    // Arrange
    const connectionId = 'test-conn-123';
    const event = createMockDisconnectEvent(connectionId);

    mockConnectionRepository.delete = jest.fn().mockRejectedValue(new Error('DynamoDB Error'));

    // Act
    const result = await disconnectHandler(event, mockContext, mockConnectionRepository);

    // Assert
    expect(result.statusCode).toBe(500);
    expect(JSON.parse(result.body)).toEqual({
      error: 'Internal server error',
    });
  });
});
