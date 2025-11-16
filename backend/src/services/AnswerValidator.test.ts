/**
 * AnswerValidator - 正誤判定サービスのテスト
 * タスク6.2: 正誤判定ロジック
 */

import { AnswerValidator } from './AnswerValidator';

describe('AnswerValidator', () => {
  let validator: AnswerValidator;

  beforeEach(() => {
    validator = new AnswerValidator();
  });

  describe('validate', () => {
    /**
     * Acceptance Criteria:
     * Given 正解が["東京", "Tokyo"]である
     * When プレイヤーが"とうきょう"と回答する
     * Then 正規化処理が実行される
     * And acceptableVariationsと照合される
     * And 正解と判定される
     */
    it('should accept hiragana variant of correct answer', () => {
      // Arrange
      const answer = 'とうきょう';
      const correctAnswers = ['東京', 'Tokyo'];
      const acceptableVariations = {
        '東京': ['とうきょう', 'トウキョウ'],
        'Tokyo': ['tokyo', 'TOKYO'],
      };

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAnswer).toBe('東京');
    });

    /**
     * Acceptance Criteria:
     * Given 正解が"富士山"である
     * When プレイヤーが"エベレスト"と回答する
     * Then 不正解と判定される
     */
    it('should reject incorrect answer', () => {
      // Arrange
      const answer = 'エベレスト';
      const correctAnswers = ['富士山'];
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(false);
      expect(result.matchedAnswer).toBeUndefined();
    });

    it('should match exact answer (perfect match)', () => {
      // Arrange
      const answer = '東京';
      const correctAnswers = ['東京', '京都'];
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAnswer).toBe('東京');
    });

    it('should trim and normalize whitespace', () => {
      // Arrange
      const answer = '  東京  ';
      const correctAnswers = ['東京'];
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedInput).toBe('東京');
    });

    it('should convert full-width to half-width before matching', () => {
      // Arrange
      const answer = 'Tokyo'; // 全角
      const correctAnswers = ['Tokyo']; // 半角
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.normalizedInput).toBe('Tokyo');
    });

    it('should match acceptable variation (katakana)', () => {
      // Arrange
      const answer = 'トウキョウ';
      const correctAnswers = ['東京'];
      const acceptableVariations = {
        '東京': ['とうきょう', 'トウキョウ'],
      };

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAnswer).toBe('東京');
    });

    it('should match case-insensitive (English)', () => {
      // Arrange
      const answer = 'TOKYO';
      const correctAnswers = ['Tokyo'];
      const acceptableVariations = {
        'Tokyo': ['tokyo', 'TOKYO'],
      };

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAnswer).toBe('Tokyo');
    });

    it('should handle empty input', () => {
      // Arrange
      const answer = '';
      const correctAnswers = ['東京'];
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(false);
    });

    it('should handle empty correct answers list', () => {
      // Arrange
      const answer = '東京';
      const correctAnswers: string[] = [];
      const acceptableVariations = {};

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(false);
    });

    it('should prioritize exact match over acceptable variation', () => {
      // Arrange
      const answer = '東京';
      const correctAnswers = ['東京', '京都'];
      const acceptableVariations = {
        '京都': ['東京'], // 東京を京都の許容表記と定義しても、完全一致が優先される
      };

      // Act
      const result = validator.validate(answer, correctAnswers, acceptableVariations);

      // Assert
      expect(result.isCorrect).toBe(true);
      expect(result.matchedAnswer).toBe('東京'); // 完全一致が優先
    });
  });
});
