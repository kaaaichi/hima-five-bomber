/**
 * AnswerValidator - 正誤判定サービス
 * タスク6.2: 正誤判定ロジック
 */

import { TextNormalizer } from '../utils/TextNormalizer';

/**
 * 許容表記の定義
 */
export interface AcceptableVariations {
  [correctAnswer: string]: string[];
}

/**
 * 検証結果
 */
export interface ValidationResult {
  isCorrect: boolean;
  matchedAnswer?: string;
  normalizedInput: string;
}

/**
 * AnswerValidator - 回答の正誤判定を行うサービス
 */
export class AnswerValidator {
  private readonly normalizer: TextNormalizer;

  constructor(normalizer?: TextNormalizer) {
    this.normalizer = normalizer || new TextNormalizer();
  }

  /**
   * 回答を検証する
   * @param answer ユーザーの回答
   * @param correctAnswers 正解リスト
   * @param acceptableVariations 許容表記
   * @returns 検証結果
   */
  validate(
    answer: string,
    correctAnswers: string[],
    acceptableVariations: AcceptableVariations
  ): ValidationResult {
    // 入力が空の場合は不正解
    if (!answer || answer.trim() === '') {
      return {
        isCorrect: false,
        normalizedInput: '',
      };
    }

    // 正解リストが空の場合は不正解
    if (correctAnswers.length === 0) {
      return {
        isCorrect: false,
        normalizedInput: this.normalizer.normalize(answer),
      };
    }

    // 回答を正規化
    const normalizedAnswer = this.normalizer.normalize(answer);

    // 1. 完全一致判定（優先）
    for (const correctAnswer of correctAnswers) {
      const normalizedCorrect = this.normalizer.normalize(correctAnswer);
      if (normalizedAnswer === normalizedCorrect) {
        return {
          isCorrect: true,
          matchedAnswer: correctAnswer,
          normalizedInput: normalizedAnswer,
        };
      }
    }

    // 2. acceptableVariations照合
    for (const correctAnswer of correctAnswers) {
      const variations = acceptableVariations[correctAnswer];
      if (variations && variations.length > 0) {
        for (const variation of variations) {
          const normalizedVariation = this.normalizer.normalize(variation);
          if (normalizedAnswer === normalizedVariation) {
            return {
              isCorrect: true,
              matchedAnswer: correctAnswer,
              normalizedInput: normalizedAnswer,
            };
          }
        }
      }
    }

    // 不正解
    return {
      isCorrect: false,
      normalizedInput: normalizedAnswer,
    };
  }
}
