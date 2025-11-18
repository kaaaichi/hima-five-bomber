import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GamePlay } from './GamePlay';

// モック
vi.mock('../hooks/useGameWithTimer', () => ({
  useGameWithTimer: vi.fn(),
}));

vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(),
}));

import { useGameWithTimer } from '../hooks/useGameWithTimer';
import { useWebSocket } from '../hooks/useWebSocket';

type MockedFunction = ReturnType<typeof vi.fn>;

describe('GamePlay', () => {
  const mockSendMessage = vi.fn();
  const mockHandleMessage = vi.fn();
  const mockReset = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック実装
    (useWebSocket as MockedFunction).mockReturnValue({
      isConnected: true,
      sendMessage: mockSendMessage,
    });

    (useGameWithTimer as MockedFunction).mockReturnValue({
      gameState: {
        question: {
          questionText: 'テスト問題：日本の首都は？',
          category: 'geography',
          difficulty: 'easy',
        },
        answers: [],
        currentTurn: 0,
        isPlaying: true,
        players: [
          { playerId: 'p1', name: 'プレイヤー1', joinedAt: Date.now() },
          { playerId: 'p2', name: 'プレイヤー2', joinedAt: Date.now() },
        ],
      },
      timeRemaining: 25,
      isTimerRunning: true,
      handleMessage: mockHandleMessage,
      reset: mockReset,
    });
  });

  describe('基本表示', () => {
    it('GameBoardが表示される', () => {
      render(<GamePlay roomId="test-room" playerId="p1" />);

      expect(screen.getByText(/テスト問題：日本の首都は？/)).toBeInTheDocument();
    });

    it('タイマーが表示される', () => {
      render(<GamePlay roomId="test-room" playerId="p1" />);

      expect(screen.getByLabelText(/残り時間/)).toBeInTheDocument();
    });

    it('WebSocketに接続される', () => {
      render(<GamePlay roomId="test-room" playerId="p1" />);

      expect(useWebSocket).toHaveBeenCalledWith(
        expect.objectContaining({
          roomId: 'test-room',
        })
      );
    });
  });

  describe('回答送信', () => {
    it('回答を入力して送信するとWebSocketで送信される', async () => {
      const user = userEvent.setup();
      render(<GamePlay roomId="test-room" playerId="p1" />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      const button = screen.getByRole('button', { name: /送信/ });

      await user.type(input, '東京');
      await user.click(button);

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'submitAnswer',
        payload: {
          answer: '東京',
        },
      });
    });
  });

  describe('WebSocket未接続時', () => {
    it('接続中メッセージが表示される', () => {
      (useWebSocket as MockedFunction).mockReturnValue({
        isConnected: false,
        sendMessage: mockSendMessage,
      });

      render(<GamePlay roomId="test-room" playerId="p1" />);

      expect(screen.getByText(/接続中/)).toBeInTheDocument();
    });
  });

  describe('問題未ロード時', () => {
    it('ローディング状態が表示される', () => {
      (useGameWithTimer as MockedFunction).mockReturnValue({
        gameState: {
          question: null,
          answers: [],
          currentTurn: 0,
          isPlaying: false,
          players: [],
        },
        timeRemaining: 30,
        isTimerRunning: false,
        handleMessage: mockHandleMessage,
        reset: mockReset,
      });

      render(<GamePlay roomId="test-room" playerId="p1" />);

      expect(screen.getByText(/問題を読み込み中/)).toBeInTheDocument();
    });
  });

  describe('タイムアップ', () => {
    it('タイムアップ時にWebSocketで通知される', () => {
      render(<GamePlay roomId="test-room" playerId="p1" />);

      // useGameWithTimerが呼ばれた際のonTimeUpコールバックを取得
      const callArgs = (useGameWithTimer as MockedFunction).mock.calls[0][0];
      expect(callArgs).toHaveProperty('onTimeUp');

      // onTimeUpを実行
      callArgs.onTimeUp();

      expect(mockSendMessage).toHaveBeenCalledWith({
        type: 'timeUp',
        payload: {},
      });
    });
  });
});
