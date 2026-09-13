import React, { useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  HelpCircle,
  Scale,
  Sparkles,
  Check,
} from 'lucide-react';
import type { QuestionAnswerRecord } from '../types';

interface ExplanationModalProps {
  record: QuestionAnswerRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  record,
  isOpen,
  onClose,
}) => {
  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const isTimeout = record.userAnswer === 'timeout';
  const userAnsText = isTimeout
    ? 'Время вышло'
    : record.userAnswer === 'true'
    ? 'TRUE (Верно)'
    : 'FALSE (Ложно)';
  const correctAnsText = record.correctAnswer ? 'TRUE (Верно)' : 'FALSE (Ложно)';

  const votes = record.votes;
  const models = [
    { name: 'ChatGPT', vote: votes?.chatgpt },
    { name: 'Claude', vote: votes?.claude },
    { name: 'DeepSeek', vote: votes?.deepseek },
    { name: 'Gemini', vote: votes?.gemini },
    { name: 'Instagram', vote: votes?.instagram },
  ];

  const hasFullConsensus = votes && (votes.trueCount === 5 || votes.falseCount === 5);
  const hasSplitVotes = votes && votes.trueCount !== undefined && votes.falseCount !== undefined && votes.trueCount > 0 && votes.falseCount > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 safe-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              Вопрос #{record.questionId}
            </span>

            {record.isCorrect ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Правильный ответ</span>
              </span>
            ) : isTimeout ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Clock className="w-3.5 h-3.5" />
                <span>Время вышло</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <XCircle className="w-3.5 h-3.5" />
                <span>Ошибка</span>
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar">
          {/* Question Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              <Scale className="w-3.5 h-3.5 text-rose-400" />
              <span>Формулировка вопроса WKF</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              {record.questionText}
            </p>
          </div>

          {/* Answer Badges Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* User answer */}
            <div
              className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-2 ${
                record.isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ваш ответ:
                </div>
                <div className="text-sm sm:text-base font-bold mt-0.5">
                  {userAnsText}
                </div>
              </div>
              <div className="shrink-0">
                {record.isCorrect ? (
                  <Check className="w-5 h-5 text-emerald-400 stroke-[3]" />
                ) : (
                  <X className="w-5 h-5 text-rose-400 stroke-[3]" />
                )}
              </div>
            </div>

            {/* Official correct answer */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/50 text-emerald-300 flex items-center justify-between gap-2">
              <div>
                <div className="text-[10px] font-semibold text-emerald-400/80 uppercase tracking-wider">
                  Правильный ответ по правилам WKF:
                </div>
                <div className="text-sm sm:text-base font-extrabold mt-0.5 text-emerald-300">
                  {correctAnsText}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          </div>

          {/* Explanation Section */}
          {record.explanation && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <HelpCircle className="w-4 h-4" />
                <span>Пояснение и судейская трактовка</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {record.explanation}
              </p>
            </div>
          )}

          {/* Official Rule Citation Section */}
          {(record.ruleArticle || record.ruleQuote) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                <BookOpen className="w-4 h-4" />
                <span>Официальный регламент WKF (Правила кумитэ 2026)</span>
              </div>

              {record.ruleArticle && (
                <div className="text-xs sm:text-sm font-bold text-sky-200">
                  {record.ruleArticle}
                </div>
              )}

              {record.ruleQuote && (
                <blockquote className="pl-3 border-l-2 border-sky-500/60 text-xs sm:text-sm text-slate-300 italic leading-relaxed bg-sky-950/30 py-2 pr-3 rounded-r-xl">
                  «{record.ruleQuote}»
                </blockquote>
              )}
            </div>
          )}

          {/* AI Neural Networks Breakdown Section */}
          {votes && (
            <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-300">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Мнения 5 нейросетей</span>
                </div>

                {hasFullConsensus && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                    <Sparkles className="w-3 h-3" />
                    <span>Консенсус 5 из 5</span>
                  </span>
                )}

                {hasSplitVotes && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                    <span>Разногласие {votes.trueCount} : {votes.falseCount}</span>
                  </span>
                )}
              </div>

              {/* 5 AI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {models.map((m) => {
                  const isTrue = m.vote === 'Верно';
                  return (
                    <div
                      key={m.name}
                      className="p-2 sm:p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col items-center justify-center text-center gap-1"
                    >
                      <span className="text-[10px] text-slate-400 font-semibold truncate w-full">
                        {m.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          isTrue
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {m.vote || '—'}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasSplitVotes && (
                <p className="text-[11px] text-slate-400 italic">
                  * Официальные правила WKF разрешают данное разногласие: правильный ответ подтверждён первоисточником регламента WKF 2026.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
          >
            Закрыть окно
          </button>
        </div>
      </div>
    </div>
  );
};
