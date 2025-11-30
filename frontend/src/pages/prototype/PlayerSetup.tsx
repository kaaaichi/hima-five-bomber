import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Player {
  id: string;
  name: string;
}

interface QuestionOption {
  id: string;
  question: string;
  category: string;
  difficulty: string;
}

// 難易度をLv.表記に変換
const getDifficultyLevel = (difficulty: string): string => {
  switch (difficulty) {
    case 'easy':
      return 'Lv.1';
    case 'medium':
      return 'Lv.2';
    case 'hard':
      return 'Lv.3';
    case 'mixed':
      return 'Lv.2';
    case 'bonus':
      return 'Lv.★';
    default:
      return 'Lv.?';
  }
};

// 問題の表示名を生成（Lv.<難易度> 問題<数字>: <カテゴリ>形式）
const getQuestionDisplayName = (q: QuestionOption): string => {
  const level = getDifficultyLevel(q.difficulty);
  if (q.id.startsWith('practice')) {
    return `${level} 練習問題: ${q.category}`;
  }
  if (q.id.startsWith('bonus')) {
    const match = q.id.match(/bonus-(\d+)/);
    const bonusNumber = match ? parseInt(match[1], 10) : 0;
    return `${level} ボーナス${bonusNumber}: ${q.category}`;
  }
  // IDから数字部分を抽出（例: q001 → 1, q010 → 10）
  const match = q.id.match(/q(\d+)/);
  const questionNumber = match ? parseInt(match[1], 10) : 0;
  return `${level} 問題${questionNumber}: ${q.category}`;
};

export function PlayerSetup() {
  const navigate = useNavigate();
  const [playerNames, setPlayerNames] = useState<string[]>(['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4', 'プレイヤー5']);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('practice-01');
  const [questions, setQuestions] = useState<QuestionOption[]>([]);

  // 問題データの読み込み
  useEffect(() => {
    fetch('/questions.json')
      .then((res) => res.json())
      .then((data: QuestionOption[]) => {
        setQuestions(data);
      })
      .catch((error) => {
        console.error('問題データの読み込みに失敗しました:', error);
      });
  }, []);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const handleStartGame = () => {
    // プレイヤーデータを作成（空でない名前のみ）
    const players: Player[] = playerNames
      .map((name, index) => ({
        id: `player-${index + 1}`,
        name: name.trim() || `プレイヤー${index + 1}`,
      }))
      .filter((_, index) => index < 5); // 最大5人

    // プレイヤーデータをlocalStorageに保存
    localStorage.setItem('prototype-players', JSON.stringify(players));

    // ゲーム画面に遷移（問題IDをパラメータとして渡す）
    navigate(`/prototype/game?questionId=${selectedQuestionId}`);
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="card bg-base-100 shadow-lg w-full max-w-sm sm:max-w-md border border-base-300">
        <div className="card-body p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-base-content">
            ファイブボンバー
          </h1>
          <p className="text-center text-base-content/60 mb-6 text-sm sm:text-base">
            プレイヤー名を入力してください（最大5人）
          </p>

          {/* 問題選択 */}
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-medium">出題する問題を選択</span>
            </label>
            <select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              className="select select-bordered w-full"
            >
              {questions.map((q) => (
                <option key={q.id} value={q.id}>
                  {getQuestionDisplayName(q)}
                </option>
              ))}
            </select>
          </div>

          {/* プレイヤー入力 */}
          <div className="space-y-3 mb-6">
            {playerNames.map((name, index) => (
              <div key={index} className="form-control">
                <label className="label py-1">
                  <span className="label-text text-sm">プレイヤー{index + 1}</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full"
                  placeholder={`プレイヤー${index + 1}`}
                />
              </div>
            ))}
          </div>

          {/* 開始ボタン */}
          <button
            onClick={handleStartGame}
            className="btn btn-primary w-full"
          >
            ゲーム開始
          </button>

          <p className="text-center text-xs sm:text-sm text-base-content/50 mt-4">
            1台の端末を回しながらプレイします
          </p>
        </div>
      </div>
    </div>
  );
}
