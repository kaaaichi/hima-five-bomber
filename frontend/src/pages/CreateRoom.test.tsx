/**
 * CreateRoom Component Test
 * TDD: RED phase - テストを先に作成
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { CreateRoom } from './CreateRoom';
import * as api from '../services/api';

// 型のインポート
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CreateRoomResponse {
  roomId: string;
  hostId: string;
}

// モックの設定
vi.mock('../services/api');
const mockedCreateRoom = vi.mocked(api.createRoom);

// ナビゲーションのモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateRoom Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criteria: 基本表示', () => {
    it('Given プロジェクトディレクトリが存在する When CreateRoomコンポーネントをレンダリングする Then ルーム作成画面が表示される', () => {
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      // タイトルが表示されること
      expect(screen.getByText('ルーム作成')).toBeInTheDocument();

      // ホスト名入力フォームが表示されること
      expect(screen.getByLabelText('ホスト名')).toBeInTheDocument();

      // プレースホルダーが表示されること
      expect(screen.getByPlaceholderText('あなたの名前を入力')).toBeInTheDocument();

      // ルームを作成ボタンが表示されること
      expect(screen.getByRole('button', { name: 'ルームを作成' })).toBeInTheDocument();

      // 戻るボタンが表示されること
      expect(screen.getByText('← 戻る')).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria: ホスト名入力', () => {
    it('Given ルーム作成画面が表示されている When ホスト名を入力する Then 入力値が反映される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');

      // 入力前は空であること
      expect(input).toHaveValue('');

      // 文字を入力
      await user.type(input, 'テストホスト');

      // 入力値が反映されること
      expect(input).toHaveValue('テストホスト');

      // 文字数カウンターが更新されること
      // 「テストホスト」は6文字なので、「6/20文字」が表示される
      const paragraph = input.parentElement?.querySelector('p');
      expect(paragraph?.textContent).toBe('6/20文字');
    });

    it('Given ホスト名入力フォームが表示されている When 20文字を超える入力を試みる Then maxLengthで制限される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');

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
    it('Given ホスト名が空である When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // 空の状態で送信
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('ホスト名を入力してください')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedCreateRoom).not.toHaveBeenCalled();
    });

    it('Given ホスト名が空白のみである When 送信ボタンをクリックする Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // 空白のみ入力
      await user.type(input, '   ');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      expect(screen.getByText('ホスト名を入力してください')).toBeInTheDocument();

      // API呼び出しは実行されないこと
      expect(mockedCreateRoom).not.toHaveBeenCalled();
    });
  });

  describe('Acceptance Criteria: ルーム作成成功', () => {
    it('Given 有効なホスト名が入力されている When 送信ボタンをクリックする Then POST /api/rooms が呼ばれる', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedCreateRoom.mockResolvedValueOnce({
        success: true,
        data: {
          roomId: 'test-room-id',
          hostId: 'test-host-id',
        },
      });

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // ホスト名を入力
      await user.type(input, 'テストホスト');

      // 送信ボタンをクリック
      await user.click(submitButton);

      // API呼び出しが実行されること（トリム後の値）
      expect(mockedCreateRoom).toHaveBeenCalledWith('テストホスト');
    });

    it('Given API呼び出しが成功する When レスポンスを受信する Then ルームIDが取得でき、ルーム待機画面に遷移する', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedCreateRoom.mockResolvedValueOnce({
        success: true,
        data: {
          roomId: 'test-room-id',
          hostId: 'test-host-id',
        },
      });

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // ホスト名を入力して送信
      await user.type(input, 'テストホスト');
      await user.click(submitButton);

      // ルーム待機画面に遷移すること
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/room/test-room-id', {
          state: {
            roomId: 'test-room-id',
            playerId: 'test-host-id',
            isHost: true,
          },
        });
      });
    });

    it('Given ホスト名に前後の空白がある When 送信する Then トリムされた値でAPIが呼ばれる', async () => {
      const user = userEvent.setup();

      // APIモックの設定
      mockedCreateRoom.mockResolvedValueOnce({
        success: true,
        data: {
          roomId: 'test-room-id',
          hostId: 'test-host-id',
        },
      });

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // 前後に空白を含むホスト名を入力
      await user.type(input, '  テストホスト  ');
      await user.click(submitButton);

      // トリムされた値でAPI呼び出しが実行されること
      expect(mockedCreateRoom).toHaveBeenCalledWith('テストホスト');
    });
  });

  describe('Acceptance Criteria: ローディング状態', () => {
    it('Given API呼び出しが実行中である When レスポンス待機中である Then ローディングスピナーが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（遅延）
      let resolvePromise: (value: ApiResponse<CreateRoomResponse>) => void;
      const promise = new Promise<ApiResponse<CreateRoomResponse>>((resolve) => {
        resolvePromise = resolve;
      });
      mockedCreateRoom.mockReturnValueOnce(promise);

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // ホスト名を入力して送信
      await user.type(input, 'テストホスト');
      await user.click(submitButton);

      // ローディング中の表示
      expect(screen.getByText('作成中...')).toBeInTheDocument();

      // フォームが無効化されること
      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // Promise解決
      resolvePromise!({
        success: true,
        data: { roomId: 'test-room-id', hostId: 'test-host-id' },
      });

      // ローディングが終了すること
      await waitFor(() => {
        expect(screen.queryByText('作成中...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Acceptance Criteria: エラーハンドリング', () => {
    it('Given APIエラーが発生する When エラーレスポンスを受信する Then エラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（エラー）
      mockedCreateRoom.mockResolvedValueOnce({
        success: false,
        error: 'ルームの作成に失敗しました',
      });

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // ホスト名を入力して送信
      await user.type(input, 'テストホスト');
      await user.click(submitButton);

      // エラーメッセージが表示されること
      await waitFor(() => {
        expect(
          screen.getByText('ルームの作成に失敗しました')
        ).toBeInTheDocument();
      });
    });

    it('Given ネットワークエラーが発生する When 例外がスローされる Then ネットワークエラーメッセージが表示される', async () => {
      const user = userEvent.setup();

      // APIモックの設定（例外）
      mockedCreateRoom.mockRejectedValueOnce(new Error('Network error'));

      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      const input = screen.getByLabelText('ホスト名');
      const submitButton = screen.getByRole('button', { name: 'ルームを作成' });

      // ホスト名を入力して送信
      await user.type(input, 'テストホスト');
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
  });

  describe('Acceptance Criteria: ナビゲーション', () => {
    it('Given ルーム作成画面が表示されている When 戻るボタンをクリックする Then ホーム画面に遷移する', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <CreateRoom />
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
    it('Given ルーム作成画面が表示されている Then レスポンシブクラスが適用されている', () => {
      render(
        <BrowserRouter>
          <CreateRoom />
        </BrowserRouter>
      );

      // コンテナ要素のクラスを確認（h1の親のdiv要素を取得）
      const heading = screen.getByText('ルーム作成');
      const formContainer = heading.parentElement; // bg-white rounded-lg のdiv
      expect(formContainer?.className).toContain('max-w-md');
      expect(formContainer?.className).toContain('w-full');
    });
  });
});
