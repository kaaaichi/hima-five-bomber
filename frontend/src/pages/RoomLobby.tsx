/**
 * RoomLobby Page - ルーム待機画面
 * プレイヤーリスト表示とゲーム開始ボタン
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { getRoom } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';

// 定数定義
const MAX_PLAYERS = 5;
const MIN_PLAYERS_TO_START = 1;

const ERROR_MESSAGES = {
  FETCH_FAILED: 'ルーム情報の取得に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  ROOM_NOT_FOUND: 'ルームが見つかりません',
} as const;

const UI_MESSAGES = {
  LOADING: '読み込み中...',
  WAITING: 'ルーム待機中',
  GAME_START: 'ゲーム開始',
  GAME_START_DISABLED: '1人以上必要です',
  LEAVE_ROOM: 'ルームを退出',
  BACK_TO_TOP: 'トップに戻る',
  HOST_LABEL: 'ホスト',
  YOU_LABEL: 'あなた',
} as const;

interface Player {
  playerId: string;
  name: string;
  joinedAt: number;
}

interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

interface LocationState {
  roomId: string;
  playerId: string;
  isHost: boolean;
}

export function RoomLobby() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomId } = useParams<{ roomId: string }>();
  const state = location.state as LocationState | null;

  const [room, setRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // WebSocket URL構築
  const wsUrl = import.meta.env.VITE_WS_URL && roomId && state?.playerId
    ? `${import.meta.env.VITE_WS_URL}?roomId=${roomId}&playerId=${state.playerId}`
    : '';

  // WebSocket接続
  const { isConnected, sendMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      // ゲーム開始メッセージを受信したらGamePlayページに遷移
      if (message.type === 'questionStart') {
        navigate(`/game/${roomId}`, {
          state: {
            roomId,
            playerId: state?.playerId,
          },
        });
      }
    },
  });

  useEffect(() => {
    if (!roomId || !state) {
      navigate('/');
      return;
    }

    const fetchRoom = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getRoom(roomId);

        if (result.success && result.data) {
          setRoom(result.data);
        } else {
          setError(result.error || ERROR_MESSAGES.FETCH_FAILED);
        }
      } catch (err) {
        setError(ERROR_MESSAGES.NETWORK_ERROR);
        console.error('Room fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoom();
  }, [roomId, state, navigate]);

  const handleStartGame = () => {
    if (!isConnected) {
      setError('WebSocketに接続されていません。再度お試しください。');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      // WebSocketでゲーム開始メッセージを送信
      sendMessage('startGame', {});
    } catch {
      setError('ゲーム開始に失敗しました');
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = () => {
    // TODO: ルーム退出処理を実装
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <p className="text-center text-gray-600">{UI_MESSAGES.LOADING}</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error || ERROR_MESSAGES.ROOM_NOT_FOUND}
          </div>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            {UI_MESSAGES.BACK_TO_TOP}
          </button>
        </div>
      </div>
    );
  }

  const isHost = state?.isHost || false;
  const currentPlayerId = state?.playerId || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {UI_MESSAGES.WAITING}
          </h1>
          <div className="text-center">
            <span className="text-sm text-gray-600">ルームID: </span>
            <span className="font-mono text-lg font-bold text-blue-600">
              {room.roomId}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            参加プレイヤー ({room.players.length}/{MAX_PLAYERS})
          </h2>
          <div className="space-y-2">
            {room.players.map((player, index) => (
              <div
                key={player.playerId}
                className={`p-4 rounded-lg border-2 ${
                  player.playerId === currentPlayerId
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {index === 0 ? '👑' : '👤'}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {player.name}
                      </p>
                      {player.playerId === room.hostId && (
                        <p className="text-xs text-gray-500">{UI_MESSAGES.HOST_LABEL}</p>
                      )}
                      {player.playerId === currentPlayerId && (
                        <p className="text-xs text-blue-600">{UI_MESSAGES.YOU_LABEL}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={room.players.length < MIN_PLAYERS_TO_START || isStarting || !isConnected}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
            >
              {isStarting
                ? '開始中...'
                : !isConnected
                ? '接続中...'
                : room.players.length < MIN_PLAYERS_TO_START
                ? UI_MESSAGES.GAME_START_DISABLED
                : UI_MESSAGES.GAME_START}
            </button>
          )}

          <button
            onClick={handleLeaveRoom}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
          >
            {UI_MESSAGES.LEAVE_ROOM}
          </button>
        </div>
      </div>
    </div>
  );
}
