import React, { useState, useEffect } from 'react';
import { GameBoard } from '../components/game/GameBoard';
import { useTimer } from '../hooks/useTimer';

/**
 * GamePlayDemoページコンポーネント
 *
 * バックエンドなしでゲーム画面の動作を確認するためのデモページ。
 * タイマー、回答入力、回答グリッドの動作を確認できます。
 */
export const GamePlayDemo: React.FC = () => {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [answers, setAnswers] = useState<Array<{ correct: boolean; score?: number }>>([]);

  const { timeRemaining, isRunning, start, stop, reset } = useTimer({
    onTimeUp: () => {
      alert('タイムアップ！');
      stop();
    },
  });

  const mockQuestion = {
    id: 'demo-question-1',
    questionText: 'デモ問題：日本の首都は？',
    category: '地理',
    difficulty: 'easy' as const,
  };

  const mockPlayers = [
    { playerId: 'demo-p1', name: 'あなた', joinedAt: Date.now() },
    { playerId: 'demo-p2', name: 'プレイヤー2', joinedAt: Date.now() },
    { playerId: 'demo-p3', name: 'プレイヤー3', joinedAt: Date.now() },
    { playerId: 'demo-p4', name: 'プレイヤー4', joinedAt: Date.now() },
    { playerId: 'demo-p5', name: 'プレイヤー5', joinedAt: Date.now() },
  ];

  const handleSubmitAnswer = (answer: string) => {
    // ランダムに正誤判定（デモ用）
    const correct = Math.random() > 0.3;
    const score = correct ? 10 + Math.floor(Math.random() * 20) : 0;

    const newAnswer = {
      correct,
      score,
    };

    setAnswers([...answers, newAnswer]);
    setCurrentTurn((prev) => (prev + 1) % 5);

    // 5人全員が回答したらゲーム終了
    if (answers.length >= 4) {
      setTimeout(() => {
        stop();
        alert('全員が回答しました！');
      }, 1000);
    }
  };

  const handleReset = () => {
    setAnswers([]);
    setCurrentTurn(0);
    reset();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* コントロールパネル */}
      <div className="bg-white shadow-md p-4 mb-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">ゲームプレイデモ</h1>
          <div className="flex gap-4">
            <button
              onClick={start}
              disabled={isRunning}
              className="px-6 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
            >
              タイマー開始
            </button>
            <button
              onClick={stop}
              disabled={!isRunning}
              className="px-6 py-2 bg-red-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
            >
              タイマー停止
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              リセット
            </button>
            <div className="flex-1" />
            <div className="text-sm text-gray-600">
              <div>タイマー状態: {isRunning ? '動作中' : '停止中'}</div>
              <div>現在の回答順: {currentTurn + 1}番目</div>
              <div>回答数: {answers.length} / 5</div>
            </div>
          </div>
        </div>
      </div>

      {/* ゲーム画面 */}
      <GameBoard
        gameState={{
          question: mockQuestion,
          timeRemaining,
          currentTurn,
          answers,
          players: mockPlayers,
        }}
        currentPlayerId="demo-p1"
        onSubmitAnswer={handleSubmitAnswer}
      />

      {/* 説明 */}
      <div className="max-w-4xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">デモの使い方</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>「タイマー開始」ボタンをクリックしてゲームを開始</li>
          <li>回答を入力して「送信」ボタンをクリック（デモでは自動で正誤判定されます）</li>
          <li>タイマーは1秒ごとにカウントダウンされます</li>
          <li>残り5秒以下になると警告表示（赤色）になります</li>
          <li>0秒になるとアラートが表示されます</li>
          <li>「リセット」ボタンで最初からやり直せます</li>
        </ol>
      </div>
    </div>
  );
};
