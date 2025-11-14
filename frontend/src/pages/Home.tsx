/**
 * Home Page - トップ画面
 * ルーム作成・参加の選択画面
 */

import { useNavigate } from 'react-router-dom';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          ファイブボンバー
        </h1>

        <div className="space-y-4">
          <button
            onClick={() => navigate('/create')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg"
          >
            ルームを作成
          </button>

          <button
            onClick={() => navigate('/join')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg"
          >
            ルームに参加
          </button>
        </div>

        <p className="text-center text-gray-600 mt-8 text-sm">
          5人でクイズに挑戦！
        </p>
      </div>
    </div>
  );
}
