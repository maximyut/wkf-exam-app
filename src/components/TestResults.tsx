import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Flame,
  ChevronDown,
  ChevronUp,
  History,
  Check,
  X,
  Bot,
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
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

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

  const toggleExpand = (questionId: number) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

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
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8">
      {/* Hero Score Card */}
      <div
        className={`relative rounded-3xl p-6 sm:p-8 border shadow-2xl overflow-hidden ${
          passed
            ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/30 shadow-rose-950/20'
        }`}
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Main Score Display */}
          <div className="flex items-center gap-5 sm:gap-6">
            <div
              className={`w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex flex-col items-center justify-center font-black shadow-inner border ${
                passed
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-400'
              }`}
            >
              <span className="text-3xl sm:text-4xl leading-none">{scorePercentage}%</span>
              <span className="text-[11px] font-bold uppercase tracking-wider mt-1 opacity-80">
                Результат
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    passed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {passed ? 'ЭКЗАМЕН СДАН' : 'НЕ СДАНО (требуется 90%)'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {result.userName}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                {passed ? 'Отличный результат!' : 'Тест завершен'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRetakeTest}
            className="flex-1 min-w-[150px] py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Пройти тест снова</span>
          </button>

          {hasMistakes && (
            <button
              type="button"
              onClick={() => onRetakeMistakes(failedRecords.map((r) => r.questionId))}
              className="flex-1 min-w-[200px] py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-950/40 transition-all"
            >
              <Flame className="w-4 h-4" />
              <span>Работа над ошибками ({failedRecords.length})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNavigateToHistory}
            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">История тестов</span>
          </button>
        </div>
      </div>

      {/* Breakdown Header & Filter Tabs */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Сверка ответов и разбор</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {records.length} вопросов
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Нажмите на вопрос для просмотра мнений нейросетей (ChatGPT, Claude, DeepSeek, Gemini, Instagram)
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl self-start sm:self-auto">
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
              const isExpanded = expandedQuestions.has(record.questionId);
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
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    record.isCorrect
                      ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/10 border-rose-900/40 hover:border-rose-700/60'
                  }`}
                >
                  {/* Question row */}
                  <div
                    onClick={() => toggleExpand(record.questionId)}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
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

                      <div className="min-w-0 space-y-2">
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

                    {/* Expand icon */}
                    <button
                      type="button"
                      className="p-1 text-slate-500 hover:text-slate-300 shrink-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Expanded Source Votes Breakdown */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800 bg-slate-950/50 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span>Голоса источников (по большинству):</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {/* ChatGPT */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-500">ChatGPT</p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              record.votes.chatgpt === 'Верно'
                                ? 'text-emerald-400'
                                : record.votes.chatgpt === 'Ложно'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {record.votes.chatgpt}
                          </p>
                        </div>

                        {/* Claude */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Claude</p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              record.votes.claude === 'Верно'
                                ? 'text-emerald-400'
                                : record.votes.claude === 'Ложно'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {record.votes.claude}
                          </p>
                        </div>

                        {/* DeepSeek */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-500">DeepSeek</p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              record.votes.deepseek === 'Верно'
                                ? 'text-emerald-400'
                                : record.votes.deepseek === 'Ложно'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {record.votes.deepseek}
                          </p>
                        </div>

                        {/* Gemini */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                          <p className="text-[10px] uppercase font-bold text-slate-500">Gemini</p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              record.votes.gemini === 'Верно'
                                ? 'text-emerald-400'
                                : record.votes.gemini === 'Ложно'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {record.votes.gemini}
                          </p>
                        </div>

                        {/* Instagram key */}
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-bold text-amber-400">Instagram</p>
                          <p
                            className={`text-xs font-bold mt-0.5 ${
                              record.votes.instagram === 'Верно'
                                ? 'text-emerald-400'
                                : record.votes.instagram === 'Ложно'
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {record.votes.instagram}
                          </p>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Голосов «Верно»: <span className="text-emerald-400 font-bold">{record.votes.trueCount}</span> | Голосов «Ложно»: <span className="text-rose-400 font-bold">{record.votes.falseCount}</span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
