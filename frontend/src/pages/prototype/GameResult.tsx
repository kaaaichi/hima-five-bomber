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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const isSuccess = result.gameStatus === 'completed';
  const answerScore = result.correctCount * ScoreCalculator.calculateAnswerScore();
  const timeBonus = ScoreCalculator.calculateTimeBonus(result.timeRemaining);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className={`card bg-base-100 shadow-lg border border-base-300 w-full max-w-sm sm:max-w-md transition-all duration-500 ${
        showAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="card-body p-6 sm:p-8">
          {/* 結果タイトル */}
          <div className="text-center mb-6">
            {isSuccess ? (
              <>
                <div className="text-5xl sm:text-6xl mb-3">🎉</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-success mb-1">クリア！</h1>
                <p className="text-base-content/60 text-sm">おめでとうございます！</p>
              </>
            ) : (
              <>
                <div className="text-5xl sm:text-6xl mb-3">⏱️</div>
                <h1 className="text-2xl sm:text-3xl font-bold text-error mb-1">タイムアップ</h1>
                <p className="text-base-content/60 text-sm">もう少しでした！</p>
              </>
            )}
          </div>

          {/* スコア詳細 */}
          <div className="space-y-3 mb-6">
            <div className="bg-base-200 rounded-lg p-4">
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/70 text-sm">正解数</span>
                <span className="text-xl font-bold text-base-content">{result.correctCount} / 5</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-base-300">
                <span className="text-base-content/70 text-sm">正解スコア</span>
                <span className="text-lg font-semibold text-base-content">{answerScore}点</span>
              </div>
              {isSuccess && (
                <div className="flex justify-between items-center py-2 border-b border-base-300">
                  <span className="text-base-content/70 text-sm">時間ボーナス</span>
                  <span className="text-lg font-semibold text-success">+{timeBonus}点</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3">
                <span className="text-base-content font-semibold">総合スコア</span>
                <span className="text-2xl font-bold text-primary">{result.totalScore}点</span>
              </div>
            </div>

            {/* スコア内訳の説明 */}
            <div className="text-xs text-base-content/50 bg-base-200 rounded-lg p-3">
              <p>スコア計算: 正解1つ = 10点 / 残り1秒 = 1点</p>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="space-y-2">
            <button
              onClick={handleRetry}
              className="btn btn-primary w-full"
            >
              もう一度プレイ
            </button>
            <button
              onClick={handleNewPlayers}
              className="btn btn-ghost w-full"
            >
              プレイヤーを変更
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
