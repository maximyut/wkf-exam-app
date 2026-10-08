import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Languages,
  ChevronRight,
  List,
  Check,
  Copy,
} from 'lucide-react';
import type { Discipline, Language, RuleBook, RuleArticle, RuleSection } from '../types';
import kataRulesData from '../data/rules/kata-rules.json';
import paraRulesData from '../data/rules/para-rules.json';
import kumiteRulesData from '../data/rules/kumite-rules.json';
import { t } from '../i18n/translations';

interface RulesViewProps {
  discipline: Discipline;
  language: Language;
  targetRuleQuery?: string | null;
  onSelectDiscipline?: (d: Discipline) => void;
  onToggleLanguage?: () => void;
}

export const RulesView: React.FC<RulesViewProps> = ({
  discipline,
  language,
  targetRuleQuery,
  onSelectDiscipline,
  onToggleLanguage,
}) => {
  // Available rulebooks
  const [selectedBookKey, setSelectedBookKey] = useState<'kata' | 'para-kata' | 'kumite'>(
    discipline === 'kata' ? 'kata' : 'kumite'
  );

  const [prevLanguage, setPrevLanguage] = useState(language);
  const [ruleLanguage, setRuleLanguage] = useState<Language>(language);

  if (prevLanguage !== language) {
    setPrevLanguage(language);
    setRuleLanguage(language);
  }

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);

  // Handle deep-linking from targetRuleQuery (e.g. "KR 2.2.1a" or "PR 4.6.11" or "Статья 8.5")
  const [prevTargetQuery, setPrevTargetQuery] = useState(targetRuleQuery);

  if (targetRuleQuery && targetRuleQuery !== prevTargetQuery) {
    setPrevTargetQuery(targetRuleQuery);
    const q = targetRuleQuery.trim();
    if (q.startsWith('PR')) {
      setSelectedBookKey('para-kata');
    } else if (q.startsWith('KR')) {
      setSelectedBookKey('kata');
    } else {
      setSelectedBookKey('kumite');
    }
    setSearchQuery(q);
  }

  useEffect(() => {
    if (targetRuleQuery) {
      const q = targetRuleQuery.trim();
      const timer = setTimeout(() => {
        const cleaned = q.replace(/[^0-9.]/g, '');
        const targetEl = document.getElementById(`rule-sec-${cleaned}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [targetRuleQuery]);

  // Get active book
  const currentBook: RuleBook = useMemo(() => {
    if (selectedBookKey === 'kata') return kataRulesData as unknown as RuleBook;
    if (selectedBookKey === 'para-kata') return paraRulesData as unknown as RuleBook;
    return kumiteRulesData as unknown as RuleBook;
  }, [selectedBookKey]);

  // Active article: user selected if exists in current book, otherwise first article
  const hasSelectedInBook = currentBook.articles.some((a) => a.id === selectedArticleId);
  const activeArticleId = hasSelectedInBook ? selectedArticleId : (currentBook.articles[0]?.id ?? '');

  // Search filtering
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) {
      return currentBook.articles;
    }

    const q = searchQuery.toLowerCase().trim();
    return currentBook.articles
      .map((art) => {
        const titleMatch =
          art.titleEn.toLowerCase().includes(q) || art.titleRu.toLowerCase().includes(q);

        const matchedSections = art.sections.filter((sec) => {
          const content = (ruleLanguage === 'ru' ? sec.contentRu : sec.contentEn).toLowerCase();
          const altContent = (ruleLanguage === 'ru' ? sec.contentEn : sec.contentRu).toLowerCase();
          const idMatch = sec.id.toLowerCase().includes(q);
          const codeMatch = (sec.code || '').toLowerCase().includes(q);

          return titleMatch || content.includes(q) || altContent.includes(q) || idMatch || codeMatch;
        });

        if (titleMatch || matchedSections.length > 0) {
          return {
            ...art,
            sections: matchedSections.length > 0 ? matchedSections : art.sections,
          };
        }
        return null;
      })
      .filter((art): art is RuleArticle => art !== null);
  }, [currentBook, searchQuery, ruleLanguage]);

  const handleCopy = (sec: RuleSection) => {
    const text = `${sec.code || sec.id}: ${ruleLanguage === 'ru' ? sec.contentRu : sec.contentEn}`;
    navigator.clipboard.writeText(text);
    setCopiedSectionId(sec.id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleScrollToArticle = (artId: string) => {
    setSelectedArticleId(artId);
    setIsMobileTocOpen(false);
    const el = document.getElementById(artId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // PDF Download link
  const pdfUrl = useMemo(() => {
    if (selectedBookKey === 'kata') {
      return ruleLanguage === 'ru' ? '/docs/wkf-kata-rules-2026-ru.pdf' : '/docs/wkf-kata-rules-2026-en.pdf';
    }
    if (selectedBookKey === 'para-kata') {
      return '/docs/wkf-para-karate-rules-2026-en.pdf';
    }
    return ruleLanguage === 'ru' ? '/docs/wkf-kumite-rules-2026-ru.pdf' : '/docs/wkf-kumite-rules-2026-en.pdf';
  }, [selectedBookKey, ruleLanguage]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-5 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('rulesTitle', language)}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('rulesSubtitle', language)}
          </p>
        </div>

        {/* Action Controls: PDF download & Language Toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('openPdfDoc', language)}</span>
          </a>

          <button
            onClick={() => {
              setRuleLanguage(ruleLanguage === 'ru' ? 'en' : 'ru');
              onToggleLanguage?.();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <Languages className="w-3.5 h-3.5 text-indigo-400" />
            <span>{ruleLanguage === 'ru' ? 'Текст: Русский' : 'Text: English'}</span>
          </button>
        </div>
      </div>

      {/* Book Tabs Selector */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
        <button
          onClick={() => {
            setSelectedBookKey('kumite');
            setSearchQuery('');
            onSelectDiscipline?.('kumite');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'kumite'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('kumite', language)} (Kumite 2026.01)</span>
        </button>

        <button
          onClick={() => {
            setSelectedBookKey('kata');
            setSearchQuery('');
            onSelectDiscipline?.('kata');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'kata'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('kata', language)} (Kata 2026.0)</span>
        </button>

        <button
          onClick={() => {
            setSelectedBookKey('para-kata');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'para-kata'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('paraKata', language)} (Para-Karate 2026.0)</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchRulesPlaceholder', language)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-rose-500/60 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner"
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

      {/* Main Content Layout: Sidebar Table of Contents + Articles List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar: Table of Contents */}
        <aside className="hidden lg:block lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sticky top-20 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <List className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('tocTitle', language)}</span>
          </div>

          <nav className="space-y-1">
            {currentBook.articles.map((art) => {
              const title = ruleLanguage === 'ru' ? art.titleRu : art.titleEn;
              const isActive = activeArticleId === art.id;

              return (
                <button
                  key={art.id}
                  onClick={() => handleScrollToArticle(art.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="truncate pr-2">{title}</span>
                  <ChevronRight
                    className={`w-3 h-3 shrink-0 transition-transform ${
                      isActive ? 'text-rose-400 translate-x-0.5' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile TOC Drawer button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200"
          >
            <div className="flex items-center gap-2">
              <List className="w-4 h-4 text-rose-400" />
              <span>{t('tocTitle', language)}</span>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${
                isMobileTocOpen ? 'rotate-90' : ''
              }`}
            />
          </button>

          {isMobileTocOpen && (
            <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 max-h-60 overflow-y-auto">
              {currentBook.articles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => handleScrollToArticle(art.id)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 hover:text-white truncate"
                >
                  {ruleLanguage === 'ru' ? art.titleRu : art.titleEn}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rules Articles Content */}
        <main className="lg:col-span-8 space-y-6">
          {filteredArticles.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">{t('ruleNotFound', language)}</p>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const artTitle = ruleLanguage === 'ru' ? art.titleRu : art.titleEn;

              return (
                <article
                  key={art.id}
                  id={art.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-lg scroll-mt-20"
                >
                  {/* Article Title */}
                  <div className="border-b border-slate-800 pb-3">
                    <h2 className="text-base sm:text-lg font-black text-rose-400 tracking-wide uppercase">
                      {artTitle}
                    </h2>
                  </div>

                  {/* Sections List */}
                  <div className="space-y-4">
                    {art.sections.map((sec) => {
                      const content = ruleLanguage === 'ru' ? sec.contentRu : sec.contentEn;
                      const isTarget =
                        targetRuleQuery &&
                        (sec.code?.toLowerCase().includes(targetRuleQuery.toLowerCase()) ||
                          sec.id.includes(targetRuleQuery));
                      const isCopied = copiedSectionId === sec.id;

                      return (
                        <div
                          key={sec.id}
                          id={`rule-sec-${sec.id}`}
                          className={`p-4 rounded-xl border transition-all ${
                            isTarget
                              ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                              {sec.code || sec.id}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleCopy(sec)}
                              className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors px-2 py-0.5 rounded hover:bg-slate-800"
                              title="Копировать пункт правил"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-400">Скопировано</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Копировать</span>
                                </>
                              )}
                            </button>
                          </div>

                          {sec.title && (
                            <h3 className="text-xs sm:text-sm font-bold text-slate-200 mb-1.5">
                              {ruleLanguage === 'ru' ? (sec.titleRu || sec.title) : sec.title}
                            </h3>
                          )}

                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                            {content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
};
