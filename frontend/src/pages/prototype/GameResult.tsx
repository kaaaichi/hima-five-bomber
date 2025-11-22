import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScoreCalculator } from '../../utils/scoreCalculator';

interface ResultData {
  gameStatus: 'completed' | 'timeout';
  correctCount: number;
  timeRemaining: number;
  totalScore: number;
}

export function GameResult() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ResultData | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    const savedResult = localStorage.getItem('prototype-result');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
      // アニメーション開始
      setTimeout(() => setShowAnimation(true), 100);
    } else {
      // 結果データがない場合はセットアップ画面に戻る
      navigate('/prototype/setup');
    }
  }, [navigate]);

  const handleRetry = () => {
    navigate('/prototype/game');
  };

  const handleNewPlayers = () => {
    localStorage.removeItem('prototype-players');
    localStorage.removeItem('prototype-result');
    navigate('/prototype/setup');
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">読み込み中...</div>
      </div>
    );
  }

  const isSuccess = result.gameStatus === 'completed';
  const answerScore = result.correctCount * ScoreCalculator.calculateAnswerScore();
  const timeBonus = ScoreCalculator.calculateTimeBonus(result.timeRemaining);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className={`bg-white rounded-lg shadow-xl p-8 max-w-md w-full transition-all duration-500 ${
        showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}>
        {/* 結果タイトル */}
        <div className="text-center mb-8">
          {isSuccess ? (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-4xl font-bold text-green-600 mb-2">クリア！</h1>
              <p className="text-gray-600">おめでとうございます！</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">💥</div>
              <h1 className="text-4xl font-bold text-red-600 mb-2">タイムアップ</h1>
              <p className="text-gray-600">もう少しでした！</p>
            </>
          )}
        </div>

        {/* スコア詳細 */}
        <div className="space-y-4 mb-8">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">正解数</span>
              <span className="text-2xl font-bold text-gray-800">{result.correctCount} / 5</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">正解スコア</span>
              <span className="text-xl font-semibold text-blue-600">{answerScore}点</span>
            </div>
            {isSuccess && (
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">時間ボーナス</span>
                <span className="text-xl font-semibold text-green-600">+{timeBonus}点</span>
              </div>
            )}
            <div className="border-t border-gray-300 mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">総合スコア</span>
                <span className="text-3xl font-bold text-purple-600">{result.totalScore}点</span>
              </div>
            </div>
          </div>

          {/* スコア内訳の説明 */}
          <div className="text-sm text-gray-600 bg-blue-50 rounded-lg p-3">
            <p className="mb-1">💡 スコア計算方法:</p>
            <p>・正解1つにつき 10点</p>
            <p>・残り時間1秒につき 1点</p>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
          >
            もう一度プレイ
          </button>
          <button
            onClick={handleNewPlayers}
            className="w-full bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition-all duration-200"
          >
            プレイヤーを変更
          </button>
        </div>
      </div>
    </div>
  );
}
