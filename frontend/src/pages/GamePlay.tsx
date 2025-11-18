import React, { useEffect, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { useGameWithTimer } from '../hooks/useGameWithTimer';
import { GameBoard } from '../components/game/GameBoard';

export interface GamePlayProps {
  /**
   * ルームID
   */
  roomId: string;

  /**
   * プレイヤーID
   */
  playerId: string;
}

/**
 * GamePlayページコンポーネント
 *
 * ゲームプレイ画面を表示し、WebSocketを通じてリアルタイムに
 * ゲーム状態を同期します。タイマーと回答送信機能を統合しています。
 *
 * @example
 * ```tsx
 * <GamePlay roomId="room-123" playerId="player-456" />
 * ```
 */
export const GamePlay: React.FC<GamePlayProps> = ({ roomId, playerId }) => {
  // WebSocket接続
  const { isConnected, sendMessage } = useWebSocket({
    roomId,
    onMessage: (message) => {
      handleMessage(message);
    },
  });

  // ゲーム状態とタイマー管理
  const { gameState, timeRemaining, handleMessage, reset } = useGameWithTimer({
    onTimeUp: () => {
      // タイムアップ時にサーバーに通知
      sendMessage({
        type: 'timeUp',
        payload: {},
      });
    },
  });

  // 回答送信ハンドラー
  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      sendMessage({
        type: 'submitAnswer',
        payload: {
          answer,
        },
      });
    },
    [sendMessage]
  );

  // WebSocket未接続時
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">接続中...</div>
      </div>
    );
  }

  return (
    <GameBoard
      gameState={{
        ...gameState,
        timeRemaining,
      }}
      currentPlayerId={playerId}
      onSubmitAnswer={handleSubmitAnswer}
    />
  );
};
