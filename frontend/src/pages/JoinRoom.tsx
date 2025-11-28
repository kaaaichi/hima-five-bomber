/**
 * JoinRoom Page - ルーム参加画面
 * ルームIDとプレイヤー名を入力してルームに参加
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinRoom } from '../services/api';

// 定数定義
const ROOM_ID_LENGTH = 6;
const PLAYER_NAME_MAX_LENGTH = 20;

const ERROR_MESSAGES = {
  ROOM_ID_REQUIRED: 'ルームIDを入力してください',
  ROOM_ID_INVALID_LENGTH: 'ルームIDは6文字です',
  PLAYER_NAME_REQUIRED: 'プレイヤー名を入力してください',
  PLAYER_NAME_TOO_LONG: 'プレイヤー名は20文字以内で入力してください',
  JOIN_FAILED: 'ルームへの参加に失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。もう一度お試しください。',
} as const;

/**
 * フォームバリデーション
 * @param roomId ルームID
 * @param playerName プレイヤー名
 * @returns エラーメッセージ（バリデーション成功時はnull）
 */
function validateForm(roomId: string, playerName: string): string | null {
  if (!roomId.trim()) {
    return ERROR_MESSAGES.ROOM_ID_REQUIRED;
  }

  if (roomId.length !== ROOM_ID_LENGTH) {
    return ERROR_MESSAGES.ROOM_ID_INVALID_LENGTH;
  }

  if (!playerName.trim()) {
    return ERROR_MESSAGES.PLAYER_NAME_REQUIRED;
  }

  if (playerName.length > PLAYER_NAME_MAX_LENGTH) {
    return ERROR_MESSAGES.PLAYER_NAME_TOO_LONG;
  }

  return null;
}

export function JoinRoom() {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    const validationError = validateForm(roomId, playerName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const normalizedRoomId = roomId.trim().toUpperCase();
      const result = await joinRoom(normalizedRoomId, playerName.trim());

      if (result.success && result.data) {
        // ルーム参加成功 - ルーム待機画面に遷移
        navigate(`/room/${normalizedRoomId}`, {
          state: {
            roomId: normalizedRoomId,
            playerId: result.data.playerId,
            isHost: false,
          },
        });
      } else {
        setError(result.error || ERROR_MESSAGES.JOIN_FAILED);
      }
    } catch (err) {
      setError(ERROR_MESSAGES.NETWORK_ERROR);
      console.error('Room join error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
        >
          ← 戻る
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ルーム参加
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="roomId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ルームID
            </label>
            <input
              id="roomId"
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder={`${ROOM_ID_LENGTH}文字のルームID`}
              maxLength={ROOM_ID_LENGTH}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed font-mono text-lg tracking-wider"
            />
            <p className="text-xs text-gray-500 mt-1">
              {roomId.length}/{ROOM_ID_LENGTH}文字
            </p>
          </div>

          <div>
            <label
              htmlFor="playerName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              プレイヤー名
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="あなたの名前を入力"
              maxLength={PLAYER_NAME_MAX_LENGTH}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {playerName.length}/{PLAYER_NAME_MAX_LENGTH}文字
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
          >
            {isLoading ? '参加中...' : 'ルームに参加'}
          </button>
        </form>
      </div>
    </div>
  );
}
