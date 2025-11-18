import React, { useState, FormEvent } from 'react';

export interface AnswerInputProps {
  /**
   * 回答送信時のコールバック
   */
  onSubmit: (answer: string) => void;

  /**
   * 入力の無効化フラグ（自分の回答順でない場合true）
   */
  isDisabled: boolean;

  /**
   * プレースホルダーテキスト
   */
  placeholder?: string;
}

/**
 * AnswerInputコンポーネント
 *
 * プレイヤーが回答を入力・送信するためのフォームコンポーネント。
 * 自分の回答順の時のみ有効化され、送信後は自動的に入力フィールドがクリアされます。
 *
 * @example
 * ```tsx
 * <AnswerInput
 *   onSubmit={(answer) => console.log(answer)}
 *   isDisabled={false}
 * />
 * ```
 */
export const AnswerInput: React.FC<AnswerInputProps> = ({
  onSubmit,
  isDisabled,
  placeholder = '回答を入力してください',
}) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // バリデーション: 空文字・空白のみの送信を防ぐ
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      return;
    }

    // 回答を送信
    onSubmit(trimmedAnswer);

    // 入力フィールドをクリア
    setAnswer('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={isDisabled}
          placeholder={placeholder}
          className={`
            flex-1 px-4 py-2 border rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed
            transition-colors
          `}
          aria-label="回答入力フィールド"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className={`
            px-6 py-2 rounded-lg font-bold
            transition-all duration-200
            ${
              isDisabled
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }
          `}
          aria-label="送信ボタン"
        >
          送信
        </button>
      </div>
    </form>
  );
};
