/**
 * useWebSocket Hook
 * タスク4.4: WebSocket通信（フロントエンド）
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * WebSocketメッセージ型（バックエンドのOutboundWebSocketMessageに対応）
 */
export type WebSocketMessage =
  | { type: 'questionStart'; payload: QuestionPayload }
  | { type: 'answerResult'; payload: AnswerResultPayload }
  | { type: 'rankingUpdate'; payload: RankingPayload }
  | { type: 'gameOver'; payload: GameOverPayload }
  | { type: 'error'; payload: ErrorPayload };

export interface QuestionPayload {
  questionId: string;
  questionText: string;
  category: string;
  difficulty: string;
}

export interface AnswerResultPayload {
  correct: boolean;
  score?: number;
  nextTurn: number;
}

export interface RankingPayload {
  rankings: RankingEntry[];
}

export interface RankingEntry {
  roomId: string;
  teamName: string;
  score: number;
  rank: number;
}

export interface GameOverPayload {
  success: boolean;
  totalScore: number;
  timeBonus: number;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

/**
 * useWebSocket Hookのオプション
 */
export interface UseWebSocketOptions {
  /**
   * メッセージ受信時のコールバック
   */
  onMessage?: (message: WebSocketMessage) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: string | Event) => void;

  /**
   * 接続確立時のコールバック
   */
  onOpen?: () => void;

  /**
   * 接続切断時のコールバック
   */
  onClose?: () => void;

  /**
   * 自動再接続を有効にするか（デフォルト: true）
   */
  autoReconnect?: boolean;

  /**
   * 再接続間隔（ミリ秒、デフォルト: 1000ms）
   */
  reconnectInterval?: number;

  /**
   * 最大再接続試行回数（デフォルト: 3）
   */
  maxReconnectAttempts?: number;
}

/**
 * useWebSocket Hookの戻り値
 */
export interface UseWebSocketReturn {
  /**
   * WebSocketが接続されているか
   */
  isConnected: boolean;

  /**
   * メッセージを送信する
   */
  sendMessage: (type: string, payload: unknown) => void;

  /**
   * WebSocket接続をクローズする
   */
  close: () => void;
}

/**
 * useWebSocket カスタムHook
 *
 * WebSocket接続の確立・維持とメッセージ送受信を管理します。
 *
 * @param url - WebSocket URL（空文字列の場合は接続しない）
 * @param options - オプション設定
 * @returns WebSocket接続状態と制御関数
 */
export function useWebSocket(
  url: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    autoReconnect = true,
    reconnectInterval = 1000,
    maxReconnectAttempts = 3,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(true);

  /**
   * WebSocket接続を確立する
   */
  const connect = useCallback(() => {
    if (!url || url === '') {
      return;
    }

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[useWebSocket] Connected to WebSocket', { url });
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // 再接続カウンターをリセット
        onOpen?.();
      };

      ws.onclose = () => {
        console.log('[useWebSocket] Disconnected from WebSocket');
        setIsConnected(false);
        wsRef.current = null;
        onClose?.();

        // 自動再接続
        if (shouldReconnectRef.current && autoReconnect) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            const backoffDelay = reconnectInterval * Math.pow(2, reconnectAttemptsRef.current);
            console.log(
              `[useWebSocket] Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`
            );

            reconnectTimeoutRef.current = window.setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, backoffDelay);
          } else {
            console.error('[useWebSocket] Max reconnect attempts reached');
            onError?.('Max reconnect attempts reached');
          }
        }
      };

      ws.onerror = (event) => {
        console.error('[useWebSocket] WebSocket error', event);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[useWebSocket] Message received', { type: message.type });
          onMessage?.(message);
        } catch (error) {
          console.error('[useWebSocket] Failed to parse message', { error, data: event.data });
          onError?.('Failed to parse WebSocket message');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[useWebSocket] Failed to create WebSocket', { error });
      onError?.(error instanceof Error ? error.message : 'Failed to create WebSocket');
    }
  }, [url, autoReconnect, reconnectInterval, maxReconnectAttempts, onMessage, onError, onOpen, onClose]);

  /**
   * WebSocket接続をクローズする
   */
  const close = useCallback(() => {
    shouldReconnectRef.current = false;

    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  /**
   * メッセージを送信する
   */
  const sendMessage = useCallback((type: string, payload: unknown) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const message = {
      type,
      payload,
    };

    wsRef.current.send(JSON.stringify(message));
    console.log('[useWebSocket] Message sent', { type });
  }, []);

  // マウント時に接続
  useEffect(() => {
    connect();

    // アンマウント時にクリーンアップ
    return () => {
      close();
    };
  }, [connect, close]);

  return {
    isConnected,
    sendMessage,
    close,
  };
}
