import React, { useState, useMemo } from 'react';
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
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import type { UserProfile, TestResult, QuestionAnswerRecord, Discipline, Language } from '../types';
import {
  getUserHistory,
  getUserStats,
  deleteTestResult,
  clearUserHistory,
} from '../utils/storage';
import { INITIAL_KUMITE_QUESTIONS, INITIAL_KATA_QUESTIONS } from '../data/questions';
import { ExplanationModal } from './ExplanationModal';
import { t } from '../i18n/translations';

interface UserHistoryViewProps {
  activeUser: UserProfile;
  discipline?: Discipline;
  language?: Language;
  onRetakeTest?: () => void;
  onRetakeMistakes: (questionIds: number[]) => void;
  onBackToSetup: () => void;
  onOpenRules?: (ruleArticle?: string) => void;
}

export const UserHistoryView: React.FC<UserHistoryViewProps> = ({
  activeUser,
  discipline,
  language = 'ru',
  onRetakeMistakes,
  onBackToSetup,
  onOpenRules,
}) => {
  const currentLang = language;
  const [selectedDiscipline, setSelectedDiscipline] = useState<'all' | 'kumite' | 'kata'>(
    discipline || 'all'
  );

  const activeFilter = selectedDiscipline === 'all' ? undefined : selectedDiscipline;
  const [historyVersion, setHistoryVersion] = useState(0);

  const history = useMemo(() => {
    void historyVersion;
    return getUserHistory(activeUser.id, activeFilter);
  }, [activeUser.id, activeFilter, historyVersion]);

  const [selectedTest, setSelectedTest] = useState<TestResult | null>(null);
  const [detailFilter, setDetailFilter] = useState<'all' | 'mistakes' | 'correct'>('all');
  const [selectedRecordForModal, setSelectedRecordForModal] = useState<QuestionAnswerRecord | null>(null);

  const stats = useMemo(() => {
    void historyVersion;
    return getUserStats(activeUser.id, activeFilter);
  }, [activeUser.id, activeFilter, historyVersion]);

  const handleOpenExplanation = (record: QuestionAnswerRecord) => {
    if (record.explanation && record.ruleArticle) {
      setSelectedRecordForModal(record);
    } else {
      const qList = record.discipline === 'kata' ? INITIAL_KATA_QUESTIONS : INITIAL_KUMITE_QUESTIONS;
      const found = qList.find((q) => q.id === record.questionId);
      if (found) {
        setSelectedRecordForModal({
          ...record,
          ruleArticle: found.ruleArticle,
          ruleQuote: found.ruleQuote,
          explanation: found.explanation,
          votes: found.votes,
        });
      } else {
        setSelectedRecordForModal(record);
      }
    }
  };

  const refreshHistory = () => {
    setHistoryVersion((v) => v + 1);
  };

  const handleDeleteOne = (testId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(t('deleteTestConfirm', currentLang))) {
      deleteTestResult(testId);
      refreshHistory();
      if (selectedTest?.id === testId) setSelectedTest(null);
    }
  };

  const handleClearAll = () => {
    if (confirm(t('clearAllConfirm', currentLang))) {
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
    if (mins === 0) return `${rem}${t('timeRemaining', currentLang)}`;
    return `${mins}${currentLang === 'ru' ? 'м' : 'm'} ${rem}${t('timeRemaining', currentLang)}`;
  };

  return (
    <div className="max-w-4xl mx-auto py-3 sm:py-6 px-3 sm:px-6 space-y-6 sm:space-y-8">
      {/* Top Header & Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
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
              <span>{t('historyTitle', currentLang)}</span>
            </h1>
            <p className="text-xs text-slate-400">
              {currentLang === 'ru' ? 'Пользователь:' : 'User:'} <span className="text-rose-400 font-bold">{activeUser.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Discipline Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedDiscipline('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDiscipline === 'all'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('allDisciplines', currentLang)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscipline('kumite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDiscipline === 'kumite'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('kumite', currentLang)}
            </button>
            <button
              type="button"
              onClick={() => setSelectedDiscipline('kata')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedDiscipline === 'kata'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('kata', currentLang)}
            </button>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('clearAllHistory', currentLang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* User Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{t('totalTests', currentLang)}</span>
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.totalTests}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">{currentLang === 'ru' ? 'Ответов:' : 'Answered:'} {stats.totalQuestionsAnswered}</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{t('avgAccuracy', currentLang)}</span>
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.overallAccuracy}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">{currentLang === 'ru' ? 'Верных:' : 'Correct:'} {stats.totalCorrect}</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{t('bestScore', currentLang)}</span>
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.bestScore}%</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">{currentLang === 'ru' ? 'Средний:' : 'Average:'} {stats.averageScore}%</p>
        </div>

        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1 sm:mb-2">
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">{t('testsPassed', currentLang)}</span>
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-3xl font-black text-white">{stats.testsPassed}</div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 sm:mt-1">{t('passRate', currentLang)}: {stats.passRate}%</p>
        </div>
      </div>

      {/* Test History List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-rose-500" />
          <span>{currentLang === 'ru' ? 'Пройденные тесты' : 'Completed Tests'} ({history.length})</span>
        </h2>

        {history.length === 0 ? (
          <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('historyEmpty', currentLang)}</h3>
              <p className="text-xs text-slate-400 mt-1">
                {currentLang === 'ru'
                  ? 'В этой категории еще нет пройденных тестов. Запустите первый экзамен!'
                  : 'No test attempts recorded in this category yet. Start your first exam!'}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToSetup}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 transition-all"
            >
              {currentLang === 'ru' ? 'Начать новый тест' : 'Start New Test'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((test) => {
              const failedCount = test.incorrectAnswersCount + test.timeoutAnswersCount;
              const isKata = test.discipline === 'kata' || test.config?.discipline === 'kata';
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
                        {test.passed ? (currentLang === 'ru' ? 'СДАН' : 'PASS') : (currentLang === 'ru' ? 'НЕ СДАН' : 'FAIL')}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-200">
                          {formatDate(test.timestamp)}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {isKata ? t('kata', currentLang) : t('kumite', currentLang)}
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
                        <span>{currentLang === 'ru' ? 'Вопросов:' : 'Questions:'} <strong className="text-slate-200">{test.totalQuestions}</strong></span>
                        <span>{t('correctStat', currentLang)}: <strong className="text-emerald-400">{test.correctAnswersCount}</strong></span>
                        {failedCount > 0 && (
                          <span>{t('mistakesStat', currentLang)}: <strong className="text-rose-400">{failedCount}</strong></span>
                        )}
                        <span>{currentLang === 'ru' ? 'Таймер:' : 'Timer:'} <strong className="text-slate-200">{test.config.timeLimitPerQuestion ? `${test.config.timeLimitPerQuestion}${t('timeRemaining', currentLang)}` : t('noTimer', currentLang)}</strong></span>
                        <span>{t('durationStat', currentLang)}: <strong className="text-slate-200">{formatSeconds(test.totalDurationSeconds)}</strong></span>
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
                      <span>{t('viewExplanation', currentLang)}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteOne(test.id, e)}
                      title={currentLang === 'ru' ? 'Удалить результат' : 'Delete result'}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 safe-modal-overlay">
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
                    {currentLang === 'ru' ? 'Разбор теста от' : 'Review for test of'} {formatDate(selectedTest.timestamp)}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentLang === 'ru'
                      ? `Правильно ${selectedTest.correctAnswersCount} из ${selectedTest.totalQuestions} вопросов`
                      : `Correct ${selectedTest.correctAnswersCount} of ${selectedTest.totalQuestions} questions`}
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
            <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
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
                  {t('filterAll', currentLang)} ({selectedTest.records.length})
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
                  {t('filterMistakes', currentLang)} ({selectedTest.records.filter((r) => !r.isCorrect).length})
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
                  {t('filterCorrect', currentLang)} ({selectedTest.records.filter((r) => r.isCorrect).length})
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
                  <span>{t('retakeMistakes', currentLang)}</span>
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
                    ? t('timeoutAnswer', currentLang)
                    : record.userAnswer === 'true'
                    ? `${t('trueBtn', currentLang)} (${t('trueSub', currentLang)})`
                    : `${t('falseBtn', currentLang)} (${t('falseSub', currentLang)})`;
                  const correctAnsText = record.correctAnswer
                    ? `${t('trueBtn', currentLang)} (${t('trueSub', currentLang)})`
                    : `${t('falseBtn', currentLang)} (${t('falseSub', currentLang)})`;

                  const qText = currentLang === 'ru' && record.questionTextRu
                    ? record.questionTextRu
                    : (record.questionTextEn || record.questionText);

                  return (
                    <div
                      key={record.questionId}
                      onClick={() => handleOpenExplanation(record)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group hover:shadow-lg ${
                        record.isCorrect
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                          : 'bg-rose-950/15 border-rose-900/40 hover:border-rose-600/60 hover:bg-rose-950/25'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-105 ${
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
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                                WKF #{record.questionId}
                              </span>
                              <span
                                className={`text-xs font-bold ${
                                  record.isCorrect ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {record.isCorrect ? t('filterCorrect', currentLang) : isTimeout ? t('timeoutAnswer', currentLang) : t('filterMistakes', currentLang)}
                              </span>
                            </div>

                            <span className="text-[11px] text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5 transition-colors">
                              <span>{t('viewExplanation', currentLang)}</span>
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-slate-100">
                            {qText}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded border font-semibold ${
                                record.isCorrect
                                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                              }`}
                            >
                              {t('yourAnswer', currentLang)}: {userAnsText}
                            </span>

                            {!record.isCorrect && (
                              <span className="px-2 py-0.5 rounded border border-emerald-500/50 bg-emerald-950/40 text-emerald-300 font-semibold">
                                {t('correctAnswer', currentLang)}: {correctAnsText}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenExplanation(record);
                              }}
                              className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                                record.isCorrect
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                              }`}
                            >
                              <BookOpen className="w-3 h-3" />
                              <span>{record.isCorrect ? (currentLang === 'ru' ? 'Правило WKF' : 'WKF Rule') : (currentLang === 'ru' ? 'Статья и пояснение' : 'Article & Review')}</span>
                            </button>
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
                {t('closeModal', currentLang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Explanation Modal */}
      <ExplanationModal
        record={selectedRecordForModal}
        isOpen={!!selectedRecordForModal}
        onClose={() => setSelectedRecordForModal(null)}
        language={currentLang}
        onOpenRules={onOpenRules}
      />
    </div>
  );
};
