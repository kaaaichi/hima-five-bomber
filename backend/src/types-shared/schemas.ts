/**
 * Zod Validation Schemas
 * フロントエンドとバックエンドで共有するバリデーションスキーマ
 */

import { z } from 'zod';

/**
 * ホスト名のバリデーションスキーマ
 */
export const hostNameSchema = z
  .string()
  .min(1, { message: 'Host name cannot be empty' })
  .max(20, { message: 'Host name must be 20 characters or less' })
  .trim()
  .refine((val) => val.length > 0, {
    message: 'Host name cannot be only whitespace',
  });

/**
 * プレイヤー名のバリデーションスキーマ
 */
export const playerNameSchema = z
  .string()
  .min(1, { message: 'Player name cannot be empty' })
  .max(20, { message: 'Player name must be 20 characters or less' })
  .trim()
  .refine((val) => val.length > 0, {
    message: 'Player name cannot be only whitespace',
  });

/**
 * ルームIDのバリデーションスキーマ
 */
export const roomIdSchema = z
  .string()
  .regex(/^[a-z0-9]{6}$/, { message: 'Room ID must be 6 lowercase alphanumeric characters' });

/**
 * プレイヤーIDのバリデーションスキーマ
 */
export const playerIdSchema = z
  .string()
  .regex(/^player-[a-f0-9]{32}$/, { message: 'Player ID must match the pattern player-[hex32]' });

/**
 * ルーム作成リクエストのスキーマ
 */
export const createRoomRequestSchema = z.object({
  hostName: hostNameSchema,
});

/**
 * ルーム参加リクエストのスキーマ
 */
export const joinRoomRequestSchema = z.object({
  playerName: playerNameSchema,
});

/**
 * 型推論用のヘルパー型
 */
export type CreateRoomRequest = z.infer<typeof createRoomRequestSchema>;
export type JoinRoomRequest = z.infer<typeof joinRoomRequestSchema>;
export type HostName = z.infer<typeof hostNameSchema>;
export type PlayerName = z.infer<typeof playerNameSchema>;
export type RoomId = z.infer<typeof roomIdSchema>;
export type PlayerId = z.infer<typeof playerIdSchema>;

/**
 * バリデーション結果の型
 */
export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; errors: ValidationError[] };

/**
 * バリデーションエラーの型
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * バリデーションヘルパー関数
 */
export function validateCreateRoomRequest(data: unknown): ValidationResult<CreateRoomRequest> {
  const result = createRoomRequestSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * ホスト名のバリデーション
 */
export function validateHostName(hostName: unknown): ValidationResult<HostName> {
  const result = hostNameSchema.safeParse(hostName);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((err) => ({
      field: 'hostName',
      message: err.message,
    })),
  };
}

/**
 * プレイヤー名のバリデーション
 */
export function validatePlayerName(playerName: unknown): ValidationResult<PlayerName> {
  const result = playerNameSchema.safeParse(playerName);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.issues.map((err) => ({
      field: 'playerName',
      message: err.message,
    })),
  };
}
