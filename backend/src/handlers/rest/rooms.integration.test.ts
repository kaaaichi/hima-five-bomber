/**
 * POST /api/rooms Integration Tests
 * APIエンドポイントからDynamoDBまでの統合テスト
 */

import { APIGatewayProxyEvent, APIGatewayEventRequestContext, Context } from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createRoomHandler } from './rooms';

const ddbMock = mockClient(DynamoDBDocumentClient);

// テスト用のrequestContext
const mockRequestContext: APIGatewayEventRequestContext = {
  accountId: 'test-account',
  apiId: 'test-api',
  protocol: 'HTTP/1.1',
  httpMethod: 'POST',
  path: '/api/rooms',
  stage: 'test',
  requestId: 'test-request-id',
  requestTimeEpoch: Date.now(),
  resourceId: 'test-resource',
  resourcePath: '/api/rooms',
  identity: {
    accessKey: null,
    accountId: null,
    apiKey: null,
    apiKeyId: null,
    caller: null,
    clientCert: null,
    cognitoAuthenticationProvider: null,
    cognitoAuthenticationType: null,
    cognitoIdentityId: null,
    cognitoIdentityPoolId: null,
    principalOrgId: null,
    sourceIp: '127.0.0.1',
    user: null,
    userAgent: 'test-agent',
    userArn: null,
  },
  authorizer: null,
};

describe('POST /api/rooms - Integration Tests', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.DYNAMODB_ROOMS_TABLE = 'test-rooms-table';
  });

  afterEach(() => {
    delete process.env.DYNAMODB_ROOMS_TABLE;
  });

  describe('Success Cases', () => {
    test('Given valid request WHEN POST /api/rooms is called THEN room is created and stored in DynamoDB', async () => {
      // Arrange
      const requestBody = {
        hostName: 'Test Host Player',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // DynamoDB モック設定
      // GetCommand: ルームID重複チェック用（重複なし）
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      // PutCommand: ルーム保存用
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert - レスポンスの検証
      expect(result.statusCode).toBe(200);
      expect(result.headers).toMatchObject({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });

      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('roomId');
      expect(responseBody).toHaveProperty('hostId');
      expect(responseBody.roomId).toMatch(/^[A-Z0-9]{6}$/);
      expect(responseBody.hostId).toMatch(/^[a-f0-9]{32}$/);

      // DynamoDB PutCommandが呼ばれたことを確認
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.TableName).toBe('test-rooms-table');
      expect(putCall.args[0].input.Item).toMatchObject({
        roomId: expect.stringMatching(/^[A-Z0-9]{6}$/),
        hostId: expect.stringMatching(/^[a-f0-9]{32}$/),
        status: 'waiting',
        createdAt: expect.any(Number),
      });
      expect(putCall.args[0].input.Item?.players).toHaveLength(1);
      expect(putCall.args[0].input.Item?.players[0]).toMatchObject({
        playerId: expect.stringMatching(/^[a-f0-9]{32}$/),
        name: 'Test Host Player',
        joinedAt: expect.any(Number),
      });
    });

    test('Given request with Japanese host name WHEN POST /api/rooms is called THEN room is created successfully', async () => {
      // Arrange
      const requestBody = {
        hostName: 'テストホスト',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // DynamoDB モック設定
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toHaveProperty('roomId');
      expect(responseBody).toHaveProperty('hostId');

      // DynamoDBに日本語の名前が保存されていることを確認
      const putCall = ddbMock.commandCalls(PutCommand)[0];
      expect(putCall.args[0].input.Item?.players[0].name).toBe('テストホスト');
    });
  });

  describe('Validation Error Cases', () => {
    test('Given missing request body WHEN POST /api/rooms is called THEN 400 error is returned', async () => {
      // Arrange
      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: null,
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error).toMatchObject({
        code: 'MISSING_BODY',
        message: 'Request body is required',
      });

      // DynamoDBが呼ばれていないことを確認
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
    });

    test('Given empty hostName WHEN POST /api/rooms is called THEN 400 validation error is returned', async () => {
      // Arrange
      const requestBody = {
        hostName: '',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
      expect(responseBody.error.message).toBe('Invalid request parameters');
      expect(responseBody.error.details).toHaveProperty('hostName');
      expect(responseBody.error.details.hostName).toContain('Host name');

      // DynamoDBが呼ばれていないことを確認
      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
    });

    test('Given whitespace-only hostName WHEN POST /api/rooms is called THEN 400 validation error is returned', async () => {
      // Arrange
      const requestBody = {
        hostName: '   ',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.statusCode).toBe(400);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Database Error Cases', () => {
    test('Given DynamoDB connection error WHEN POST /api/rooms is called THEN 500 error is returned', async () => {
      // Arrange
      const requestBody = {
        hostName: 'Test Host',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // DynamoDBエラーをシミュレート
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB connection timeout'));
      ddbMock.on(PutCommand).rejects(new Error('DynamoDB connection timeout'));

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.statusCode).toBe(500);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.error.code).toBe('INTERNAL_ERROR');
      expect(responseBody.error.message).toContain('DynamoDB connection timeout');
    });
  });

  describe('CORS Headers', () => {
    test('Given any request WHEN POST /api/rooms is called THEN CORS headers are included in response', async () => {
      // Arrange
      const requestBody = {
        hostName: 'Test Host',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {},
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // DynamoDB モック設定
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert
      expect(result.headers).toHaveProperty('Access-Control-Allow-Origin');
      expect(result.headers?.['Access-Control-Allow-Origin']).toBe('*');
      expect(result.headers).toHaveProperty('Content-Type');
      expect(result.headers?.['Content-Type']).toBe('application/json');
    });
  });

  describe('End-to-End Flow', () => {
    test('Given complete valid request WHEN POST /api/rooms is called THEN entire flow from API to DynamoDB succeeds', async () => {
      // Arrange
      const requestBody = {
        hostName: 'Complete Flow Host',
      };

      const event: APIGatewayProxyEvent = {
        httpMethod: 'POST',
        path: '/api/rooms',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json',
        },
        multiValueHeaders: {},
        isBase64Encoded: false,
        pathParameters: null,
        queryStringParameters: null,
        multiValueQueryStringParameters: null,
        stageVariables: null,
        requestContext: mockRequestContext,
        resource: '',
      };

      // DynamoDB モック設定
      ddbMock.on(GetCommand).resolves({ Item: undefined });
      ddbMock.on(PutCommand).resolves({});

      // Act
      const result = await createRoomHandler(event, {} as Context);

      // Assert - API Response
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      const { roomId, hostId } = responseBody;

      // Assert - DynamoDB Interaction
      const putCalls = ddbMock.commandCalls(PutCommand);
      expect(putCalls).toHaveLength(1);

      const savedItem = putCalls[0].args[0].input.Item;
      expect(savedItem).toMatchObject({
        roomId: roomId,
        hostId: hostId,
        status: 'waiting',
        players: [
          {
            playerId: hostId,
            name: 'Complete Flow Host',
            joinedAt: expect.any(Number),
          },
        ],
        createdAt: expect.any(Number),
      });

      // タイムスタンプが妥当な範囲内であることを確認
      const now = Date.now();
      expect(savedItem?.createdAt).toBeGreaterThan(now - 5000);
      expect(savedItem?.createdAt).toBeLessThanOrEqual(now);
    });
  });
});
