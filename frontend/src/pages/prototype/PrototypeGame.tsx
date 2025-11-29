import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnswerGrid } from '../../components/game/AnswerGrid';
import { AnswerValidator } from '../../utils/answerValidator';
import { ScoreCalculator } from '../../utils/scoreCalculator';
import type { AnswerRecord } from '../../hooks/useGameState';

interface Question {
  id: string;
  question: string;
  answers: string[];
  acceptableVariations: Record<string, string[]>;
  category: string;
  difficulty: string;
}

interface Player {
  id: string;
  name: string;
}

interface ExtendedAnswerRecord extends AnswerRecord {
  value: string;
  playerName: string;
}

export function PrototypeGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [players, setPlayers] = useState<Player[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [answers, setAnswers] = useState<ExtendedAnswerRecord[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(45);
  const [gameStatus, setGameStatus] = useState<'playing' | 'completed' | 'timeout'>('playing');
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'incorrect' | null; message: string; answer?: string }>({ type: null, message: '' });

  // プレイヤーデータの読み込み
  useEffect(() => {
    const savedPlayers = localStorage.getItem('prototype-players');
    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    } else {
      // プレイヤーデータがない場合はセットアップ画面に戻る
      navigate('/prototype/setup');
    }
  }, [navigate]);

  // 問題データの読み込み
  useEffect(() => {
    fetch('/questions.json')
      .then((res) => res.json())
      .then((questions: Question[]) => {
        // URLパラメータから問題IDを取得（例: ?questionId=q001）
        const questionId = searchParams.get('questionId');

        let selectedQuestion: Question;

        if (questionId) {
          // 問題IDが指定されている場合、その問題を検索
          const foundQuestion = questions.find(q => q.id === questionId);
          if (foundQuestion) {
            selectedQuestion = foundQuestion;
            console.log(`問題ID "${questionId}" を出題します`);
          } else {
            // 指定されたIDが見つからない場合は最初の問題
            selectedQuestion = questions[0];
            console.warn(`問題ID "${questionId}" が見つかりません。最初の問題を出題します`);
          }
        } else {
          // 問題IDが指定されていない場合は最初の問題
          selectedQuestion = questions[0];
          console.log('問題IDが指定されていないため、最初の問題を出題します');
        }

        setQuestion(selectedQuestion);
      })
      .catch((error) => {
        console.error('問題データの読み込みに失敗しました:', error);
      });
  }, [searchParams]);

  // タイマー管理
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setGameStatus('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus]);

  // ゲーム完了チェック
  useEffect(() => {
    if (answers.filter((a) => a.correct).length === 5) {
      setGameStatus('completed');
    }
  }, [answers]);

  // 結果画面への遷移
  useEffect(() => {
    if (gameStatus !== 'playing') {
      const correctCount = answers.filter((a) => a.correct).length;
      const totalScore = ScoreCalculator.calculateTotalScore(correctCount, timeRemaining);

      // 結果をlocalStorageに保存（問題IDも保存）
      localStorage.setItem('prototype-result', JSON.stringify({
        gameStatus,
        correctCount,
        timeRemaining,
        totalScore,
        questionId: question?.id,
      }));

      // 1秒後に結果画面に遷移
      setTimeout(() => {
        navigate('/prototype/result');
      }, 1000);
    }
  }, [gameStatus, answers, timeRemaining, navigate, question?.id]);

  const handleSubmitAnswer = () => {
    if (!question || !inputValue.trim()) return;

    // 既に回答された答えのリストを取得
    const previousAnswers = answers.map((a) => a.value);

    // 正誤判定（重複チェック含む）
    const validation = AnswerValidator.validate(
      inputValue,
      question.answers,
      question.acceptableVariations,
      previousAnswers
    );

    if (validation.isDuplicate) {
      // 重複の場合
      setFeedback({ type: 'incorrect', message: 'その回答は既に出ています！' });
      setInputValue('');

      // フィードバックを1秒後にクリア
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 1000);
    } else if (validation.isCorrect) {
      // 正解の場合
      const correctAnswer = validation.matchedAnswer || inputValue;
      setAnswers([...answers, {
        value: correctAnswer,
        correct: true,
        score: 10,
        playerName: players[currentTurn % players.length]?.name || `プレイヤー${currentTurn + 1}`,
      }]);
      setFeedback({ type: 'correct', message: '正解！', answer: correctAnswer });
      setInputValue('');

      // 次のプレイヤーに移行
      setTimeout(() => {
        setCurrentTurn(currentTurn + 1);
        setFeedback({ type: null, message: '' });
      }, 1500);
    } else {
      // 不正解の場合
      setFeedback({ type: 'incorrect', message: '不正解！もう一度挑戦してください' });
      setInputValue('');

      // フィードバックを1秒後にクリア
      setTimeout(() => {
        setFeedback({ type: null, message: '' });
      }, 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmitAnswer();
    }
  };

  if (!question || players.length === 0) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  const currentPlayer = players[currentTurn % players.length];

  return (
    <div className="min-h-screen bg-base-200 pb-36 sm:pb-44">
      <div className="max-w-3xl mx-auto p-3 sm:p-4">
        {/* タイトル */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-base-content">
            ファイブボンバー
          </h1>
        </div>

        {/* 問題文 */}
        <div className="card bg-base-100 shadow-lg border border-base-300 mb-4 sm:mb-6">
          <div className="card-body p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-primary mb-2 text-center">
              問題
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-base-content text-center leading-relaxed">
              {question.question}
            </p>
          </div>
        </div>

        {/* 回答グリッド */}
        <div className="mb-4 sm:mb-6">
          <AnswerGrid
            answers={answers}
            currentTurn={currentTurn}
            mySlotIndex={currentTurn % 5}
          />
        </div>
      </div>

      {/* 固定表示の入力エリア */}
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300 shadow-lg z-50">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 relative">
          {/* フィードバック */}
          {feedback.type && (
            <div
              className={`absolute left-3 right-3 sm:left-4 sm:right-4 p-3 sm:p-4 rounded-lg shadow-lg ${
                feedback.type === 'correct'
                  ? 'bg-success text-success-content'
                  : 'bg-error text-error-content'
              }`}
              style={{
                bottom: '100%',
                marginBottom: '0.5rem'
              }}
            >
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-center">
                {feedback.type === 'correct' ? '○ ' : '× '}
                {feedback.answer && `${feedback.answer} - `}
                {feedback.type === 'correct' ? '正解！' : feedback.message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap md:flex-nowrap">
            {/* タイマー */}
            <div className={`badge badge-lg px-4 py-3 text-lg font-bold ${
              timeRemaining <= 5 ? 'badge-error animate-pulse' : 'badge-neutral'
            }`}>
              {timeRemaining}秒
            </div>

            {/* 現在の回答者 */}
            <div className="badge badge-lg badge-outline px-4 py-3 font-medium truncate max-w-[140px] sm:max-w-[180px]">
              {currentPlayer?.name}
            </div>

            {/* 入力フォーム */}
            <div className="flex-1 flex gap-2 w-full md:w-auto">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="答えを入力..."
                disabled={gameStatus !== 'playing'}
                autoFocus
                className="input input-bordered flex-1 text-base sm:text-lg"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={gameStatus !== 'playing' || !inputValue.trim()}
                className="btn btn-primary"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
