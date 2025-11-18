/**
 * AnswerSlot Component
 * タスク6.4: 回答結果の反映（フロントエンド）
 *
 * 5つの回答枠のうち1つを表示するコンポーネント
 */

import React from 'react';
import { AnswerFeedback } from './AnswerFeedback';
import type { AnswerRecord } from '../../hooks/useGameState';

/**
 * AnswerSlotコンポーネントのProps
 */
export interface AnswerSlotProps {
  /**
   * 回答枠のインデックス（0-4）
   */
  slotIndex: number;

  /**
   * 現在の回答順かどうか
   */
  isCurrent: boolean;

  /**
   * 自分の回答枠かどうか
   */
  isMySlot: boolean;

  /**
   * 回答記録（未回答の場合はnull）
   */
  answer: AnswerRecord | null;
}

/**
 * AnswerSlot コンポーネント
 *
 * 回答枠を表示し、現在の回答順や正誤結果を視覚的に示します。
 *
 * @param props - コンポーネントのProps
 * @returns JSX.Element
 */
export const AnswerSlot: React.FC<AnswerSlotProps> = ({
  slotIndex,
  isCurrent,
  isMySlot,
  answer,
}) => {
  // 基本クラス
  const baseClasses = 'p-4 rounded-lg border-2 transition-all';

  // 自分の回答枠の場合
  const mySlotClasses = isMySlot
    ? 'bg-yellow-50 border-yellow-400'
    : 'bg-white border-gray-300';

  // 現在の回答順の場合
  const currentClasses = isCurrent ? 'ring-2 ring-blue-500' : '';

  return (
    <div
      className={`${baseClasses} ${mySlotClasses} ${currentClasses}`}
      data-testid={`answer-slot-${slotIndex}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">
          {slotIndex + 1}番目
        </span>
        {answer && (
          <AnswerFeedback correct={answer.correct} score={answer.score} />
        )}
      </div>
    </div>
  );
};
