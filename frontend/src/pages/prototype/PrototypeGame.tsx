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
  const [timeRemaining, setTimeRemaining] = useState(30);
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

      // 結果をlocalStorageに保存
      localStorage.setItem('prototype-result', JSON.stringify({
        gameStatus,
        correctCount,
        timeRemaining,
        totalScore,
      }));

      // 1秒後に結果画面に遷移
      setTimeout(() => {
        navigate('/prototype/result');
      }, 1000);
    }
  }, [gameStatus, answers, timeRemaining, navigate]);

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
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">読み込み中...</div>
      </div>
    );
  }

  const currentPlayer = players[currentTurn % players.length];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-400 to-orange-500 p-4 pb-40">
        <div className="max-w-6xl mx-auto">
          {/* タイトル */}
          <div className="text-center mb-8">
            <h1 className="text-6xl font-black text-white mb-2">
              💣 FIVE BOMBER 💣
            </h1>
          </div>

          {/* 問題文 */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-800 border-4 border-white rounded-lg p-8 max-w-4xl w-full">
            <h2 className="text-4xl font-black text-orange-400 mb-6 text-center">問題</h2>
            <p className="text-3xl font-bold text-white text-center leading-relaxed">{question.question}</p>
          </div>
        </div>

        {/* 回答グリッド */}
        <div className="mb-6">
          <AnswerGrid
            answers={answers}
            currentTurn={currentTurn}
            mySlotIndex={currentTurn % 5}
          />
        </div>
        </div>
      </div>

      {/* 固定表示の入力エリア */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t-4 border-white z-50"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 50
        }}
      >
        <div className="max-w-6xl mx-auto p-6 relative">
          {/* フィードバック（入力フォームの上に絶対配置） */}
          {feedback.type && (
            <div
              className={`absolute left-6 right-6 p-6 rounded-lg border-4 ${
                feedback.type === 'correct'
                  ? 'bg-green-600 border-white'
                  : 'bg-red-600 border-white'
              }`}
              style={{
                bottom: '100%',
                marginBottom: '1rem'
              }}
            >
              <div className="flex items-center justify-center gap-6">
                {feedback.answer && (
                  <p className="text-4xl font-black text-white">{feedback.answer}</p>
                )}
                <p className="text-5xl font-black text-white">{feedback.type === 'correct' ? '⭕ 正解！' : '❌ ' + feedback.message}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
            {/* コンパクトなタイマー */}
            <div className="bg-red-600 border-4 border-white rounded-lg px-6 py-3 min-w-[140px]">
              <div className="text-sm font-bold text-white text-center">残り時間</div>
              <div className={`text-4xl font-black text-center ${timeRemaining <= 5 ? 'text-yellow-300 animate-pulse' : 'text-white'}`}>
                {timeRemaining}
              </div>
            </div>

            {/* 現在の回答者 */}
            <div className="bg-orange-500 border-4 border-white rounded-lg px-6 py-3 min-w-[200px]">
              <div className="text-sm font-bold text-white text-center">現在の回答者</div>
              <div className="text-2xl font-black text-white text-center">{currentPlayer?.name}</div>
            </div>

            {/* 入力フォーム */}
            <div className="flex-1 flex gap-3 w-full lg:w-auto">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="答えを入力..."
                disabled={gameStatus !== 'playing'}
                autoFocus
                className="flex-1 px-8 py-5 text-2xl font-bold rounded-lg border-4 border-white bg-white focus:ring-4 focus:ring-orange-400 focus:border-orange-400 disabled:bg-gray-300 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={gameStatus !== 'playing' || !inputValue.trim()}
                className="bg-orange-500 hover:bg-orange-600 border-4 border-white px-12 py-5 rounded-lg font-black text-3xl text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
