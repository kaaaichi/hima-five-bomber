/**
 * ComponentDemo Page
 * タスク6.4で実装したコンポーネントのビジュアル確認用ページ
 */

import React, { useState } from 'react';
import { AnswerFeedback } from '../components/game/AnswerFeedback';
import { AnswerSlot } from '../components/game/AnswerSlot';
import { AnswerGrid } from '../components/game/AnswerGrid';
import type { AnswerRecord } from '../hooks/useGameState';

export const ComponentDemo: React.FC = () => {
  const [currentTurn, setCurrentTurn] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const addCorrectAnswer = () => {
    setAnswers([...answers, { correct: true, score: 10 }]);
    setCurrentTurn(currentTurn + 1);
  };

  const addIncorrectAnswer = () => {
    setAnswers([...answers, { correct: false }]);
    setCurrentTurn(currentTurn + 1);
  };

  const resetAnswers = () => {
    setAnswers([]);
    setCurrentTurn(0);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">
          コンポーネントデモ - タスク6.4
        </h1>

        {/* AnswerFeedback Demo */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">AnswerFeedback</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">正解時</h3>
              <AnswerFeedback correct={true} score={10} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">不正解時</h3>
              <AnswerFeedback correct={false} />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">未回答時（null）</h3>
              <AnswerFeedback correct={null} />
              <p className="text-sm text-gray-500 mt-2">
                ↑ 何も表示されないはず
              </p>
            </div>
          </div>
        </section>

        {/* AnswerSlot Demo */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">AnswerSlot</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                通常の回答枠（1番目）
              </h3>
              <AnswerSlot
                slotIndex={0}
                isCurrent={false}
                isMySlot={false}
                answer={null}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                現在の回答順（2番目、青いリング）
              </h3>
              <AnswerSlot
                slotIndex={1}
                isCurrent={true}
                isMySlot={false}
                answer={null}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                自分の回答枠（3番目、黄色の背景）
              </h3>
              <AnswerSlot
                slotIndex={2}
                isCurrent={false}
                isMySlot={true}
                answer={null}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                正解済み（4番目）
              </h3>
              <AnswerSlot
                slotIndex={3}
                isCurrent={false}
                isMySlot={false}
                answer={{ correct: true, score: 10 }}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                不正解（5番目）
              </h3>
              <AnswerSlot
                slotIndex={4}
                isCurrent={false}
                isMySlot={false}
                answer={{ correct: false }}
              />
            </div>
          </div>
        </section>

        {/* AnswerGrid Demo */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">
            AnswerGrid（インタラクティブデモ）
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={addCorrectAnswer}
                disabled={answers.length >= 5}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
              >
                正解を追加
              </button>
              <button
                onClick={addIncorrectAnswer}
                disabled={answers.length >= 5}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300"
              >
                不正解を追加
              </button>
              <button
                onClick={resetAnswers}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                リセット
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <p>現在のターン: {currentTurn + 1}番目</p>
              <p>回答数: {answers.length}/5</p>
            </div>
            <AnswerGrid
              currentTurn={currentTurn}
              answers={answers}
              mySlotIndex={2}
            />
            <p className="text-sm text-gray-500">
              ※ 3番目の回答枠が「自分の枠」として黄色でハイライトされます
            </p>
          </div>
        </section>

        {/* レスポンシブ確認用 */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">
            レスポンシブデザイン確認
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            ブラウザの幅を変更してレスポンシブデザインを確認してください。
            <br />
            モバイル（767px以下）: 縦並び
            <br />
            タブレット以上（768px以上）: 横並び
          </p>
          <AnswerGrid
            currentTurn={1}
            answers={[
              { correct: true, score: 10 },
              { correct: false },
            ]}
            mySlotIndex={0}
          />
        </section>
      </div>
    </div>
  );
};
