/**
 * Common type definitions for Five Bomber Web App (Frontend)
 * フロントエンドで使用する型定義
 */

/**
 * Player - プレイヤー情報
 */
export interface Player {
  playerId: string;
  name: string;
  joinedAt: number;
}

/**
 * Room - ルーム情報
 */
export interface Room {
  roomId: string;
  hostId: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}
