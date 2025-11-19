/**
 * RoomLobby Component Test
 * TDD: RED phase - テストを先に作成
 * Task 3.6: ルーム待機画面（ロビー）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { RoomLobby } from './RoomLobby';
import * as api from '../services/api';
import type { Room } from '../types/models';

// 型のインポート
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// モックの設定
vi.mock('../services/api');
const mockedGetRoom = vi.mocked(api.getRoom);

// WebSocketのモック
const mockSendMessage = vi.fn();
vi.mock('../hooks/useWebSocket', () => ({
  useWebSocket: vi.fn(() => ({
    isConnected: true,
    sendMessage: mockSendMessage,
  })),
}));

// ナビゲーションのモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// テスト用のルームデータ
const mockRoom = {
  roomId: 'ABC123',
  hostId: 'host-player-id',
  players: [
    {
      playerId: 'host-player-id',
      name: 'ホストプレイヤー',
      joinedAt: Date.now() - 1000,
    },
    {
      playerId: 'player-2-id',
      name: 'プレイヤー2',
      joinedAt: Date.now() - 500,
    },
  ],
  status: 'waiting' as const,
  createdAt: Date.now() - 2000,
};

describe('RoomLobby Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    import.meta.env.VITE_WS_URL = 'wss://test.example.com/ws';
  });

  describe('Acceptance Criteria: 基本表示', () => {
    it('Given ルーム情報が正常に取得できる When RoomLobbyコンポーネントをレンダリングする Then ルーム待機画面が表示される', async () => {
      // APIモックの設定
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'host-player-id',
                isHost: true,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      // ローディング表示
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // ルーム情報が表示されるのを待つ
      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // ルームIDが表示されること
      expect(screen.getByText(/ルームID:/)).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();

      // プレイヤー数が表示されること
      expect(screen.getByText('参加プレイヤー (2/5)')).toBeInTheDocument();

      // プレイヤー名が表示されること
      expect(screen.getByText('ホストプレイヤー')).toBeInTheDocument();
      expect(screen.getByText('プレイヤー2')).toBeInTheDocument();
    });

    it('Given stateが存在しない When RoomLobbyにアクセスする Then ホーム画面に遷移する', async () => {
      render(
        <MemoryRouter initialEntries={['/room/ABC123']}>
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      // ホーム画面に遷移すること
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('Acceptance Criteria: プレイヤーリスト表示', () => {
    it('Given 複数のプレイヤーがいる When プレイヤーリストを表示する Then ホストに王冠アイコンが表示される', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-2-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // ホストラベルが表示されること
      expect(screen.getByText('ホスト')).toBeInTheDocument();

      // 王冠アイコンが1つだけ表示されること
      const playerCards = screen.getAllByText(/👑|👤/);
      const crownIcon = playerCards.filter((el) => el.textContent === '👑');
      expect(crownIcon).toHaveLength(1);
    });

    it('Given 自分がプレイヤーの一人である When プレイヤーリストを表示する Then 自分に「あなた」ラベルが表示される', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-2-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // 「あなた」ラベルが表示されること
      expect(screen.getByText('あなた')).toBeInTheDocument();
    });

    it('Given 自分がホストである When プレイヤーリストを表示する Then 「ホスト」と「あなた」の両方が表示される', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'host-player-id',
                isHost: true,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // 「ホスト」と「あなた」の両方が表示されること
      expect(screen.getByText('ホスト')).toBeInTheDocument();
      expect(screen.getByText('あなた')).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria: ホスト専用機能', () => {
    it('Given 自分がホストである When ルーム待機画面が表示される Then ゲーム開始ボタンが表示される', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'host-player-id',
                isHost: true,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // ゲーム開始ボタンが表示されること
      expect(screen.getByRole('button', { name: 'ゲーム開始' })).toBeInTheDocument();
    });

    it('Given 自分がホストでない When ルーム待機画面が表示される Then ゲーム開始ボタンが表示されない', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-2-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      // ゲーム開始ボタンが表示されないこと
      expect(screen.queryByRole('button', { name: 'ゲーム開始' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '1人以上必要です' })).not.toBeInTheDocument();
    });

    it('Given ホストで1人以上のプレイヤーがいる When ゲーム開始ボタンをクリックする Then ゲーム開始処理が実行される', async () => {
      const user = userEvent.setup();

      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'host-player-id',
                isHost: true,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      const startButton = screen.getByRole('button', { name: 'ゲーム開始' });

      // ゲーム開始ボタンをクリック
      await user.click(startButton);

      // WebSocketでstartGameメッセージが送信されること
      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith('startGame', {});
      });
    });
  });

  describe('Acceptance Criteria: ルーム退出', () => {
    it('Given ルーム待機画面が表示されている When 退出ボタンをクリックする Then ホーム画面に遷移する', async () => {
      const user = userEvent.setup();

      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-2-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ルーム待機中')).toBeInTheDocument();
      });

      const leaveButton = screen.getByRole('button', { name: 'ルームを退出' });

      // 退出ボタンをクリック
      await user.click(leaveButton);

      // ホーム画面に遷移すること（TODO: 実装時にはDELETE APIを呼ぶように修正）
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Acceptance Criteria: エラーハンドリング', () => {
    it('Given ルームが存在しない（404） When API呼び出しが失敗する Then エラーメッセージが表示される', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: false,
        error: 'Room not found: ABC123',
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Room not found: ABC123')).toBeInTheDocument();
      });

      // トップに戻るボタンが表示されること
      expect(screen.getByRole('button', { name: 'トップに戻る' })).toBeInTheDocument();
    });

    it('Given ネットワークエラーが発生する When API呼び出しが失敗する Then ネットワークエラーメッセージが表示される', async () => {
      mockedGetRoom.mockRejectedValueOnce(new Error('Network error'));

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ネットワークエラーが発生しました')).toBeInTheDocument();
      });
    });

    it('Given エラー画面が表示されている When トップに戻るボタンをクリックする Then ホーム画面に遷移する', async () => {
      const user = userEvent.setup();

      mockedGetRoom.mockResolvedValueOnce({
        success: false,
        error: 'Room not found',
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Room not found')).toBeInTheDocument();
      });

      const backButton = screen.getByRole('button', { name: 'トップに戻る' });

      // トップに戻るボタンをクリック
      await user.click(backButton);

      // ホーム画面に遷移すること
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Acceptance Criteria: ローディング状態', () => {
    it('Given API呼び出しが実行中である When レスポンス待機中である Then ローディングメッセージが表示される', () => {
      // APIモックの設定（遅延）
      let resolvePromise: (value: ApiResponse<Room>) => void;
      const promise = new Promise<ApiResponse<Room>>((resolve) => {
        resolvePromise = resolve;
      });
      mockedGetRoom.mockReturnValueOnce(promise);

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      // ローディング中の表示
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      // Promise解決
      resolvePromise!({
        success: true,
        data: mockRoom,
      });
    });
  });

  describe('Acceptance Criteria: API呼び出し', () => {
    it('Given ルーム待機画面にアクセスする When コンポーネントがマウントされる Then GET /api/rooms/:roomId が呼ばれる', async () => {
      mockedGetRoom.mockResolvedValueOnce({
        success: true,
        data: mockRoom,
      });

      render(
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/room/ABC123',
              state: {
                roomId: 'ABC123',
                playerId: 'player-id',
                isHost: false,
              },
            },
          ]}
        >
          <Routes>
            <Route path="/room/:roomId" element={<RoomLobby />} />
          </Routes>
        </MemoryRouter>
      );

      // API呼び出しが実行されること
      await waitFor(() => {
        expect(mockedGetRoom).toHaveBeenCalledWith('ABC123');
      });
    });
  });
});
