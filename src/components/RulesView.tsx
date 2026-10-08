import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  BookOpen,
  Search,
  Download,
  Languages,
  ChevronRight,
  ChevronLeft,
  List,
  Check,
  Copy,
  ArrowUp,
  X,
  Layers,
  FileText,
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

  // Mobile Bottom Sheet state for Table of Contents
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [tocSearchQuery, setTocSearchQuery] = useState('');

  // Display mode: 'all' (continuous scroll) or 'single' (one article at a time)
  const [displayMode, setDisplayMode] = useState<'all' | 'single'>('all');

  // Floating Back to Top button visibility
  const [showBackToTop, setShowBackToTop] = useState(false);

  const contentTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile TOC bottom sheet is open
  useEffect(() => {
    if (isMobileTocOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileTocOpen]);

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

  // Get active book
  const currentBook: RuleBook = useMemo(() => {
    if (selectedBookKey === 'kata') return kataRulesData as unknown as RuleBook;
    if (selectedBookKey === 'para-kata') return paraRulesData as unknown as RuleBook;
    return kumiteRulesData as unknown as RuleBook;
  }, [selectedBookKey]);

  useEffect(() => {
    if (targetRuleQuery) {
      const q = targetRuleQuery.trim();
      const cleaned = q.replace(/[^0-9.]/g, '');

      // Locate parent article so single-article view switches to it automatically
      const matchedArt = currentBook.articles.find((art) =>
        art.sections.some(
          (sec) =>
            sec.id === cleaned ||
            sec.id.includes(cleaned) ||
            (sec.code && sec.code.toLowerCase().includes(q.toLowerCase()))
        )
      );

      const timer = setTimeout(() => {
        if (matchedArt) {
          setSelectedArticleId(matchedArt.id);
        }
        const targetEl = document.getElementById(`rule-sec-${cleaned}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [targetRuleQuery, currentBook]);

  // Active article: user selected if exists in current book, otherwise first article
  const hasSelectedInBook = currentBook.articles.some((a) => a.id === selectedArticleId);
  const activeArticleId = hasSelectedInBook ? selectedArticleId : (currentBook.articles[0]?.id ?? '');

  const currentArticleIndex = useMemo(() => {
    const idx = currentBook.articles.findIndex((a) => a.id === activeArticleId);
    return idx >= 0 ? idx : 0;
  }, [currentBook, activeArticleId]);

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

  // Total matching sections count
  const totalMatchedSections = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    return filteredArticles.reduce((acc, art) => acc + art.sections.length, 0);
  }, [filteredArticles, searchQuery]);

  // Articles for TOC inside bottom sheet / sidebar
  const filteredTocArticles = useMemo(() => {
    if (!tocSearchQuery.trim()) return currentBook.articles;
    const q = tocSearchQuery.toLowerCase().trim();
    return currentBook.articles.filter((art) => {
      const title = ruleLanguage === 'ru' ? art.titleRu : art.titleEn;
      const code = art.code || `Статья ${art.number || ''}`;
      return title.toLowerCase().includes(q) || code.toLowerCase().includes(q);
    });
  }, [currentBook, tocSearchQuery, ruleLanguage]);

  // Determine articles to render based on display mode and search query
  const articlesToRender = useMemo(() => {
    // If active search query, show all matched articles so the user sees all results
    if (searchQuery.trim()) {
      return filteredArticles;
    }
    // If single article mode, show only the currently active article
    if (displayMode === 'single') {
      const activeArt = currentBook.articles[currentArticleIndex];
      return activeArt ? [activeArt] : [];
    }
    // Default 'all' mode: show all articles
    return currentBook.articles;
  }, [searchQuery, displayMode, filteredArticles, currentBook, currentArticleIndex]);

  const handleCopy = (sec: RuleSection) => {
    const text = `${sec.code || sec.id}: ${ruleLanguage === 'ru' ? sec.contentRu : sec.contentEn}`;
    navigator.clipboard.writeText(text);
    setCopiedSectionId(sec.id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleScrollToArticle = (artId: string) => {
    setSelectedArticleId(artId);
    setIsMobileTocOpen(false);
    setTocSearchQuery('');

    if (displayMode === 'single') {
      if (contentTopRef.current) {
        contentTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setTimeout(() => {
        const el = document.getElementById(artId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  // Safe search keyword highlighter
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query || !query.trim() || query.trim().length < 2) return text;
    const q = query.trim();
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    if (parts.length === 1) return text;

    return parts.map((part, index) => {
      if (part.toLowerCase() === q.toLowerCase()) {
        return (
          <mark
            key={index}
            className="bg-amber-400/35 text-amber-100 px-0.5 py-0.2 rounded font-semibold underline decoration-amber-400/60"
          >
            {part}
          </mark>
        );
      }
      return part;
    });
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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <div ref={contentTopRef} className="scroll-mt-20" />

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              {t('rulesTitle', language)}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
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
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            setSelectedBookKey('kumite');
            setSearchQuery('');
            onSelectDiscipline?.('kumite');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'kumite'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('kumite', language)} (2026.01)</span>
        </button>

        <button
          onClick={() => {
            setSelectedBookKey('kata');
            setSearchQuery('');
            onSelectDiscipline?.('kata');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'kata'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('kata', language)} (2026.0)</span>
        </button>

        <button
          onClick={() => {
            setSelectedBookKey('para-kata');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            selectedBookKey === 'para-kata'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <span>{t('paraKata', language)} (2026.0)</span>
        </button>
      </div>

      {/* Controls Bar: View Mode Switcher + Search Results Counter */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* View Mode Toggle: All vs By Article */}
        <div className="inline-flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            type="button"
            onClick={() => setDisplayMode('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              displayMode === 'all'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t('viewModeAll', language)}</span>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('single')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              displayMode === 'single'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('viewModeSingle', language)}</span>
          </button>
        </div>

        {/* Search Results Matches Badge */}
        {searchQuery.trim() && (
          <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            <span>
              {t('matchesFound', language)}:{' '}
              <strong className="text-rose-400 font-mono font-bold">{totalMatchedSections}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('searchRulesPlaceholder', language)}
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-rose-500/60 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all shadow-inner"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
            title="Очистить поиск"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Content Layout: Sidebar Table of Contents (Desktop) + Articles List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Desktop Sidebar: Table of Contents */}
        <aside className="hidden lg:block lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sticky top-20 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 text-rose-400" />
              <span>{t('tocTitle', language)}</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500">
              {currentBook.articles.length}
            </span>
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

        {/* Rules Articles Content */}
        <main className="lg:col-span-8 space-y-5">
          {/* In Single Article Mode (when not searching), show Top Article Switcher */}
          {displayMode === 'single' && !searchQuery.trim() && (
            <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs shadow-md">
              <button
                type="button"
                disabled={currentArticleIndex === 0}
                onClick={() => {
                  if (currentArticleIndex > 0) {
                    handleScrollToArticle(currentBook.articles[currentArticleIndex - 1].id);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-all font-semibold"
              >
                <ChevronLeft className="w-4 h-4 text-rose-400" />
                <span className="hidden sm:inline">{t('prevArticle', language)}</span>
              </button>

              <div className="flex flex-col items-center text-center px-2">
                <span className="font-mono font-bold text-rose-400 text-xs sm:text-sm">
                  {currentArticleIndex + 1} / {currentBook.articles.length}
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate max-w-[180px] sm:max-w-xs">
                  {currentBook.articles[currentArticleIndex]?.code || `Статья ${currentArticleIndex + 1}`}
                </span>
              </div>

              <button
                type="button"
                disabled={currentArticleIndex === currentBook.articles.length - 1}
                onClick={() => {
                  if (currentArticleIndex < currentBook.articles.length - 1) {
                    handleScrollToArticle(currentBook.articles[currentArticleIndex + 1].id);
                  }
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-200 transition-all font-semibold"
              >
                <span className="hidden sm:inline">{t('nextArticle', language)}</span>
                <ChevronRight className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          )}

          {/* Articles list */}
          {articlesToRender.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
              <Search className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">{t('ruleNotFound', language)}</p>
            </div>
          ) : (
            articlesToRender.map((art) => {
              const artTitle = ruleLanguage === 'ru' ? art.titleRu : art.titleEn;

              return (
                <article
                  key={art.id}
                  id={art.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-lg scroll-mt-20"
                >
                  {/* Article Title */}
                  <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
                    <h2 className="text-sm sm:text-lg font-black text-rose-400 tracking-wide uppercase">
                      {highlightText(artTitle, searchQuery)}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60 shrink-0">
                      {art.sections.length} п.
                    </span>
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
                          className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                            isTarget
                              ? 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/40 ring-1 ring-rose-500/50'
                              : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                              {highlightText(sec.code || sec.id, searchQuery)}
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

                          {/* Title if present and distinct from content start */}
                          {(() => {
                            const rawTitle = (
                              ruleLanguage === 'ru' ? (sec.titleRu || sec.title) : (sec.titleEn || sec.title)
                            )?.trim();
                            if (!rawTitle) return null;
                            const cleanContent = content
                              .replace(/^(\d+(?:\.\d+)+(?:[a-z])?|KR\s*\S+|PR\s*\S+|Статья\s*\S+)\s*/i, '')
                              .trim();
                            if (cleanContent.toLowerCase().startsWith(rawTitle.toLowerCase())) return null;

                            return (
                              <h3 className="text-xs sm:text-sm font-bold text-slate-100 mb-2 tracking-wide">
                                {highlightText(rawTitle, searchQuery)}
                              </h3>
                            );
                          })()}

                          {/* Formatted Paragraphs & Lists with search highlighter */}
                          <div className="space-y-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                            {content.split('\n\n').map((paragraph, pIdx) => {
                              const trimmed = paragraph.trim();
                              if (!trimmed) return null;
                              const isListItem = /^(?:\d+[).]|[a-z][).]|[•\-–—]|\([0-9a-z]+\))\s+/i.test(trimmed);

                              if (isListItem) {
                                return (
                                  <div
                                    key={pIdx}
                                    className="flex items-start gap-2.5 pl-3 py-1.5 rounded-lg bg-slate-900/50 border-l-2 border-rose-500/60 text-slate-200"
                                  >
                                    <span className="leading-relaxed">
                                      {highlightText(trimmed, searchQuery)}
                                    </span>
                                  </div>
                                );
                              }

                              return (
                                <p key={pIdx} className="leading-relaxed">
                                  {highlightText(trimmed, searchQuery)}
                                </p>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* In Single Article Mode, show Bottom Next/Prev Article Navigation */}
                  {displayMode === 'single' && !searchQuery.trim() && (
                    <div className="flex items-stretch justify-between gap-2 pt-4 border-t border-slate-800/80">
                      <button
                        type="button"
                        disabled={currentArticleIndex === 0}
                        onClick={() => {
                          if (currentArticleIndex > 0) {
                            handleScrollToArticle(currentBook.articles[currentArticleIndex - 1].id);
                          }
                        }}
                        className="flex-1 flex items-center justify-start gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 disabled:opacity-20 disabled:pointer-events-none text-left transition-all group"
                      >
                        <ChevronLeft className="w-5 h-5 text-rose-400 shrink-0 group-hover:-translate-x-0.5 transition-transform" />
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {t('prevArticle', language)}
                          </div>
                          <div className="text-xs font-semibold text-slate-200 truncate">
                            {currentArticleIndex > 0
                              ? (ruleLanguage === 'ru'
                                  ? currentBook.articles[currentArticleIndex - 1].titleRu
                                  : currentBook.articles[currentArticleIndex - 1].titleEn)
                              : ''}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        disabled={currentArticleIndex === currentBook.articles.length - 1}
                        onClick={() => {
                          if (currentArticleIndex < currentBook.articles.length - 1) {
                            handleScrollToArticle(currentBook.articles[currentArticleIndex + 1].id);
                          }
                        }}
                        className="flex-1 flex items-center justify-end gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 disabled:opacity-20 disabled:pointer-events-none text-right transition-all group"
                      >
                        <div className="min-w-0">
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                            {t('nextArticle', language)}
                          </div>
                          <div className="text-xs font-semibold text-slate-200 truncate">
                            {currentArticleIndex < currentBook.articles.length - 1
                              ? (ruleLanguage === 'ru'
                                  ? currentBook.articles[currentArticleIndex + 1].titleRu
                                  : currentBook.articles[currentArticleIndex + 1].titleEn)
                              : ''}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-rose-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </main>
      </div>

      {/* Mobile Floating Action Buttons (Positioned safely above mobile bottom navigation: bottom-20) */}
      <div className="fixed bottom-20 right-3 z-30 flex items-center gap-2 pointer-events-none lg:hidden">
        {showBackToTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="pointer-events-auto p-2.5 rounded-full bg-slate-900/95 hover:bg-slate-800 text-rose-400 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all active:scale-95 animate-in fade-in duration-200 flex items-center justify-center"
            title={t('backToTop', language)}
            aria-label={t('backToTop', language)}
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsMobileTocOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-2xl shadow-rose-950/60 font-bold text-xs backdrop-blur-md transition-all active:scale-95 animate-in fade-in duration-200"
          aria-label={t('tocTitle', language)}
        >
          <List className="w-4 h-4" />
          <span>{t('tocTitle', language)}</span>
        </button>
      </div>

      {/* Desktop Floating Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="hidden lg:flex fixed bottom-6 right-6 z-30 items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 text-rose-400 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all active:scale-95 text-xs font-bold animate-in fade-in duration-200"
          title={t('backToTop', language)}
        >
          <ArrowUp className="w-4 h-4" />
          <span>{t('backToTop', language)}</span>
        </button>
      )}

      {/* Mobile Bottom Sheet for Table of Contents */}
      {isMobileTocOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileTocOpen(false)}
          />

          {/* Sheet Drawer */}
          <div className="fixed inset-x-0 bottom-0 z-10 max-h-[85vh] bg-slate-900 border-t border-slate-700/80 rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Grab Handle */}
            <div className="pt-3 pb-1 flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-700" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">
                  {t('tocTitle', language)}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {currentBook.articles.length}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileTocOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label={t('closeToc', language)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search inside TOC */}
            <div className="px-5 pt-3 pb-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={tocSearchQuery}
                  onChange={(e) => setTocSearchQuery(e.target.value)}
                  placeholder={t('searchInToc', language)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500/60 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-all"
                />
                {tocSearchQuery && (
                  <button
                    onClick={() => setTocSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Articles List */}
            <div className="px-4 py-2 overflow-y-auto space-y-1.5 pb-8 custom-scrollbar">
              {filteredTocArticles.map((art, idx) => {
                const title = ruleLanguage === 'ru' ? art.titleRu : art.titleEn;
                const isActive = activeArticleId === art.id;

                return (
                  <button
                    key={art.id}
                    onClick={() => handleScrollToArticle(art.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 font-bold'
                        : 'bg-slate-950/60 text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-mono font-semibold text-slate-400 mb-0.5">
                        {art.code || `Статья ${art.number || idx + 1}`}
                      </div>
                      <div className="text-xs truncate font-medium">
                        {title}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                        {art.sections.length}
                      </span>
                      <ChevronRight
                        className={`w-3.5 h-3.5 ${
                          isActive ? 'text-rose-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
