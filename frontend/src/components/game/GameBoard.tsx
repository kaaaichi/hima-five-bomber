import React from 'react';
import { Timer } from './Timer';
import { AnswerInput } from './AnswerInput';
import { AnswerGrid } from './AnswerGrid';
import type { AnswerRecord } from '../../hooks/useGameState';

interface Question {
  id: string;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Player {
  playerId: string;
  name: string;
  joinedAt: number;
}

export interface GameState {
  question: Question | null;
  timeRemaining: number;
  currentTurn: number;
  answers: AnswerRecord[];
  players: Player[];
}

export interface GameBoardProps {
  /**
   * ゲームの状態
   */
  gameState: GameState;

  /**
   * 現在のプレイヤーID
   */
  currentPlayerId: string;

  /**
   * 回答送信時のコールバック
   */
  onSubmitAnswer: (answer: string) => void;
}

/**
 * GameBoardコンポーネント
 *
 * ゲームプレイ画面全体を統合するコンポーネント。
 * 問題文、タイマー、回答入力フォーム、回答グリッドを表示します。
 *
 * @example
 * ```tsx
 * <GameBoard
 *   gameState={gameState}
 *   currentPlayerId="player-123"
 *   onSubmitAnswer={(answer) => console.log(answer)}
 * />
 * ```
 */
export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  currentPlayerId,
  onSubmitAnswer,
}) => {
  const { question, timeRemaining, currentTurn, answers, players } = gameState;

  // 問題未ロード時
  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">問題を読み込み中...</div>
      </div>
    );
  }

  // 現在の回答順のプレイヤーを取得
  const currentPlayer = players[currentTurn % players.length];

  // 自分の回答順かどうか
  const isMyTurn = currentPlayer?.playerId === currentPlayerId;

  // 自分の回答枠のインデックスを取得
  const mySlotIndex = players.findIndex((p) => p.playerId === currentPlayerId);

  return (
    <div
      className="min-h-screen bg-gray-50 p-4 md:p-8"
      data-testid="game-board"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* タイマー */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <Timer timeRemaining={timeRemaining} />
        </div>

        {/* 問題文 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-500 mb-2">
            {question.category} / {question.difficulty}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {question.questionText}
          </h2>
        </div>

        {/* 回答グリッド */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <AnswerGrid
            answers={answers}
            currentTurn={currentTurn}
            mySlotIndex={mySlotIndex}
          />
        </div>

        {/* 回答入力フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4">
            {isMyTurn ? (
              <div className="text-lg font-bold text-blue-600">
                あなたの回答順です
              </div>
            ) : (
              <div className="text-lg text-gray-600">
                {currentPlayer?.name || '不明'}さんの回答順です
              </div>
            )}
          </div>
          <AnswerInput onSubmit={onSubmitAnswer} isDisabled={!isMyTurn} />
        </div>
      </div>
    </div>
  );
};
