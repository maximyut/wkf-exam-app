import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Check,
  X,
  Clock,
  Pause,
  Play,
  LogOut,
  AlertCircle,
  HelpCircle,
  Bookmark,
} from 'lucide-react';
import type { Question, TestConfig, QuestionAnswerRecord, AnswerChoice } from '../types';
import { playTickSound, playClickSound, playTimeoutSound } from '../utils/sound';
import { t } from '../i18n/translations';
import { getQuestionText, getExplanationText } from '../data/questions';

interface ActiveTestProps {
  questions: Question[];
  config: TestConfig;
  soundEnabled: boolean;
  initialIndex?: number;
  initialRecords?: QuestionAnswerRecord[];
  initialElapsedSeconds?: number;
  initialIsPaused?: boolean;
  onProgressSave?: (
    currentIndex: number,
    records: QuestionAnswerRecord[],
    elapsedSeconds: number,
    isPaused: boolean
  ) => void;
  onFinishTest: (records: QuestionAnswerRecord[], durationSeconds: number) => void;
  onCancelTest: (discard: boolean) => void;
}

export const ActiveTest: React.FC<ActiveTestProps> = ({
  questions,
  config,
  soundEnabled,
  initialIndex = 0,
  initialRecords = [],
  initialElapsedSeconds = 0,
  initialIsPaused = false,
  onProgressSave,
  onFinishTest,
  onCancelTest,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [records, setRecords] = useState<QuestionAnswerRecord[]>(initialRecords);
  const [isPaused, setIsPaused] = useState<boolean>(initialIsPaused);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // Time remaining on current question (in seconds)
  const timeLimit = config.timeLimitPerQuestion;
  const hasTimeLimit = timeLimit > 0;
  const [timeLeft, setTimeLeft] = useState<number>(hasTimeLimit ? timeLimit : 0);

  // Overall test active elapsed seconds
  const accumulatedSecondsRef = useRef<number>(initialElapsedSeconds);
  const questionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (questionStartTimeRef.current === null) {
      questionStartTimeRef.current = Date.now();
    }
  }, []);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = Math.round((currentIndex / totalQuestions) * 100);

  // Submit an answer
  const handleAnswer = useCallback(
    (choice: AnswerChoice) => {
      const now = Date.now();
      const qStart = questionStartTimeRef.current ?? now;
      const timeSpent = Math.max(1, Math.round((now - qStart) / 1000));

      const isCorrect = choice !== 'timeout' && (choice === 'true') === currentQuestion.answer;

      if (soundEnabled) {
        if (choice === 'timeout') {
          playTimeoutSound();
        } else {
          playClickSound();
        }
      }

      const record: QuestionAnswerRecord = {
        questionId: currentQuestion.id,
        discipline: config.discipline,
        questionText: getQuestionText(currentQuestion, config.language),
        questionTextEn: currentQuestion.questionEn || currentQuestion.question,
        questionTextRu: currentQuestion.questionRu || currentQuestion.question,
        userAnswer: choice,
        correctAnswer: currentQuestion.answer,
        isCorrect,
        timeSpentSeconds: timeSpent,
        ruleArticle: currentQuestion.ruleArticle,
        ruleQuote: currentQuestion.ruleQuote,
        explanation: getExplanationText(currentQuestion, config.language),
        explanationEn: currentQuestion.explanationEn,
        votes: currentQuestion.votes,
      };

      const updatedRecords = [...records, record];
      setRecords(updatedRecords);

      if (currentIndex + 1 < totalQuestions) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setTimeLeft(hasTimeLimit ? timeLimit : 0);
        questionStartTimeRef.current = Date.now();
        onProgressSave?.(nextIndex, updatedRecords, accumulatedSecondsRef.current, false);
      } else {
        // Test complete!
        onFinishTest(updatedRecords, accumulatedSecondsRef.current);
      }
    },
    [currentIndex, currentQuestion, hasTimeLimit, onFinishTest, onProgressSave, records, soundEnabled, timeLimit, totalQuestions, config]
  );

  // Timer countdown & active elapsed duration counter
  useEffect(() => {
    if (isPaused || showExitConfirm) return;

    const timer = setInterval(() => {
      accumulatedSecondsRef.current += 1;

      if (hasTimeLimit) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time expired!
            clearInterval(timer);
            handleAnswer('timeout');
            return 0;
          }

          // Ticking sound during last 5 seconds
          if (prev <= 6 && soundEnabled) {
            playTickSound(prev <= 3 ? 950 : 750);
          }

          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [hasTimeLimit, isPaused, showExitConfirm, handleAnswer, soundEnabled]);

  // Lifecycle listeners: auto-pause on background & save session to localStorage
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (hasTimeLimit) {
          setIsPaused(true);
        }
        onProgressSave?.(currentIndex, records, accumulatedSecondsRef.current, hasTimeLimit ? true : isPaused);
      }
    };

    const handlePageHide = () => {
      onProgressSave?.(currentIndex, records, accumulatedSecondsRef.current, isPaused);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [currentIndex, records, hasTimeLimit, isPaused, onProgressSave]);

  // Keyboard shortcuts (T/1 for True, F/2 for False, Space for Pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (showExitConfirm) {
        if (e.key === 'Escape') setShowExitConfirm(false);
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused((p) => !p);
        return;
      }

      if (isPaused) return;

      const key = e.key.toLowerCase();
      if (key === 't' || key === '1' || key === 'е') {
        e.preventDefault();
        handleAnswer('true');
      } else if (key === 'f' || key === '2' || key === 'а') {
        e.preventDefault();
        handleAnswer('false');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAnswer, isPaused, showExitConfirm]);

  // Timer color & calculation
  const timeFraction = hasTimeLimit ? timeLeft / timeLimit : 1;
  const isUrgent = hasTimeLimit && timeLeft <= 5;
  const isWarning = hasTimeLimit && timeLeft <= 10 && !isUrgent;

  return (
    <div className="max-w-3xl mx-auto py-2 sm:py-4 px-3 sm:px-6">
      {/* Top Test Navigation Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-xl flex items-center justify-between gap-3 sm:gap-4">
        {/* Progress & Counter */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              {t('questionProgress', config.language)}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg sm:text-xl font-black text-white">{currentIndex + 1}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {totalQuestions}</span>
            </div>
          </div>

          <div className="hidden sm:block h-7 w-[1px] bg-slate-800" />

          {/* Question original ID */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>ID #{currentQuestion.id}</span>
          </div>
        </div>

        {/* Timer */}
        {hasTimeLimit ? (
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
              isUrgent
                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse shadow-lg shadow-rose-900/30'
                : isWarning
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-slate-800/80 border-slate-700/70 text-slate-200'
            }`}
          >
            <Clock
              className={`w-4 h-4 ${
                isUrgent ? 'text-rose-400 animate-spin' : isWarning ? 'text-amber-400' : 'text-slate-400'
              }`}
            />
            <div className="flex items-baseline gap-0.5">
              <span className="text-xl font-black tabular-nums">{timeLeft}</span>
              <span className="text-xs font-medium text-slate-400">{t('timeRemaining', config.language)}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <Clock className="w-3.5 h-3.5" />
            <span>{t('unlimitedTime', config.language)}</span>
          </div>
        )}

        {/* Controls: Pause & Exit */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? (config.language === 'ru' ? 'Возобновить (Пробел)' : 'Resume (Space)') : (config.language === 'ru' ? 'Пауза (Пробел)' : 'Pause (Space)')}
            className={`p-2.5 rounded-xl border transition-all ${
              isPaused
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700/80'
            }`}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setShowExitConfirm(true)}
            title={config.language === 'ru' ? 'Завершить тест' : 'Exit test'}
            className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-700 border border-slate-700/80 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar with timer indicator */}
      <div className="relative mb-6">
        <div className="w-full h-2 bg-slate-800/90 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Per-question countdown sub-line */}
        {hasTimeLimit && (
          <div className="w-full h-1 bg-slate-800/40 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full transition-all duration-1000 linear ${
                isUrgent ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
              }`}
              style={{ width: `${timeFraction * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Main Question Card */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-10 shadow-2xl min-h-[220px] sm:min-h-[300px] flex flex-col justify-between overflow-hidden">
        {/* Paused Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-150">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-3 sm:mb-4">
              <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5 sm:mb-2">{t('pauseTitle', config.language)}</h3>
            <p className="text-xs text-slate-400 max-w-sm mb-5 sm:mb-6">
              {t('pauseDesc', config.language)}
            </p>
            <button
              onClick={() => setIsPaused(false)}
              className="px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('resumeTest', config.language)}</span>
            </button>
          </div>
        )}

        {/* Question Header & ID */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-rose-400/90 text-[11px] sm:text-xs">
              {t('questionProgress', config.language)} {currentIndex + 1} {t('of', config.language)} {totalQuestions}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono text-[10px] sm:text-xs">
              WKF #{currentQuestion.id}
            </span>
          </div>

          {/* Question Text */}
          <div className="py-1 sm:py-2">
            <h2 className="text-base sm:text-2xl font-bold text-slate-100 leading-relaxed sm:leading-snug select-none whitespace-pre-line">
              {getQuestionText(currentQuestion, config.language)}
            </h2>
            {config.language === 'ru' && currentQuestion.questionEn && currentQuestion.questionRu && currentQuestion.questionEn !== currentQuestion.questionRu && (
              <p className="text-xs sm:text-sm text-slate-400 font-normal italic mt-2.5 pt-2 border-t border-slate-800/80 leading-relaxed whitespace-pre-line">
                {currentQuestion.questionEn}
              </p>
            )}
          </div>
        </div>

        {/* Answer Buttons (TRUE & FALSE) */}
        <div className="pt-4 sm:pt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* TRUE BUTTON */}
          <button
            type="button"
            disabled={isPaused}
            onClick={() => handleAnswer('true')}
            className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-b from-emerald-950/40 to-slate-900 hover:from-emerald-900/50 hover:to-emerald-950/40 hover:border-emerald-500 active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-lg shadow-emerald-950/30 touch-manipulation"
          >
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-md shrink-0">
                <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
              </div>
              <div className="text-left">
                <div className="text-lg sm:text-2xl font-black text-white tracking-wide">
                  {t('trueBtn', config.language)}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-emerald-400/90">{t('trueSub', config.language)}</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-slate-400 group-hover:border-emerald-500/50 group-hover:text-emerald-300">
              T / 1
            </div>
          </button>

          {/* FALSE BUTTON */}
          <button
            type="button"
            disabled={isPaused}
            onClick={() => handleAnswer('false')}
            className="group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-rose-500/40 bg-gradient-to-b from-rose-950/40 to-slate-900 hover:from-rose-900/50 hover:to-rose-950/40 hover:border-rose-500 active:scale-[0.98] transition-all duration-150 flex items-center justify-between shadow-lg shadow-rose-950/30 touch-manipulation"
          >
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all shadow-md shrink-0">
                <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
              </div>
              <div className="text-left">
                <div className="text-lg sm:text-2xl font-black text-white tracking-wide">
                  {t('falseBtn', config.language)}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold text-rose-400/90">{t('falseSub', config.language)}</div>
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700 text-[11px] font-bold text-slate-400 group-hover:border-rose-500/50 group-hover:text-rose-300">
              F / 2
            </div>
          </button>
        </div>
      </div>

      {/* Keyboard hints footer (hidden on mobile) */}
      <div className="mt-4 hidden sm:flex items-center justify-center gap-4 text-xs text-slate-500 select-none">
        <span>{config.language === 'ru' ? 'Горячие клавиши:' : 'Shortcuts:'}</span>
        <span className="inline-flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">T</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">1</kbd> {t('trueSub', config.language)}
        </span>
        <span className="inline-flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">F</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">2</kbd> {t('falseSub', config.language)}
        </span>
        <span className="inline-flex items-center gap-1 font-mono">
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">Space</kbd> {config.language === 'ru' ? 'Пауза' : 'Pause'}
        </span>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 safe-modal-overlay">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{t('exitConfirmTitle', config.language)}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {t('exitConfirmDesc', config.language)}
              </p>
            </div>
            <div className="space-y-2 pt-1">
              {/* Save & Exit button */}
              <button
                type="button"
                onClick={() => {
                  setShowExitConfirm(false);
                  onProgressSave?.(currentIndex, records, accumulatedSecondsRef.current, true);
                  onCancelTest(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
              >
                <Bookmark className="w-4 h-4" />
                <span>{t('saveAndExit', config.language)}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  {t('cancelExit', config.language)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    onCancelTest(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition-colors"
                >
                  {t('confirmExit', config.language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
