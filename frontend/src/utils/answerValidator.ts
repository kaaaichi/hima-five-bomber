/**
 * テキスト正規化ユーティリティ
 */
export class TextNormalizer {
  /**
   * 文字列を正規化する（トリミング、全角→半角変換）
   */
  static normalize(text: string): string {
    return text
      .trim()
      .replace(/\u3000/g, ' ') // 全角スペースを半角に
      .replace(/[Ā-ž]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0)); // 全角英数字を半角に
  }

  /**
   * ひらがなをカタカナに変換
   */
  static toKatakana(text: string): string {
    return text.replace(/[\u3041-\u3096]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) + 0x60)
    );
  }

  /**
   * カタカナをひらがなに変換
   */
  static toHiragana(text: string): string {
    return text.replace(/[\u30a1-\u30f6]/g, (char) =>
      String.fromCharCode(char.charCodeAt(0) - 0x60)
    );
  }

  /**
   * 大文字小文字を無視して比較
   */
  static equalsIgnoreCase(a: string, b: string): boolean {
    return a.toLowerCase() === b.toLowerCase();
  }

  /**
   * ひらがな/カタカナを無視して比較
   */
  static equalsIgnoreKana(a: string, b: string): boolean {
    const normalizedA = this.toKatakana(a.toLowerCase());
    const normalizedB = this.toKatakana(b.toLowerCase());
    return normalizedA === normalizedB;
  }
}

interface ValidationResult {
  isCorrect: boolean;
  matchedAnswer?: string;
  normalizedInput: string;
  isDuplicate?: boolean;
}

/**
 * 回答の正誤判定を行うバリデーター
 */
export class AnswerValidator {
  /**
   * 回答を検証する
   * @param answer - ユーザーの回答
   * @param correctAnswers - 正解リスト
   * @param acceptableVariations - 許容表記
   * @param previousAnswers - 既に回答された回答のリスト（重複チェック用）
   */
  static validate(
    answer: string,
    correctAnswers: string[],
    acceptableVariations: Record<string, string[]>,
    previousAnswers: string[] = []
  ): ValidationResult {
    const normalizedInput = TextNormalizer.normalize(answer);

    // 空文字チェック
    if (!normalizedInput) {
      return { isCorrect: false, normalizedInput };
    }

    // 1. 正解リストとの完全一致判定（優先）
    let matchedAnswer: string | undefined;
    for (const correctAnswer of correctAnswers) {
      if (TextNormalizer.equalsIgnoreKana(normalizedInput, correctAnswer)) {
        matchedAnswer = correctAnswer;
        break;
      }
    }

    // 2. acceptableVariationsとの照合
    if (!matchedAnswer) {
      for (const [correctAnswer, variations] of Object.entries(acceptableVariations)) {
        for (const variation of variations) {
          if (TextNormalizer.equalsIgnoreKana(normalizedInput, variation)) {
            matchedAnswer = correctAnswer;
            break;
          }
        }
        if (matchedAnswer) break;
      }
    }

    // 3. 不正解の場合
    if (!matchedAnswer) {
      return { isCorrect: false, normalizedInput };
    }

    // 4. 重複チェック（正解の場合のみ）
    for (const prevAnswer of previousAnswers) {
      if (TextNormalizer.equalsIgnoreKana(matchedAnswer, prevAnswer)) {
        return {
          isCorrect: false,
          matchedAnswer,
          normalizedInput,
          isDuplicate: true,
        };
      }
    }

    // 5. 正解かつ重複なし
    return {
      isCorrect: true,
      matchedAnswer,
      normalizedInput,
      isDuplicate: false,
    };
  }
}
