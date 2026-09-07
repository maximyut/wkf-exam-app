import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Flame,
  History,
  Check,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { TestResult } from '../types';
import { playCompleteSound } from '../utils/sound';

interface TestResultsProps {
  result: TestResult;
  soundEnabled: boolean;
  onRetakeTest: () => void;
  onRetakeMistakes: (failedQuestionIds: number[]) => void;
  onNavigateToHistory: () => void;
}

export const TestResults: React.FC<TestResultsProps> = ({
  result,
  soundEnabled,
  onRetakeTest,
  onRetakeMistakes,
  onNavigateToHistory,
}) => {
  const [filter, setFilter] = useState<'all' | 'mistakes' | 'correct'>('all');

  const {
    correctAnswersCount,
    incorrectAnswersCount,
    timeoutAnswersCount,
    scorePercentage,
    passed,
    records,
    totalDurationSeconds,
  } = result;

  const failedRecords = records.filter((r) => !r.isCorrect);
  const hasMistakes = failedRecords.length > 0;

  // Trigger celebration confetti & sound if test is passed (>= 90%)
  useEffect(() => {
    if (passed) {
      if (soundEnabled) {
        playCompleteSound();
      }
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [passed, soundEnabled]);

  const filteredRecords = records.filter((r) => {
    if (filter === 'mistakes') return !r.isCorrect;
    if (filter === 'correct') return r.isCorrect;
    return true;
  });

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    if (mins === 0) return `${remainder} сек`;
    return `${mins} мин ${remainder} сек`;
  };

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 px-3 sm:px-6 space-y-6 sm:space-y-8">
      {/* Hero Score Card */}
      <div
        className={`relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 border shadow-2xl overflow-hidden ${
          passed
            ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30 shadow-rose-950/20'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6 relative z-10">
          {/* Main Score Display */}
          <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto">
            <div
              className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl flex flex-col items-center justify-center font-black shadow-inner border shrink-0 ${
                passed
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              }`}
            >
              <span className="text-2xl sm:text-4xl leading-none">{scorePercentage}%</span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mt-1 opacity-80">
                Результат
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                    passed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {passed ? 'ЭКЗАМЕН СДАН' : 'НЕ СДАНО (≥90%)'}
                </span>
                <span className="text-xs text-slate-400 font-medium truncate">
                  {result.userName}
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl font-extrabold text-white">
                {passed ? 'Отличный результат!' : 'Тест завершен'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1">
                {passed
                  ? 'Вы успешно преодолели официальный судейский барьер WKF (90%).'
                  : 'Для сдачи официального экзамена WKF необходимо набрать минимум 90%.'}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <div className="flex items-center justify-center text-emerald-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">{correctAnswersCount}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Верно</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <div className="flex items-center justify-center text-rose-400 mb-1">
                <XCircle className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">
                {incorrectAnswersCount + timeoutAnswersCount}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Ошибок</div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-center">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-lg font-black text-white">{formatTime(totalDurationSeconds)}</div>
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Время</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onRetakeTest}
            className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Пройти тест снова</span>
          </button>

          {hasMistakes && (
            <button
              type="button"
              onClick={() => onRetakeMistakes(failedRecords.map((r) => r.questionId))}
              className="w-full sm:flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all active:scale-[0.98]"
            >
              <Flame className="w-4 h-4" />
              <span>Работа над ошибками ({failedRecords.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToHistory}
            className="w-full sm:w-auto py-2.5 sm:py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all active:scale-[0.98]"
          >
            <History className="w-4 h-4" />
            <span>История тестов</span>
          </button>
        </div>
      </div>

      {/* Breakdown Header & Filter Tabs */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <span>Сверка ответов и разбор</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {records.length} вопр.
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Сравнение ваших ответов с правильными ответами по базе WKF
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('mistakes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'mistakes'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              Ошибки ({failedRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('correct')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === 'correct'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Верно ({correctAnswersCount})
            </button>
          </div>
        </div>

        {/* List of Questions */}
        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center">
              <p className="text-sm text-slate-400">Нет вопросов в этой категории</p>
            </div>
          ) : (
            filteredRecords.map((record) => {
              const isTimeout = record.userAnswer === 'timeout';
              const userAnsText = isTimeout
                ? 'Время вышло'
                : record.userAnswer === 'true'
                ? 'TRUE (Верно)'
                : 'FALSE (Ложно)';
              const correctAnsText = record.correctAnswer ? 'TRUE (Верно)' : 'FALSE (Ложно)';

              return (
                <div
                  key={record.questionId}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    record.isCorrect
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/15 border-rose-900/40 hover:border-rose-700/60'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        record.isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {record.isCorrect ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <X className="w-4 h-4 stroke-[3]" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          ID #{record.questionId}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            record.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {record.isCorrect ? 'Правильный ответ' : isTimeout ? 'Таймаут (Неверно)' : 'Ошибка'}
                        </span>
                      </div>

                      {/* English question text */}
                      <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug">
                        {record.questionText}
                      </p>

                      {/* Answer badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                            record.isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                          }`}
                        >
                          <span className="text-[10px] text-slate-400 font-normal uppercase">
                            Ваш ответ:
                          </span>
                          <span>{userAnsText}</span>
                        </div>

                        {!record.isCorrect && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/40 border border-emerald-500/50 text-emerald-300">
                            <span className="text-[10px] text-slate-400 font-normal uppercase">
                              Правильный ответ:
                            </span>
                            <span>{correctAnsText}</span>
                          </div>
                        )}

                        <span className="text-[11px] text-slate-500 ml-auto">
                          Время: {record.timeSpentSeconds}с
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
