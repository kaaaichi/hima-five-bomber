/**
 * スコア計算を行うユーティリティ
 */
export class ScoreCalculator {
  private static readonly SCORE_PER_ANSWER = 10;
  private static readonly SCORE_PER_SECOND = 1;

  /**
   * 正解1つあたりのスコアを返す
   */
  static calculateAnswerScore(): number {
    return this.SCORE_PER_ANSWER;
  }

  /**
   * 時間ボーナススコアを計算する
   * @param timeRemaining - 残り時間（秒）
   */
  static calculateTimeBonus(timeRemaining: number): number {
    return Math.max(0, timeRemaining) * this.SCORE_PER_SECOND;
  }

  /**
   * 総合スコアを計算する
   * @param correctAnswers - 正解数
   * @param timeRemaining - 残り時間（秒）
   */
  static calculateTotalScore(correctAnswers: number, timeRemaining: number): number {
    const answerScore = correctAnswers * this.SCORE_PER_ANSWER;
    const timeBonus = this.calculateTimeBonus(timeRemaining);
    return answerScore + timeBonus;
  }
}
