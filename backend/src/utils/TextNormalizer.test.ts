/**
 * TextNormalizer - 文字列正規化ユーティリティのテスト
 * タスク6.1: 文字列正規化ユーティリティ
 */

import { TextNormalizer } from './TextNormalizer';

describe('TextNormalizer', () => {
  let normalizer: TextNormalizer;

  beforeEach(() => {
    normalizer = new TextNormalizer();
  });

  describe('normalize', () => {
    /**
     * Acceptance Criteria:
     * Given 入力文字列が"Tokyo"（全角）である
     * When normalize関数を実行する
     * Then "tokyo"（半角・小文字）に変換される
     */
    it('should convert full-width to half-width', () => {
      // Arrange
      const input = 'Tokyo'; // 全角

      // Act
      const result = normalizer.normalize(input);

      // Assert
      expect(result).toBe('tokyo'); // 半角・小文字
    });

    it('should trim whitespace', () => {
      // Arrange
      const input = '  東京  ';

      // Act
      const result = normalizer.normalize(input);

      // Assert
      expect(result).toBe('東京');
    });

    it('should normalize multiple spaces to single space', () => {
      // Arrange
      const input = '東京   都';

      // Act
      const result = normalizer.normalize(input);

      // Assert
      expect(result).toBe('東京 都');
    });

    it('should convert full-width numbers to half-width', () => {
      // Arrange
      const input = '12345'; // 全角

      // Act
      const result = normalizer.normalize(input);

      // Assert
      expect(result).toBe('12345'); // 半角
    });

    it('should handle empty string', () => {
      // Arrange
      const input = '';

      // Act
      const result = normalizer.normalize(input);

      // Assert
      expect(result).toBe('');
    });
  });

  describe('toHiragana', () => {
    /**
     * Acceptance Criteria:
     * カタカナをひらがなに変換
     */
    it('should convert katakana to hiragana', () => {
      // Arrange
      const input = 'トウキョウ';

      // Act
      const result = normalizer.toHiragana(input);

      // Assert
      expect(result).toBe('とうきょう');
    });

    it('should preserve non-katakana characters', () => {
      // Arrange
      const input = 'Tokyo トウキョウ 東京';

      // Act
      const result = normalizer.toHiragana(input);

      // Assert
      expect(result).toBe('Tokyo とうきょう 東京');
    });
  });

  describe('toKatakana', () => {
    /**
     * Acceptance Criteria:
     * Given 入力文字列が"とうきょう"である
     * When toKatakana関数を実行する
     * Then "トウキョウ"に変換される
     */
    it('should convert hiragana to katakana', () => {
      // Arrange
      const input = 'とうきょう';

      // Act
      const result = normalizer.toKatakana(input);

      // Assert
      expect(result).toBe('トウキョウ');
    });

    it('should preserve non-hiragana characters', () => {
      // Arrange
      const input = 'Tokyo とうきょう 東京';

      // Act
      const result = normalizer.toKatakana(input);

      // Assert
      expect(result).toBe('Tokyo トウキョウ 東京');
    });
  });

  describe('toHalfWidth', () => {
    it('should convert full-width alphanumeric to half-width', () => {
      // Arrange
      const input = 'TOKYO123';

      // Act
      const result = normalizer.toHalfWidth(input);

      // Assert
      expect(result).toBe('TOKYO123');
    });

    it('should convert full-width symbols to half-width', () => {
      // Arrange
      const input = '()';

      // Act
      const result = normalizer.toHalfWidth(input);

      // Assert
      expect(result).toBe('()');
    });
  });

  describe('toLowerCase', () => {
    it('should convert uppercase to lowercase', () => {
      // Arrange
      const input = 'TOKYO';

      // Act
      const result = normalizer.toLowerCase(input);

      // Assert
      expect(result).toBe('tokyo');
    });

    it('should preserve non-alphabetic characters', () => {
      // Arrange
      const input = 'TOKYO 123 東京';

      // Act
      const result = normalizer.toLowerCase(input);

      // Assert
      expect(result).toBe('tokyo 123 東京');
    });
  });
});
