/**
 * Game constants
 * ファイブボンバーのゲームルール定数
 */

/**
 * GAME_RULES - 基本的なゲームルール
 */
export const GAME_RULES = {
  /** 制限時間（秒） */
  TIME_LIMIT: 30,
  /** 必要な正解数 */
  REQUIRED_ANSWERS: 5,
  /** 1ゲームあたりの問題数 */
  QUESTIONS_PER_GAME: 4,
} as const;

/**
 * SCORING_RULES - スコアリングルール
 */
export const SCORING_RULES = {
  /** 正解1つあたりのスコア（点） */
  SCORE_PER_ANSWER: 10,
  /** 残り時間1秒あたりのボーナススコア（点） */
  SCORE_PER_SECOND: 1,
} as const;

/**
 * TIME_RULES - 時間関連のルール
 */
export const TIME_RULES = {
  /** 警告表示の閾値（秒） */
  WARNING_THRESHOLD: 5,
  /** 正誤判定のレスポンスタイム下限（ミリ秒） */
  JUDGMENT_RESPONSE_TIME_MIN: 50,
  /** 正誤判定のレスポンスタイム上限（ミリ秒） */
  JUDGMENT_RESPONSE_TIME_MAX: 100,
  /** ランキング更新のブロードキャストタイム（ミリ秒） */
  RANKING_BROADCAST_TIME: 200,
} as const;

/**
 * PLAYER_RULES - プレイヤー関連のルール
 */
export const PLAYER_RULES = {
  /** 最大プレイヤー数 */
  MAX_PLAYERS: 5,
  /** 最小プレイヤー数 */
  MIN_PLAYERS: 1,
} as const;

/**
 * QUESTION_RULES - 問題関連のルール
 */
export const QUESTION_RULES = {
  /** 問題あたりの最小正解数 */
  MIN_ANSWERS: 5,
  /** 問題の難易度レベル */
  DIFFICULTY_LEVELS: ['easy', 'medium', 'hard'] as const,
} as const;
