/**
 * AnswerGrid Component
 * タスク6.4: 回答結果の反映（フロントエンド）
 *
 * 5つの回答枠を管理・表示するコンポーネント
 */

import React from 'react';
import { AnswerSlot } from './AnswerSlot';
import type { AnswerRecord } from '../../hooks/useGameState';

/**
 * AnswerGridコンポーネントのProps
 */
export interface AnswerGridProps {
  /**
   * 現在の回答順（0-4）
   */
  currentTurn: number;

  /**
   * 回答履歴
   */
  answers: AnswerRecord[];

  /**
   * 自分の回答枠のインデックス
   */
  mySlotIndex: number;
}

/**
 * AnswerGrid コンポーネント
 *
 * 5つの回答枠を表示し、現在の回答順、正誤結果、自分の回答枠を視覚的に示します。
 *
 * @param props - コンポーネントのProps
 * @returns JSX.Element
 */
export const AnswerGrid: React.FC<AnswerGridProps> = ({
  currentTurn,
  answers,
  mySlotIndex,
}) => {
  // 5つの回答枠を生成
  const slots = Array.from({ length: 5 }, (_, index) => {
    const isCurrent = currentTurn === index;
    const isMySlot = mySlotIndex === index;
    const answer = answers[index] || null;

    return (
      <AnswerSlot
        key={index}
        slotIndex={index}
        isCurrent={isCurrent}
        isMySlot={isMySlot}
        answer={answer}
      />
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {slots}
    </div>
  );
};
