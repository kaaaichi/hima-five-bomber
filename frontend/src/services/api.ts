/**
 * API Service
 * バックエンドAPIとの通信を管理
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

/**
 * API Response型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * ルーム作成レスポンス
 */
interface CreateRoomResponse {
  roomId: string;
  hostId: string;
}

/**
 * エラーレスポンス
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}

/**
 * ルームを作成
 * @param hostName ホスト名
 * @returns ルームIDとホストID
 */
export async function createRoom(hostName: string): Promise<ApiResponse<CreateRoomResponse>> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostName }),
    });

    if (!response.ok) {
      // エラーレスポンスをパース
      const errorData: ErrorResponse = await response.json();
      return {
        success: false,
        error: errorData.error.message || 'ルームの作成に失敗しました',
      };
    }

    const data: CreateRoomResponse = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * ルームに参加
 * @param roomId ルームID
 * @param playerName プレイヤー名
 * @returns プレイヤーID
 */
export async function joinRoom(
  roomId: string,
  playerName: string
): Promise<ApiResponse<{ playerId: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName }),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      return {
        success: false,
        error: errorData.error.message || 'ルームへの参加に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: { playerId: data.playerId },
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}

/**
 * ルーム情報を取得
 * @param roomId ルームID
 * @returns ルーム情報
 */
export async function getRoom(roomId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      return {
        success: false,
        error: errorData.error.message || 'ルーム情報の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}
