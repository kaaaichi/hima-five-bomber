/**
 * JoinRoom Component Test
 * TDD: RED phase - テストを先に作成
 * Task 3.5: ルーム参加UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { JoinRoom } from './JoinRoom';
import * as api from '../services/api';

// 型のインポート
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// モックの設定
vi.mock('../services/api');
const mockedJoinRoom = vi.mocked(api.joinRoom);

// ナビゲーションのモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('JoinRoom Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria: 基本表示', () => {
    it('Given プロジェクトディレクトリが存在する When JoinRoomコンポーネントをレンダリングする Then ルーム参加画面が表示される', () => {
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      // タイトルが表示されること
      expect(screen.getByText('ルーム参加')).toBeInTheDocument();

      // ルームID入力フォームが表示されること
      expect(screen.getByLabelText('ルームID')).toBeInTheDocument();

      // プレイヤー名入力フォームが表示されること
      expect(screen.getByLabelText('プレイヤー名')).toBeInTheDocument();

      // プレースホルダーが表示されること
      expect(screen.getByPlaceholderText('6文字のルームID')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('あなたの名前を入力')).toBeInTheDocument();

      // ルームに参加ボタンが表示されること
      expect(screen.getByRole('button', { name: 'ルームに参加' })).toBeInTheDocument();

      // 戻るボタンが表示されること
      expect(screen.getByText('← 戻る')).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria: ルームID入力', () => {
    it('Given ルーム参加画面が表示されている When ルームIDを入力する Then 入力値が反映される（大文字に変換）', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ルームID');

      // 入力前は空であること
      expect(input).toHaveValue('');

      // 小文字で入力
      await user.type(input, 'abc123');

      // 大文字に変換されて反映されること
      expect(input).toHaveValue('ABC123');

      // 文字数カウンターが更新されること
      const paragraph = input.parentElement?.querySelector('p');
      expect(paragraph?.textContent).toBe('6/6文字');
    });

    it('Given ルームID入力フォームが表示されている When 6文字を超える入力を試みる Then maxLengthで制限される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ルームID');

      // 7文字入力を試みる
      await user.type(input, 'abcdefg');

      // 6文字で制限されること（大文字に変換）
      expect(input).toHaveValue('ABCDEF');

      // 文字数カウンターが6/6文字であること
      const paragraph = input.parentElement?.querySelector('p');
      expect(paragraph?.textContent).toBe('6/6文字');
    });
  });

  describe('Acceptance Criteria: プレイヤー名入力', () => {
    it('Given ルーム参加画面が表示されている When プレイヤー名を入力する Then 入力値が反映される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('プレイヤー名');

      // 入力前は空であること
      expect(input).toHaveValue('');

      // 文字を入力
      await user.type(input, 'テストプレイヤー');

      // 入力値が反映されること
      expect(input).toHaveValue('テストプレイヤー');

      // 文字数カウンターが更新されること
      const paragraph = input.parentElement?.querySelector('p');
      expect(paragraph?.textContent).toBe('8/20文字');
    });

    it('Given プレイヤー名入力フォームが表示されている When 20文字を超える入力を試みる Then maxLengthで制限される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('プレイヤー名');

      // 21文字入力を試みる
      await user.type(input, 'あいうえおかきくけこさしすせそたちつてとな');

      // 20文字で制限されること
      expect(input).toHaveValue('あいうえおかきくけこさしすせそたちつてと');

      // 文字数カウンターが20/20文字であること
      const paragraph = input.parentElement?.querySelector('p');
      expect(paragraph?.textContent).toBe('20/20文字');
    });
  });

  describe('Acceptance Criteria: バリデーション', () => {
    it('Given ルームIDが空である When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // プレイヤー名だけ入力
      await user.type(playerNameInput, 'テストプレイヤー');

      // 空の状態で送信
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('ルームIDを入力してください')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedJoinRoom).not.toHaveBeenCalled();
    });

    it('Given ルームIDが6文字未満である When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 5文字のルームIDを入力
      await user.type(roomIdInput, 'ABC12');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('ルームIDは6文字です')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedJoinRoom).not.toHaveBeenCalled();
    });

    it('Given プレイヤー名が空である When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // ルームIDだけ入力
      await user.type(roomIdInput, 'ABC123');

      // 空の状態で送信
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('プレイヤー名を入力してください')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedJoinRoom).not.toHaveBeenCalled();
    });

    it('Given プレイヤー名が空白のみである When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // ルームIDと空白のみのプレイヤー名を入力
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, '   ');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('プレイヤー名を入力してください')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedJoinRoom).not.toHaveBeenCalled();
    });
  });

  describe('Acceptance Criteria: ルーム参加成功', () => {
    it('Given 有効なルームIDとプレイヤー名が入力されている When 送信ボタンをクリックする Then POST /api/rooms/:roomId/join が呼ばれる', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedJoinRoom.mockResolvedValueOnce({
        success: true,
        data: {
          playerId: 'test-player-id',
        },
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');

      // 送信ボタンをクリック
      await user.click(submitButton);

      // API呼び出しが実行されること（大文字に変換、トリム後の値）
      expect(mockedJoinRoom).toHaveBeenCalledWith('ABC123', 'テストプレイヤー');
    });

    it('Given API呼び出しが成功する When レスポンスを受信する Then プレイヤーIDが取得でき、ルーム待機画面に遷移する', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedJoinRoom.mockResolvedValueOnce({
        success: true,
        data: {
          playerId: 'test-player-id-123',
        },
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // ルーム待機画面に遷移すること
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/room/ABC123', {
          state: {
            roomId: 'ABC123',
            playerId: 'test-player-id-123',
            isHost: false,
          },
        });
      });
    });

    it('Given ルームIDとプレイヤー名に前後の空白がある When 送信する Then トリムされた値でAPIが呼ばれる', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedJoinRoom.mockResolvedValueOnce({
        success: true,
        data: {
          playerId: 'test-player-id',
        },
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 前後に空白を含む入力（空白は自動的にトリムされる）
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, '  テストプレイヤー  ');
      await user.click(submitButton);

      // トリムされた値でAPI呼び出しが実行されること（ルームIDは大文字）
      expect(mockedJoinRoom).toHaveBeenCalledWith('ABC123', 'テストプレイヤー');
    });
  });

  describe('Acceptance Criteria: ローディング状態', () => {
    it('Given API呼び出しが実行中である When レスポンス待機中である Then ローディングスピナーが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（遅延）
      let resolvePromise: (value: ApiResponse<{ playerId: string }>) => void;
      const promise = new Promise<ApiResponse<{ playerId: string }>>((resolve) => {
        resolvePromise = resolve;
      });
      mockedJoinRoom.mockReturnValueOnce(promise);

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // ローディング中の表示
      expect(screen.getByText('参加中...')).toBeInTheDocument();

      // フォームが無効化されること
      expect(roomIdInput).toBeDisabled();
      expect(playerNameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Promise解決
      resolvePromise!({
        success: true,
        data: { playerId: 'test-player-id' },
      });

      // ローディングが終了すること
      await waitFor(() => {
        expect(screen.queryByText('参加中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Acceptance Criteria: エラーハンドリング', () => {
    it('Given ルームが存在しない（404） When エラーレスポンスを受信する Then 適切なエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（404エラー）
      mockedJoinRoom.mockResolvedValueOnce({
        success: false,
        error: 'Room not found: abc123',
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText('Room not found: abc123')
        ).toBeInTheDocument();
      });
    });

    it('Given ルームが満員（409） When エラーレスポンスを受信する Then 満員エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（満員エラー）
      mockedJoinRoom.mockResolvedValueOnce({
        success: false,
        error: 'ルームが満員です（最大5人）',
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText('ルームが満員です（最大5人）')
        ).toBeInTheDocument();
      });
    });

    it('Given ゲーム中のルーム（400） When エラーレスポンスを受信する Then 適切なエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（ゲーム中エラー）
      mockedJoinRoom.mockResolvedValueOnce({
        success: false,
        error: 'ゲーム中のルームには参加できません',
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText('ゲーム中のルームには参加できません')
        ).toBeInTheDocument();
      });
    });

    it('Given ネットワークエラーが発生する When 例外がスローされる Then ネットワークエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（例外）
      mockedJoinRoom.mockRejectedValueOnce(new Error('Network error'));

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // ネットワークエラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText(
            'ネットワークエラーが発生しました。もう一度お試しください。'
          )
        ).toBeInTheDocument();
      });
    });

    it('Given APIエラーが発生する When エラーメッセージがない場合 Then デフォルトエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（エラーメッセージなし）
      mockedJoinRoom.mockResolvedValueOnce({
        success: false,
      });

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const roomIdInput = screen.getByLabelText('ルームID');
      const playerNameInput = screen.getByLabelText('プレイヤー名');
      const submitButton = screen.getByRole('button', { name: 'ルームに参加' });

      // 入力して送信
      await user.type(roomIdInput, 'ABC123');
      await user.type(playerNameInput, 'テストプレイヤー');
      await user.click(submitButton);

      // デフォルトエラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText('ルームへの参加に失敗しました')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Acceptance Criteria: ナビゲーション', () => {
    it('Given ルーム参加画面が表示されている When 戻るボタンをクリックする Then ホーム画面に遷移する', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      const backButton = screen.getByText('← 戻る');

      // 戻るボタンをクリック
      await user.click(backButton);

      // ホーム画面に遷移すること
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Acceptance Criteria: レスポンシブデザイン', () => {
    it('Given ルーム参加画面が表示されている Then レスポンシブクラスが適用されている', () => {
      render(
        <BrowserRouter>
          <JoinRoom />
        </BrowserRouter>
      );

      // コンテナ要素のクラスを確認
      const heading = screen.getByText('ルーム参加');
      const formContainer = heading.parentElement; // bg-white rounded-lg のdiv
      expect(formContainer?.className).toContain('max-w-md');
      expect(formContainer?.className).toContain('w-full');
    });
  });
});
