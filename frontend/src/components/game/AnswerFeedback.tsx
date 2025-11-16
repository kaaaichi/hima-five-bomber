/**
 * AnswerFeedback Component
 * タスク6.4: 回答結果の反映（フロントエンド）
 *
 * 正解・不正解のフィードバックを表示するコンポーネント
 */

import React from 'react';

/**
 * AnswerFeedbackコンポーネントのProps
 */
export interface AnswerFeedbackProps {
  /**
   * 正解かどうか（nullの場合は未回答）
   */
  correct: boolean | null;

  /**
   * スコア（正解時のみ）
   */
  score?: number;
}

/**
 * AnswerFeedback コンポーネント
 *
 * 回答結果（正解・不正解）に応じたフィードバックを表示します。
 *
 * @param props - コンポーネントのProps
 * @returns JSX.Element
 */
export const AnswerFeedback: React.FC<AnswerFeedbackProps> = ({ correct, score }) => {
  // 未回答の場合は何も表示しない
  if (correct === null) {
    return null;
  }

  // 正解の場合
  if (correct) {
    return (
      <div className="animate-pulse flex items-center gap-2">
        <span className="text-green-500 text-2xl font-bold">✓</span>
        {score !== undefined && (
          <span className="text-green-600 font-semibold">+{score}点</span>
        )}
      </div>
    );
  }

  // 不正解の場合
  return (
    <div className="animate-pulse flex items-center gap-2">
      <span className="text-red-500 text-2xl font-bold">✗</span>
      <span className="text-red-600 font-semibold">不正解</span>
    </div>
  );
};
