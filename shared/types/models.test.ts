/**
 * Type definitions test
 * TypeScriptの型定義の妥当性を検証するテスト
 */

import type {
  Player,
  Room,
  GameSession,
  AnswerRecord,
  Question,
  AcceptableVariations,
  GameResult,
  RankingEntry,
} from './models';

describe('Type Definitions', () => {
  describe('Player', () => {
    it('should have required fields', () => {
      const player: Player = {
        playerId: 'player-1',
        name: 'Test Player',
        joinedAt: Date.now(),
      };

      expect(player.playerId).toBeDefined();
      expect(player.name).toBeDefined();
      expect(player.joinedAt).toBeDefined();
    });
  });

  describe('Room', () => {
    it('should have required fields with correct types', () => {
      const room: Room = {
        roomId: 'room-1',
        hostId: 'player-1',
        players: [],
        status: 'waiting',
        createdAt: Date.now(),
      };

      expect(room.roomId).toBeDefined();
      expect(room.hostId).toBeDefined();
      expect(Array.isArray(room.players)).toBe(true);
      expect(['waiting', 'playing', 'finished']).toContain(room.status);
    });

    it('should accept valid status values', () => {
      const waitingRoom: Room = {
        roomId: 'room-1',
        hostId: 'player-1',
        players: [],
        status: 'waiting',
        createdAt: Date.now(),
      };

      const playingRoom: Room = { ...waitingRoom, status: 'playing' };
      const finishedRoom: Room = { ...waitingRoom, status: 'finished' };

      expect(waitingRoom.status).toBe('waiting');
      expect(playingRoom.status).toBe('playing');
      expect(finishedRoom.status).toBe('finished');
    });
  });

  describe('GameSession', () => {
    it('should have required fields', () => {
      const session: GameSession = {
        sessionId: 'session-1',
        roomId: 'room-1',
        questionId: 'question-1',
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      };

      expect(session.sessionId).toBeDefined();
      expect(session.roomId).toBeDefined();
      expect(session.questionId).toBeDefined();
      expect(session.currentTurn).toBeGreaterThanOrEqual(0);
      expect(session.currentTurn).toBeLessThanOrEqual(4);
    });

    it('should accept valid status values', () => {
      const baseSession: GameSession = {
        sessionId: 'session-1',
        roomId: 'room-1',
        questionId: 'question-1',
        startedAt: Date.now(),
        currentTurn: 0,
        answers: [],
        status: 'playing',
      };

      const completedSession: GameSession = { ...baseSession, status: 'completed' };
      const timeoutSession: GameSession = { ...baseSession, status: 'timeout' };

      expect(completedSession.status).toBe('completed');
      expect(timeoutSession.status).toBe('timeout');
    });
  });

  describe('AnswerRecord', () => {
    it('should have required fields', () => {
      const answer: AnswerRecord = {
        playerId: 'player-1',
        answer: '東京',
        isCorrect: true,
        timestamp: Date.now(),
      };

      expect(answer.playerId).toBeDefined();
      expect(answer.answer).toBeDefined();
      expect(typeof answer.isCorrect).toBe('boolean');
      expect(answer.timestamp).toBeDefined();
    });
  });

  describe('Question', () => {
    it('should have required fields', () => {
      const question: Question = {
        id: 'question-1',
        question: '日本の首都は?',
        answers: ['東京', 'Tokyo', 'とうきょう', 'トウキョウ', '江戸'],
        acceptableVariations: {
          '東京': ['とうきょう', 'トウキョウ', 'Tokyo'],
        },
        category: 'geography',
        difficulty: 'easy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      expect(question.id).toBeDefined();
      expect(question.question).toBeDefined();
      expect(Array.isArray(question.answers)).toBe(true);
      expect(question.answers.length).toBeGreaterThanOrEqual(5);
      expect(typeof question.acceptableVariations).toBe('object');
    });

    it('should accept valid difficulty values', () => {
      const easyQuestion: Question = {
        id: 'q-1',
        question: 'test',
        answers: ['a', 'b', 'c', 'd', 'e'],
        acceptableVariations: {},
        category: 'test',
        difficulty: 'easy',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mediumQuestion: Question = { ...easyQuestion, difficulty: 'medium' };
      const hardQuestion: Question = { ...easyQuestion, difficulty: 'hard' };

      expect(easyQuestion.difficulty).toBe('easy');
      expect(mediumQuestion.difficulty).toBe('medium');
      expect(hardQuestion.difficulty).toBe('hard');
    });
  });

  describe('GameResult', () => {
    it('should have required fields', () => {
      const result: GameResult = {
        success: true,
        totalScore: 60,
        correctAnswers: 5,
        timeBonus: 10,
      };

      expect(typeof result.success).toBe('boolean');
      expect(result.totalScore).toBeDefined();
      expect(result.correctAnswers).toBeDefined();
      expect(result.timeBonus).toBeDefined();
    });
  });

  describe('RankingEntry', () => {
    it('should have required fields', () => {
      const entry: RankingEntry = {
        roomId: 'room-1',
        teamName: 'Team A',
        score: 120,
        rank: 1,
      };

      expect(entry.roomId).toBeDefined();
      expect(entry.teamName).toBeDefined();
      expect(entry.score).toBeGreaterThanOrEqual(0);
      expect(entry.rank).toBeGreaterThan(0);
    });
  });
});
