import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { useGetPlaceQuizQuery, useSubmitQuizAttemptMutation } from '../store/api/arApi';
import type { QuizAttemptResponse } from '../store/api/arApi';

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`bg-white/70 dark:bg-black/60 backdrop-blur-2xl rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-white/50 dark:border-white/10 ${className}`}
  >
    {children}
  </div>
);

const SparkleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" />
  </svg>
);

const QuizPage = () => {
  const navigate = useNavigate();
  const { placeId } = useParams<{ placeId: string }>();
  const { data, isLoading, isError } = useGetPlaceQuizQuery(placeId!, { skip: !placeId });
  const [submitAttempt, { isLoading: submitting }] = useSubmitQuizAttemptMutation();

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizAttemptResponse | null>(null);

  const questions = data?.quiz?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);
  // `result` covers the just-submitted case; `data.attempted` covers coming back later.
  const alreadyDone = !result && !!data?.attempted;
  const review = data?.review ?? null;

  const handleSubmit = async () => {
    if (!placeId || !allAnswered) return;
    const submitted = await submitAttempt({
      placeId,
      answers: questions.map((_, i) => answers[i]),
    }).unwrap();
    setResult(submitted);
  };

  return (
    <div className="max-w-md mx-auto px-5 pt-10 pb-32">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-stone-500 dark:text-stone-400 mb-6 active:scale-95 transition-transform"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <header className="mb-6">
        <p className="text-sm text-stone-500 dark:text-stone-400">Optional challenge</p>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Place quiz</h1>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">
          5 right = 35 · 4 = 30 · 3 = 25 · 2 = 20 · 1 = 10 AR points. One attempt only.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-stone-200/60 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-stone-500 dark:text-stone-400">This place doesn’t have a quiz yet.</p>
        </Card>
      ) : data?.locked ? (
        <Card className="p-8 text-center">
          <svg className="w-10 h-10 mx-auto mb-3 text-stone-300 dark:text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Quiz locked</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Visit every checkpoint of this place to unlock the quiz and earn AR points.
          </p>
        </Card>
      ) : alreadyDone && review ? (
        /* Review mode — the one attempt is spent; show the answer key vs their picks. */
        <>
          <Card className="p-6 text-center mb-6">
            <SparkleIcon className="w-10 h-10 mx-auto mb-3 text-crimson-500" />
            <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
              {review.correct_count != null ? `You got ${review.correct_count} of ${questions.length}` : 'Quiz completed'}
            </h3>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              You earned <span className="font-semibold text-crimson-600 dark:text-crimson-400">{data?.earned_points} AR points</span> on this quiz.
            </p>
          </Card>

          <div className="space-y-4">
            {questions.map((q, qi) => {
              // undefined for legacy attempts whose picks weren't stored.
              const myAnswer = review.answers[qi];
              const correctIdx = review.correct_indexes[qi];
              return (
                <Card key={qi} className="p-4">
                  <p className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
                    <span className="text-stone-400 dark:text-stone-500 mr-1.5">{qi + 1}.</span>
                    {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isCorrect = oi === correctIdx;
                      const isMine = oi === myAnswer;
                      return (
                        <div
                          key={oi}
                          className={`flex items-center justify-between gap-2 text-sm px-4 py-2.5 rounded-xl border ${
                            isCorrect
                              ? 'border-navy-400 bg-navy-50 dark:bg-navy-500/25 text-navy-600 dark:text-navy-200 font-semibold'
                              : isMine
                                ? 'border-crimson-400 bg-crimson-50 dark:bg-crimson-500/20 text-crimson-600 dark:text-crimson-300'
                                : 'border-stone-200 dark:border-white/10 text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          <span>{opt}</span>
                          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                            {isCorrect && isMine ? (<><Check className="w-3.5 h-3.5" /> your answer</>) : isCorrect ? (<><Check className="w-3.5 h-3.5" /> correct</>) : isMine ? (<><X className="w-3.5 h-3.5" /> your answer</>) : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      ) : alreadyDone ? (
        <Card className="p-8 text-center">
          <SparkleIcon className="w-10 h-10 mx-auto mb-3 text-crimson-500" />
          <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Already completed</h3>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            You earned <span className="font-semibold text-crimson-600 dark:text-crimson-400">{data?.earned_points} AR points</span> on this quiz.
            Each quiz can only be attempted once.
          </p>
        </Card>
      ) : (
        <>
          {result && (
            <Card className="p-6 text-center mb-6">
              <SparkleIcon className="w-10 h-10 mx-auto mb-3 text-crimson-500" />
              <h3 className="text-lg font-bold text-stone-900 dark:text-white mb-1">
                {result.correct_count} of {questions.length} correct
              </h3>
              <p className="text-sm text-stone-500 dark:text-stone-400">
                You earned <span className="font-semibold text-crimson-600 dark:text-crimson-400">+{result.points_awarded} AR points</span>
              </p>
            </Card>
          )}

          <div className="space-y-4">
            {questions.map((q, qi) => (
              <Card key={qi} className="p-4">
                <p className="text-sm font-semibold text-stone-900 dark:text-white mb-3">
                  <span className="text-stone-400 dark:text-stone-500 mr-1.5">{qi + 1}.</span>
                  {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => {
                    const chosen = answers[qi] === oi;
                    const showCorrect = result !== null && result.correct_indexes[qi] === oi;
                    const showWrong = result !== null && chosen && result.correct_indexes[qi] !== oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={result !== null || submitting}
                        onClick={() => setAnswers((a) => ({ ...a, [qi]: oi }))}
                        className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-colors ${
                          showCorrect
                            ? 'border-navy-400 bg-navy-50 dark:bg-navy-500/25 text-navy-600 dark:text-navy-200 font-semibold'
                            : showWrong
                              ? 'border-crimson-400 bg-crimson-50 dark:bg-crimson-500/20 text-crimson-600 dark:text-crimson-300 line-through'
                              : chosen
                                ? 'border-crimson-500 bg-crimson-50 dark:bg-crimson-500/15 text-stone-900 dark:text-white font-medium'
                                : 'border-stone-200 dark:border-white/10 text-stone-700 dark:text-stone-300 active:bg-stone-50 dark:active:bg-white/5'
                        }`}
                      >
                        {opt}
                        {showCorrect && <Check className="float-right w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </Card>
            ))}
          </div>

          {result === null && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="w-full mt-6 py-3 rounded-full bg-gradient-to-r from-crimson-500 to-crimson-700 text-white text-sm font-semibold shadow-lg shadow-crimson-500/30 active:scale-95 transition-transform disabled:opacity-50 disabled:shadow-none"
            >
              {submitting
                ? 'Checking…'
                : allAnswered
                  ? 'Submit answers'
                  : `Answer all ${questions.length} questions`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default QuizPage;
