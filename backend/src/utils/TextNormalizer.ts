/**
 * TextNormalizer - 文字列正規化ユーティリティ
 * タスク6.1: 文字列正規化ユーティリティ
 */

/**
 * 文字列正規化クラス
 * 全角・半角変換、ひらがな・カタカナ変換、トリミング、空白正規化を提供
 */
export class TextNormalizer {
  /**
   * 文字列を正規化（トリミング、全角→半角、空白正規化、小文字変換）
   * @param text 入力文字列
   * @returns 正規化された文字列
   */
  normalize(text: string): string {
    // トリミング
    let normalized = text.trim();

    // 全角→半角変換
    normalized = this.toHalfWidth(normalized);

    // 複数の空白を1つに正規化
    normalized = normalized.replace(/\s+/g, ' ');

    // 小文字変換
    normalized = this.toLowerCase(normalized);

    return normalized;
  }

  /**
   * カタカナをひらがなに変換
   * @param text 入力文字列
   * @returns ひらがなに変換された文字列
   */
  toHiragana(text: string): string {
    return text.replace(/[\u30a1-\u30f6]/g, (match) => {
      const code = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(code);
    });
  }

  /**
   * ひらがなをカタカナに変換
   * @param text 入力文字列
   * @returns カタカナに変換された文字列
   */
  toKatakana(text: string): string {
    return text.replace(/[\u3041-\u3096]/g, (match) => {
      const code = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(code);
    });
  }

  /**
   * 全角英数字・記号を半角に変換
   * @param text 入力文字列
   * @returns 半角に変換された文字列
   */
  toHalfWidth(text: string): string {
    return text.replace(/[\uFF01-\uFF5E]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - 0xfee0);
    });
  }

  /**
   * 大文字を小文字に変換
   * @param text 入力文字列
   * @returns 小文字に変換された文字列
   */
  toLowerCase(text: string): string {
    return text.toLowerCase();
  }
}
