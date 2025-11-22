import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Player {
  id: string;
  name: string;
}

export function PlayerSetup() {
  const navigate = useNavigate();
  const [playerNames, setPlayerNames] = useState<string[]>(['プレイヤー1', 'プレイヤー2', 'プレイヤー3', 'プレイヤー4', 'プレイヤー5']);

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

    // ゲーム画面に遷移
    navigate('/prototype/game');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          ファイブボンバー
        </h1>
        <p className="text-center text-gray-600 mb-8">
          プレイヤー名を入力してください（最大5人）
        </p>

        <div className="space-y-4 mb-8">
          {playerNames.map((name, index) => (
            <div key={index}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プレイヤー{index + 1}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handlePlayerNameChange(index, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={`プレイヤー${index + 1}`}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleStartGame}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:from-green-600 hover:to-blue-600 transition-all duration-200 transform hover:scale-105"
        >
          ゲーム開始
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          1台の端末を回しながらプレイします
        </p>
      </div>
    </div>
  );
}
