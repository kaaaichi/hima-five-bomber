/**
 * Constants test
 * ゲームルール定数の妥当性を検証するテスト
 */

import {
  GAME_RULES,
  SCORING_RULES,
  TIME_RULES,
  PLAYER_RULES,
  QUESTION_RULES,
} from './constants';

describe('Game Constants', () => {
  describe('GAME_RULES', () => {
    it('should define TIME_LIMIT as 30 seconds', () => {
      expect(GAME_RULES.TIME_LIMIT).toBe(30);
    });

    it('should define REQUIRED_ANSWERS as 5', () => {
      expect(GAME_RULES.REQUIRED_ANSWERS).toBe(5);
    });

    it('should define QUESTIONS_PER_GAME as 4', () => {
      expect(GAME_RULES.QUESTIONS_PER_GAME).toBe(4);
    });
  });

  describe('SCORING_RULES', () => {
    it('should define SCORE_PER_ANSWER as 10 points', () => {
      expect(SCORING_RULES.SCORE_PER_ANSWER).toBe(10);
    });

    it('should define SCORE_PER_SECOND as 1 point', () => {
      expect(SCORING_RULES.SCORE_PER_SECOND).toBe(1);
    });

    it('should calculate correct total score for 5 answers with 10 seconds remaining', () => {
      const correctAnswers = 5;
      const timeRemaining = 10;
      const totalScore =
        correctAnswers * SCORING_RULES.SCORE_PER_ANSWER +
        timeRemaining * SCORING_RULES.SCORE_PER_SECOND;

      expect(totalScore).toBe(60); // 50 + 10
    });
  });

  describe('TIME_RULES', () => {
    it('should define WARNING_THRESHOLD as 5 seconds', () => {
      expect(TIME_RULES.WARNING_THRESHOLD).toBe(5);
    });

    it('should define JUDGMENT_RESPONSE_TIME_MIN as 50ms', () => {
      expect(TIME_RULES.JUDGMENT_RESPONSE_TIME_MIN).toBe(50);
    });

    it('should define JUDGMENT_RESPONSE_TIME_MAX as 100ms', () => {
      expect(TIME_RULES.JUDGMENT_RESPONSE_TIME_MAX).toBe(100);
    });

    it('should define RANKING_BROADCAST_TIME as 200ms', () => {
      expect(TIME_RULES.RANKING_BROADCAST_TIME).toBe(200);
    });
  });

  describe('PLAYER_RULES', () => {
    it('should define MAX_PLAYERS as 5', () => {
      expect(PLAYER_RULES.MAX_PLAYERS).toBe(5);
    });

    it('should define MIN_PLAYERS as 1', () => {
      expect(PLAYER_RULES.MIN_PLAYERS).toBe(1);
    });
  });

  describe('QUESTION_RULES', () => {
    it('should define MIN_ANSWERS as 5', () => {
      expect(QUESTION_RULES.MIN_ANSWERS).toBe(5);
    });

    it('should define valid difficulty levels', () => {
      expect(QUESTION_RULES.DIFFICULTY_LEVELS).toEqual(['easy', 'medium', 'hard']);
      expect(QUESTION_RULES.DIFFICULTY_LEVELS).toHaveLength(3);
    });
  });

  describe('Consistency checks', () => {
    it('should have consistent REQUIRED_ANSWERS and MAX_PLAYERS', () => {
      expect(GAME_RULES.REQUIRED_ANSWERS).toBe(PLAYER_RULES.MAX_PLAYERS);
    });

    it('should have consistent REQUIRED_ANSWERS and MIN_ANSWERS', () => {
      expect(GAME_RULES.REQUIRED_ANSWERS).toBe(QUESTION_RULES.MIN_ANSWERS);
    });

    it('should have WARNING_THRESHOLD less than TIME_LIMIT', () => {
      expect(TIME_RULES.WARNING_THRESHOLD).toBeLessThan(GAME_RULES.TIME_LIMIT);
    });
  });
});
