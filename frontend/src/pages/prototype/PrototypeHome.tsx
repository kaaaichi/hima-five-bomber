import { useNavigate } from 'react-router-dom';

export function PrototypeHome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            ファイブボンバー
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            ネプリーグの人気クイズゲームをWeb化！
          </p>
          <p className="text-gray-500">
            5人で協力して30秒以内に5つの正解を見つけよう
          </p>
        </div>

        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-800 mb-3">🎮 遊び方</h2>
          <ol className="space-y-2 text-gray-700">
            <li className="flex">
              <span className="font-bold mr-2">1.</span>
              <span>プレイヤー名を入力（最大5人）</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">2.</span>
              <span>順番に回答していく（1台の端末を回す）</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">3.</span>
              <span>正解したら次のプレイヤーへ</span>
            </li>
            <li className="flex">
              <span className="font-bold mr-2">4.</span>
              <span>30秒以内に5つの正解を目指せ！</span>
            </li>
          </ol>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-8">
          <h3 className="font-bold text-gray-800 mb-2">⚡ スコアシステム</h3>
          <ul className="text-gray-700 space-y-1">
            <li>・正解1つにつき <strong>10点</strong></li>
            <li>・残り時間1秒につき <strong>1点ボーナス</strong></li>
            <li>・最高得点は <strong>80点</strong>（5問正解 + 30秒残し）</li>
          </ul>
        </div>

        <button
          onClick={() => navigate('/prototype/setup')}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-xl py-4 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          ゲームスタート
        </button>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            オンライン対戦版はこちら（開発中）
          </a>
        </div>
      </div>
    </div>
  );
}
