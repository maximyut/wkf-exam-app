import React, { useEffect, useState } from 'react';
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
  Languages,
} from 'lucide-react';
import type { QuestionAnswerRecord, Language } from '../types';
import { t } from '../i18n/translations';

interface ExplanationModalProps {
  record: QuestionAnswerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
  onOpenRules?: (ruleArticle?: string) => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  record,
  isOpen,
  onClose,
  language = 'ru',
  onOpenRules,
}) => {
  const [prevLanguage, setPrevLanguage] = useState(language);
  const [modalLang, setModalLang] = useState<Language>(language);

  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setModalLang(language);
  }

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

  const currentLang = modalLang;
  const isTimeout = record.userAnswer === 'timeout';
  const userAnsText = isTimeout
    ? t('timeoutAnswer', currentLang)
    : record.userAnswer === 'true'
    ? `${t('trueBtn', currentLang)} (${t('trueSub', currentLang)})`
    : `${t('falseBtn', currentLang)} (${t('falseSub', currentLang)})`;

  const correctAnsText = record.correctAnswer
    ? `${t('trueBtn', currentLang)} (${t('trueSub', currentLang)})`
    : `${t('falseBtn', currentLang)} (${t('falseSub', currentLang)})`;

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

  // Active question and explanation text based on modalLang
  const questionDisplayText = currentLang === 'ru'
    ? (record.questionTextRu || record.questionText)
    : (record.questionTextEn || record.questionText);

  const explanationDisplayText = currentLang === 'ru'
    ? (record.explanation || record.explanationEn || '')
    : (record.explanationEn || record.explanation || '');

  const ruleQuoteDisplayText = currentLang === 'ru'
    ? (record.ruleQuoteRu || record.ruleQuote || '')
    : (record.ruleQuote || record.ruleQuoteRu || '');

  const ruleBookTitle = record.discipline === 'kata'
    ? (currentLang === 'ru' ? 'Правила ката и пара-каратэ WKF 2026.0' : 'WKF Kata & Para-Karate Rules 2026.0')
    : (currentLang === 'ru' ? 'Правила кумитэ WKF 2026.01' : 'WKF Kumite Competition Rules 2026.01');

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
              WKF #{record.questionId}
            </span>

            {record.isCorrect ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('filterCorrect', currentLang)}</span>
              </span>
            ) : isTimeout ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('timeoutAnswer', currentLang)}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                <XCircle className="w-3.5 h-3.5" />
                <span>{t('filterMistakes', currentLang)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Modal language toggle */}
            <button
              type="button"
              onClick={() => setModalLang((l) => (l === 'ru' ? 'en' : 'ru'))}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-rose-300 border border-slate-700 transition-colors"
              title="Переключить язык отображения вопроса"
            >
              <Languages className="w-3.5 h-3.5 text-rose-400" />
              <span>{modalLang.toUpperCase()}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={`${t('closeModal', currentLang)} (Esc)`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar">
          {/* Question Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
              <Scale className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('modalQuestionTitle', currentLang)}</span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-100 leading-snug">
              {questionDisplayText}
            </p>
            {modalLang === 'ru' && record.questionTextEn && record.questionTextRu && record.questionTextEn !== record.questionTextRu && (
              <p className="text-xs sm:text-sm text-slate-400 font-normal italic pt-2 border-t border-slate-800/80 leading-relaxed">
                {record.questionTextEn}
              </p>
            )}
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
                  {t('yourAnswer', currentLang)}
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
                  {t('correctAnswer', currentLang)}
                </div>
                <div className="text-sm sm:text-base font-extrabold mt-0.5 text-emerald-300">
                  {correctAnsText}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>
          </div>

          {/* Explanation Section */}
          {explanationDisplayText && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-950/15 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
                <HelpCircle className="w-4 h-4" />
                <span>{t('explanationTitle', currentLang)}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                {explanationDisplayText}
              </p>
            </div>
          )}

          {/* Official Rule Citation Section */}
          {(record.ruleArticle || ruleQuoteDisplayText) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/20 border border-sky-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{ruleBookTitle}</span>
                </div>

                {onOpenRules && record.ruleArticle && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenRules(record.ruleArticle);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[11px] font-bold transition-colors"
                  >
                    <span>{t('openInRules', currentLang)}</span>
                    <BookOpen className="w-3 h-3" />
                  </button>
                )}
              </div>

              {record.ruleArticle && (
                <div className="text-xs sm:text-sm font-bold text-sky-200">
                  {record.ruleArticle}
                </div>
              )}

              {ruleQuoteDisplayText && (
                <blockquote className="pl-3 border-l-2 border-sky-500/60 text-xs sm:text-sm text-slate-300 italic leading-relaxed bg-sky-950/30 py-2 pr-3 rounded-r-xl">
                  «{ruleQuoteDisplayText}»
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
                  <span>{t('aiConsensusTitle', currentLang)}</span>
                </div>

                {hasFullConsensus && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                    <Sparkles className="w-3 h-3" />
                    <span>{currentLang === 'ru' ? 'Консенсус 5 из 5' : 'Consensus 5/5'}</span>
                  </span>
                )}

                {hasSplitVotes && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                    <span>{currentLang === 'ru' ? `Разногласие ${votes.trueCount} : ${votes.falseCount}` : `Disagreement ${votes.trueCount} : ${votes.falseCount}`}</span>
                  </span>
                )}
              </div>

              {/* 5 AI Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {models.map((m) => {
                  const isTrue = m.vote === 'Верно';
                  const voteText = m.vote
                    ? (m.vote === 'Верно' ? (currentLang === 'ru' ? 'Верно' : 'TRUE') : (currentLang === 'ru' ? 'Ложно' : 'FALSE'))
                    : '—';
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
                        {voteText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {hasSplitVotes && (
                <p className="text-[11px] text-slate-400 italic">
                  {currentLang === 'ru'
                    ? '* Официальные правила WKF разрешают данное разногласие: правильный ответ подтверждён первоисточником регламента WKF 2026.'
                    : '* Official WKF rules resolve this dispute: the correct answer is directly verified in the WKF 2026 rulebook.'}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onOpenRules && record.ruleArticle && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRules(record.ruleArticle);
                }}
                className="px-4 py-2 rounded-xl bg-sky-600/30 hover:bg-sky-600/40 text-sky-200 border border-sky-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>{t('openInRules', currentLang)}</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-colors"
          >
            {t('closeModal', currentLang)}
          </button>
        </div>
      </div>
    </div>
  );
};
