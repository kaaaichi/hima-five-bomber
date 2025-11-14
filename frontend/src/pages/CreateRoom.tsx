/**
 * CreateRoom Page - ルーム作成画面
 * ホスト名を入力してルームを作成
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom } from '../services/api';

export function CreateRoom() {
  const navigate = useNavigate();
  const [hostName, setHostName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!hostName.trim()) {
      setError('ホスト名を入力してください');
      return;
    }

    if (hostName.length > 20) {
      setError('ホスト名は20文字以内で入力してください');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createRoom(hostName.trim());

      if (result.success && result.data) {
        // ルーム作成成功 - ルーム待機画面に遷移
        navigate(`/room/${result.data.roomId}`, {
          state: {
            roomId: result.data.roomId,
            playerId: result.data.hostId,
            isHost: true,
          },
        });
      } else {
        setError(result.error || 'ルームの作成に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました。もう一度お試しください。');
      console.error('Room creation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={() => navigate('/')}
          className="text-gray-600 hover:text-gray-800 mb-4 flex items-center"
        >
          ← 戻る
        </button>

        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          ルーム作成
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="hostName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              ホスト名
            </label>
            <input
              id="hostName"
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="あなたの名前を入力"
              maxLength={20}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              {hostName.length}/20文字
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
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 disabled:transform-none shadow-lg disabled:cursor-not-allowed"
          >
            {isLoading ? '作成中...' : 'ルームを作成'}
          </button>
        </form>
      </div>
    </div>
  );
}
