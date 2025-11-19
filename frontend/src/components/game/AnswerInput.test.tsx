import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnswerInput } from './AnswerInput';

describe('AnswerInput', () => {
  describe('入力フォーム表示', () => {
    it('回答入力フィールドが表示される', () => {
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      expect(input).toBeInTheDocument();
    });

    it('送信ボタンが表示される', () => {
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={false} />);

      const button = screen.getByRole('button', { name: /送信/ });
      expect(button).toBeInTheDocument();
    });
  });

  describe('入力と送信', () => {
    it('テキストを入力できる', async () => {
      const user = userEvent.setup();
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      await user.type(input, 'テスト回答');

      expect(input).toHaveValue('テスト回答');
    });

    it('送信ボタンをクリックすると回答が送信される', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      const button = screen.getByRole('button', { name: /送信/ });

      await user.type(input, 'テスト回答');
      await user.click(button);

      expect(handleSubmit).toHaveBeenCalledWith('テスト回答');
    });

    it('Enterキーで送信される', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);

      await user.type(input, 'テスト回答{Enter}');

      expect(handleSubmit).toHaveBeenCalledWith('テスト回答');
    });

    it('送信後に入力フィールドがクリアされる', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      const button = screen.getByRole('button', { name: /送信/ });

      await user.type(input, 'テスト回答');
      await user.click(button);

      expect(input).toHaveValue('');
    });
  });

  describe('バリデーション', () => {
    it('空文字の送信を防ぐ', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={false} />);

      const button = screen.getByRole('button', { name: /送信/ });
      await user.click(button);

      expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('空白のみの送信を防ぐ', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={false} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      const button = screen.getByRole('button', { name: /送信/ });

      await user.type(input, '   ');
      await user.click(button);

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('無効化状態', () => {
    it('isDisabled=trueの場合、入力フィールドが無効化される', () => {
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={true} />);

      const input = screen.getByPlaceholderText(/回答を入力/);
      expect(input).toBeDisabled();
    });

    it('isDisabled=trueの場合、送信ボタンが無効化される', () => {
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={true} />);

      const button = screen.getByRole('button', { name: /送信/ });
      expect(button).toBeDisabled();
    });

    it('isDisabled=trueの場合、送信されない', async () => {
      const user = userEvent.setup();
      const handleSubmit = vi.fn();
      render(<AnswerInput onSubmit={handleSubmit} isDisabled={true} />);

      const button = screen.getByRole('button', { name: /送信/ });
      await user.click(button);

      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイル向けのタップ領域が確保される', () => {
      render(<AnswerInput onSubmit={vi.fn()} isDisabled={false} />);

      const button = screen.getByRole('button', { name: /送信/ });
      // Tailwind CSSのpy-2 px-4で十分なタップ領域が確保される
      expect(button).toHaveClass('py-2');
    });
  });
});
