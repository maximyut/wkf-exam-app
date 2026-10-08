import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  BookOpen,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Languages
} from 'lucide-react';
import type { Question, Discipline, Language } from '../types';
import { getQuestionText, getExplanationText, getRuleArticleText } from '../data/questions';
import { t } from '../i18n/translations';

interface AnswersViewProps {
  questions: Question[];
  discipline: Discipline;
  language: Language;
  onOpenExplanation: (question: Question) => void;
  onOpenRules: (ruleArticle?: string) => void;
  onToggleLanguage: () => void;
}

export const AnswersView: React.FC<AnswersViewProps> = ({
  questions,
  discipline,
  language,
  onOpenExplanation,
  onOpenRules,
  onToggleLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');

  const filteredQuestions = useMemo(() => {
    let result = questions;

    if (statusFilter === 'true') {
      result = result.filter((q) => q.answer === true);
    } else if (statusFilter === 'false') {
      result = result.filter((q) => q.answer === false);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.trim().toLowerCase();
      result = result.filter((q) => {
        const textCurrent = getQuestionText(q, language).toLowerCase();
        const textAlt = (language === 'ru' ? (q.questionEn || '') : (q.questionRu || '')).toLowerCase();
        const expText = getExplanationText(q, language).toLowerCase();
        const ruleText = (q.ruleArticle || '').toLowerCase();
        const idStr = String(q.id);

        return (
          textCurrent.includes(qLower) ||
          textAlt.includes(qLower) ||
          expText.includes(qLower) ||
          ruleText.includes(qLower) ||
          idStr === qLower ||
          `#${idStr}` === qLower
        );
      });
    }

    return result;
  }, [questions, searchQuery, statusFilter, language]);

  const trueCount = useMemo(() => questions.filter((q) => q.answer === true).length, [questions]);
  const falseCount = useMemo(() => questions.filter((q) => q.answer === false).length, [questions]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-in fade-in duration-300">
      {/* Title & Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('answersTitle', language)}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono">
              {discipline === 'kata' ? 'KATA (132)' : 'KUMITE (246)'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('answersSubtitle', language)}
          </p>
        </div>

        {/* Quick Language switch in header */}
        <button
          onClick={onToggleLanguage}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
          title="Сменить язык вопросов / Switch language"
        >
          <Languages className="w-3.5 h-3.5 text-rose-400" />
          <span>{language === 'ru' ? 'Язык: Русский' : 'Language: English'}</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search Input */}
        <div className="relative md:col-span-7">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder', language)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-rose-500/60 focus:bg-slate-900/90 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 md:col-span-5 justify-between sm:justify-start">
          <button
            onClick={() => setStatusFilter('all')}
            className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('allFilter', language)} ({questions.length})
          </button>
          <button
            onClick={() => setStatusFilter('true')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'true'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>TRUE ({trueCount})</span>
          </button>
          <button
            onClick={() => setStatusFilter('false')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === 'false'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>FALSE ({falseCount})</span>
          </button>
        </div>
      </div>

      {/* Result counter indicator */}
      <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
        <span>
          {t('foundCount', language)} <strong className="text-white font-bold">{filteredQuestions.length}</strong>
        </span>
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            className="text-rose-400 hover:underline"
          >
            Сбросить фильтры
          </button>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-3.5">
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
            <HelpCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300 mb-1">Ничего не найдено</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Попробуйте изменить поисковый запрос или выбрать другой статус ответа.
            </p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isTrue = q.answer === true;
            const qText = getQuestionText(q, language);
            const expText = getExplanationText(q, language);
            const ruleText = getRuleArticleText(q, language);

            return (
              <div
                key={q.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md group hover:shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left: Number and Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80">
                      #{q.id}
                    </span>

                    {/* True / False Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black border shadow-sm ${
                        isTrue
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      {isTrue ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>TRUE (ВЕРНО)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>FALSE (ЛОЖНО)</span>
                        </>
                      )}
                    </span>

                    {/* Rule citation badge */}
                    {ruleText && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-800/50 flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-sky-400" />
                        <span className="truncate max-w-[200px]">{ruleText}</span>
                      </span>
                    )}
                  </div>

                  {/* Right Actions: Deep link into rules and explanation modal */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {ruleText && (
                      <button
                        type="button"
                        onClick={() => onOpenRules(q.ruleArticle)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 hover:text-sky-300 border border-sky-500/30 text-xs font-medium transition-all"
                        title={t('openInRules', language)}
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="hidden sm:inline">{t('openInRules', language)}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenExplanation(q)}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white border border-slate-700 hover:border-rose-500 text-xs font-semibold transition-all shadow-sm"
                    >
                      <span>{t('viewExplanation', language)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mt-3">
                  <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-snug">
                    {qText}
                  </h3>
                </div>

                {/* Explanation Snippet */}
                {expText && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs sm:text-[13px] text-slate-300 leading-relaxed font-normal">
                    <span className="font-semibold text-amber-400/90 mr-1.5">Пояснение:</span>
                    {expText}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
