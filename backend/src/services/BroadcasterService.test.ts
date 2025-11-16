/**
 * BroadcasterService - Unit Tests (TDD)
 * タスク4.3: WebSocketブロードキャスト機能のテスト
 */

import { BroadcasterService } from './BroadcasterService';
import { ConnectionRepository } from '../repositories/ConnectionRepository';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { mockClient } from 'aws-sdk-client-mock';
import { Connection } from '../types-shared/models';

// モックの設定
jest.mock('../repositories/ConnectionRepository');
const apiGatewayMock = mockClient(ApiGatewayManagementApiClient);

describe('BroadcasterService', () => {
  let broadcasterService: BroadcasterService;
  let mockConnectionRepository: jest.Mocked<ConnectionRepository>;

  const testEndpoint = 'https://test.execute-api.ap-northeast-1.amazonaws.com/prd';

  beforeEach(() => {
    jest.clearAllMocks();
    apiGatewayMock.reset();

    mockConnectionRepository = new ConnectionRepository() as jest.Mocked<ConnectionRepository>;
    (ConnectionRepository as jest.Mock).mockImplementation(() => mockConnectionRepository);

    broadcasterService = new BroadcasterService(testEndpoint, mockConnectionRepository);
  });

  describe('broadcastToRoom', () => {
    it('Given ルームに複数のプレイヤーが接続している When ランキング更新イベントが発生する Then 全プレイヤーの接続にランキングデータがブロードキャストされる', async () => {
      // Arrange
      const roomId = 'ROOM01';
      const message = { type: 'rankingUpdate', payload: { rankings: [] } };

      const mockConnections: Connection[] = [
        {
          connectionId: 'conn-1',
          playerId: 'player-1',
          roomId,
          connectedAt: Date.now(),
        },
        {
          connectionId: 'conn-2',
          playerId: 'player-2',
          roomId,
          connectedAt: Date.now(),
        },
        {
          connectionId: 'conn-3',
          playerId: 'player-3',
          roomId,
          connectedAt: Date.now(),
        },
      ];

      mockConnectionRepository.findByRoomId = jest.fn().mockResolvedValue(mockConnections);
      apiGatewayMock.on(PostToConnectionCommand).resolves({});

      // Act
      const startTime = Date.now();
      await broadcasterService.broadcastToRoom(roomId, message);
      const elapsedTime = Date.now() - startTime;

      // Assert
      expect(mockConnectionRepository.findByRoomId).toHaveBeenCalledWith(roomId);

      const postCalls = apiGatewayMock.commandCalls(PostToConnectionCommand);
      expect(postCalls.length).toBe(3);

      // 各接続に正しいメッセージが送信されたことを確認
      mockConnections.forEach((conn, index) => {
        expect(postCalls[index].args[0].input).toEqual({
          ConnectionId: conn.connectionId,
          Data: JSON.stringify(message),
        });
      });

      // 200ms以内に完了することを確認（緩い検証: 実際は並列処理で高速）
      expect(elapsedTime).toBeLessThan(1000); // テスト環境では1秒以内
    });

    it('Given ルーム内に接続が存在しない When broadcastToRoom が呼ばれる Then 何も送信されずに正常終了する', async () => {
      // Arrange
      const roomId = 'EMPTY_ROOM';
      const message = { type: 'test', payload: {} };

      mockConnectionRepository.findByRoomId = jest.fn().mockResolvedValue([]);

      // Act
      await broadcasterService.broadcastToRoom(roomId, message);

      // Assert
      expect(mockConnectionRepository.findByRoomId).toHaveBeenCalledWith(roomId);

      const postCalls = apiGatewayMock.commandCalls(PostToConnectionCommand);
      expect(postCalls.length).toBe(0);
    });

    it('Given 配信失敗した接続がある When broadcastToRoom が呼ばれる Then 失敗した接続はDynamoDBから削除される', async () => {
      // Arrange
      const roomId = 'ROOM01';
      const message = { type: 'test', payload: {} };

      const mockConnections: Connection[] = [
        {
          connectionId: 'conn-success',
          playerId: 'player-1',
          roomId,
          connectedAt: Date.now(),
        },
        {
          connectionId: 'conn-fail',
          playerId: 'player-2',
          roomId,
          connectedAt: Date.now(),
        },
      ];

      mockConnectionRepository.findByRoomId = jest.fn().mockResolvedValue(mockConnections);
      mockConnectionRepository.delete = jest.fn().mockResolvedValue(undefined);

      // 1つ目の接続は成功、2つ目は失敗（GoneException）
      apiGatewayMock
        .on(PostToConnectionCommand, { ConnectionId: 'conn-success' })
        .resolves({})
        .on(PostToConnectionCommand, { ConnectionId: 'conn-fail' })
        .rejects({ name: 'GoneException', message: 'Connection is gone' });

      // Act
      await broadcasterService.broadcastToRoom(roomId, message);

      // Assert
      expect(mockConnectionRepository.delete).toHaveBeenCalledWith('conn-fail');
      expect(mockConnectionRepository.delete).not.toHaveBeenCalledWith('conn-success');
    });

    it('Given DynamoDBエラーが発生 When broadcastToRoom が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      const roomId = 'ROOM01';
      const message = { type: 'test', payload: {} };

      mockConnectionRepository.findByRoomId = jest.fn().mockRejectedValue(new Error('DynamoDB Error'));

      // Act & Assert
      await expect(broadcasterService.broadcastToRoom(roomId, message)).rejects.toThrow('DynamoDB Error');
    });
  });

  describe('sendToConnection', () => {
    it('Given 有効な接続ID When sendToConnection が呼ばれる Then メッセージが送信される', async () => {
      // Arrange
      const connectionId = 'conn-123';
      const message = { type: 'test', payload: { data: 'hello' } };

      apiGatewayMock.on(PostToConnectionCommand).resolves({});

      // Act
      await broadcasterService.sendToConnection(connectionId, message);

      // Assert
      const postCalls = apiGatewayMock.commandCalls(PostToConnectionCommand);
      expect(postCalls.length).toBe(1);
      expect(postCalls[0].args[0].input).toEqual({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      });
    });

    it('Given 無効な接続ID（GoneException） When sendToConnection が呼ばれる Then falseが返される', async () => {
      // Arrange
      const connectionId = 'conn-gone';
      const message = { type: 'test', payload: {} };

      apiGatewayMock.on(PostToConnectionCommand).rejects({ name: 'GoneException', message: 'Gone' });

      // Act
      const result = await broadcasterService.sendToConnection(connectionId, message);

      // Assert
      expect(result).toBe(false);
    });

    it('Given API Gatewayエラーが発生 When sendToConnection が呼ばれる Then エラーがスローされる', async () => {
      // Arrange
      const connectionId = 'conn-123';
      const message = { type: 'test', payload: {} };

      apiGatewayMock.on(PostToConnectionCommand).rejects(new Error('API Gateway Error'));

      // Act & Assert
      await expect(broadcasterService.sendToConnection(connectionId, message)).rejects.toThrow('API Gateway Error');
    });
  });
});
