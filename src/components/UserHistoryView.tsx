import React, { useState } from 'react';
import {
  History,
  Trophy,
  BarChart3,
  CheckCircle2,
  Award,
  Trash2,
  Eye,
  Flame,
  ArrowLeft,
  X,
  Check,
} from 'lucide-react';
import type { UserProfile, TestResult } from '../types';
import {
  getUserHistory,
  getUserStats,
  deleteTestResult,
  clearUserHistory,
} from '../utils/storage';

interface UserHistoryViewProps {
  activeUser: UserProfile;
  onRetakeTest?: () => void;
  onRetakeMistakes: (questionIds: number[]) => void;
  onBackToSetup: () => void;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  activeUser,
  onRetakeMistakes,
  onBackToSetup,
}) => {
  const [history, setHistory] = useState<TestResult[]>(getUserHistory(activeUser.id));
  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [detailFilter, setDetailFilter] = useState<'all' | 'mistakes' | 'correct'>('all');

  const stats = getUserStats(activeUser.id);

  const refreshHistory = () => {
    setHistory(getUserHistory(activeUser.id));
  };

  const handleDeleteOne = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Удалить этот результат теста из истории?')) {
      deleteTestResult(testId);
      refreshHistory();
      if (selectedTest?.id === testId) setSelectedTest(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Вы действительно хотите очистить всю историю для этого пользователя?')) {
      clearUserHistory(activeUser.id);
      refreshHistory();
      setSelectedTest(null);
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSeconds = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    if (mins === 0) return `${rem}с`;
    return `${mins}м ${rem}с`;
  };

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 px-3 sm:px-6 space-y-6 sm:space-y-8">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onBackToSetup}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              <span>История и статистика</span>
            </h1>
            <p className="text-xs text-slate-400">
              Пользователь: <span className="text-rose-400 font-bold">{activeUser.name}</span>
            </p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Очистить историю</span>
          </button>
        )}
      </div>

      {/* User Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Всего тестов</span>
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.totalTests}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Ответов: {stats.totalQuestionsAnswered}</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Общая точность</span>
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.overallAccuracy}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Верных: {stats.totalCorrect}</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Лучший балл</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.bestScore}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Средний: {stats.averageScore}%</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Сдано тестов</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.testsPassed}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">Успешность: {stats.passRate}%</p>
        </div>
      </div>

      {/* Test History List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-rose-500" />
          <span>Пройденные тесты ({history.length})</span>
        </h2>

        {history.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">История пуста</h3>
              <p className="text-xs text-slate-400 mt-1">
                Этот пользователь еще не проходил тесты. Запустите первый экзамен!
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToSetup}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all"
            >
              Начать новый тест
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((test) => {
              const failedCount = test.incorrectAnswersCount + test.timeoutAnswersCount;
              return (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 cursor-pointer transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {/* Score Circle */}
                    <div
                      className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black shrink-0 border ${
                        test.passed
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                      }`}
                    >
                      <span className="text-lg leading-none">{test.scorePercentage}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-tight opacity-70">
                        {test.passed ? 'СДАН' : 'НЕ СДАН'}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                          {formatDate(test.timestamp)}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            test.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {test.passed ? '≥ 90%' : '< 90%'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span>Вопросов: <strong className="text-slate-200">{test.totalQuestions}</strong></span>
                        <span>Верно: <strong className="text-emerald-400">{test.correctAnswersCount}</strong></span>
                        {failedCount > 0 && (
                          <span>Ошибок: <strong className="text-rose-400">{failedCount}</strong></span>
                        )}
                        <span>Таймер: <strong className="text-slate-200">{test.config.timeLimitPerQuestion ? `${test.config.timeLimitPerQuestion}с` : 'без таймера'}</strong></span>
                        <span>Время: <strong className="text-slate-200">{formatSeconds(test.totalDurationSeconds)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTest(test);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 group-hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Разбор</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteOne(test.id, e)}
                      title="Удалить результат"
                      className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Detailed Review of a past test */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    selectedTest.passed
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {selectedTest.scorePercentage}%
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Разбор теста от {formatDate(selectedTest.timestamp)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Правильно {selectedTest.correctAnswersCount} из {selectedTest.totalQuestions} вопросов
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter bar inside modal */}
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDetailFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    detailFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Все ({selectedTest.records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailFilter('mistakes')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    detailFilter === 'mistakes'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  Ошибки ({selectedTest.records.filter((r) => !r.isCorrect).length})
                </button>
                <button
                  type="button"
                  onClick={() => setDetailFilter('correct')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                    detailFilter === 'correct'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  Верно ({selectedTest.records.filter((r) => r.isCorrect).length})
                </button>
              </div>

              {selectedTest.records.some((r) => !r.isCorrect) && (
                <button
                  type="button"
                  onClick={() => {
                    const mistakes = selectedTest.records
                      .filter((r) => !r.isCorrect)
                      .map((r) => r.questionId);
                    setSelectedTest(null);
                    onRetakeMistakes(mistakes);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Пройти эти ошибки</span>
                </button>
              )}
            </div>

            {/* Questions list */}
            <div className="p-6 overflow-y-auto space-y-3">
              {selectedTest.records
                .filter((r) => {
                  if (detailFilter === 'mistakes') return !r.isCorrect;
                  if (detailFilter === 'correct') return r.isCorrect;
                  return true;
                })
                .map((record) => {
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
                      className={`p-4 rounded-2xl border ${
                        record.isCorrect
                          ? 'bg-slate-900 border-slate-800'
                          : 'bg-rose-950/15 border-rose-900/40'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
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

                        <div className="space-y-2 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              ID #{record.questionId}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                record.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {record.isCorrect ? 'Верно' : isTimeout ? 'Таймаут' : 'Неверно'}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-100">
                            {record.questionText}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded border font-semibold ${
                                record.isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              Ваш ответ: {userAnsText}
                            </span>

                            {!record.isCorrect && (
                              <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-semibold">
                                Правильный: {correctAnsText}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
