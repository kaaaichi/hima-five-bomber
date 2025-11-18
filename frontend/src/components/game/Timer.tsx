import React from 'react';
import { TIME_RULES } from '@five-bomber/shared';

export interface TimerProps {
  /**
   * 残り時間（秒）
   */
  timeRemaining: number;
}

/**
 * Timerコンポーネント
 *
 * ゲームの残り時間を表示し、残り5秒以下で視覚的な警告を表示します。
 *
 * @example
 * ```tsx
 * <Timer timeRemaining={30} />
 * <Timer timeRemaining={5} /> // 警告表示
 * ```
 */
export const Timer: React.FC<TimerProps> = ({ timeRemaining }) => {
  // 警告表示の閾値
  const isWarning = timeRemaining <= TIME_RULES.WARNING_THRESHOLD;
  const isCritical = timeRemaining <= 3;
  const isUrgent = timeRemaining === 0;

  // スタイルクラスの計算
  const getTimerClasses = () => {
    const baseClasses = 'font-bold transition-all duration-300';
    const sizeClasses = isUrgent
      ? 'text-6xl scale-125'
      : isCritical
        ? 'text-5xl scale-110'
        : isWarning
          ? 'text-4xl'
          : 'text-4xl';
    const colorClasses = isWarning ? 'text-red-600' : 'text-gray-800';

    return `${baseClasses} ${sizeClasses} ${colorClasses}`;
  };

  return (
    <div
      className="flex flex-col items-center justify-center p-4"
      data-testid="timer"
      aria-label={`残り時間: ${timeRemaining}秒`}
      aria-live={isWarning ? 'assertive' : 'polite'}
    >
      <div className="text-sm text-gray-600 mb-2">残り時間</div>
      <div className={getTimerClasses()} data-testid="timer-value">
        {timeRemaining}
      </div>
      <div className="text-sm text-gray-600 mt-1">秒</div>
    </div>
  );
};
