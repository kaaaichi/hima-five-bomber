import React, { useCallback, useRef, useEffect } from 'react';
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
  // sendMessageのrefを作成（フック間の依存関係を解決）
  const sendMessageRef = useRef<((type: string, payload: unknown) => void) | null>(null);

  // ゲーム状態とタイマー管理
  const { gameState, timeRemaining, handleMessage } = useGameWithTimer({
    onTimeUp: () => {
      // タイムアップ時にサーバーに通知
      if (sendMessageRef.current) {
        sendMessageRef.current('timeUp', {});
      }
    },
  });

  // WebSocket URL構築
  const wsUrl = import.meta.env.VITE_WS_URL
    ? `${import.meta.env.VITE_WS_URL}?roomId=${roomId}&playerId=${playerId}`
    : '';

  // WebSocket接続
  const { isConnected, sendMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      handleMessage(message);
    },
  });

  // sendMessageをrefに保存
  useEffect(() => {
    sendMessageRef.current = sendMessage;
  }, [sendMessage]);

  // 回答送信ハンドラー
  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      sendMessage('submitAnswer', { answer });
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
        question: gameState.question
          ? {
              id: gameState.question.questionId,
              questionText: gameState.question.questionText,
              category: gameState.question.category,
              difficulty: gameState.question.difficulty as 'easy' | 'medium' | 'hard',
            }
          : null,
        timeRemaining,
        currentTurn: gameState.currentTurn,
        answers: gameState.answers,
        players: [], // TODO: プレイヤーリストをゲーム状態に追加
      }}
      currentPlayerId={playerId}
      onSubmitAnswer={handleSubmitAnswer}
    />
  );
};
