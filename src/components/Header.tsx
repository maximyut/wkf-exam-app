import React from 'react';
import { User, Volume2, VolumeX, History, Play, BookOpen, HelpCircle, Languages } from 'lucide-react';
import type { UserProfile, Discipline, Language, ViewMode } from '../types';
import { t } from '../i18n/translations';

interface HeaderProps {
  activeUser: UserProfile;
  discipline: Discipline;
  language: Language;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onSelectDiscipline: (d: Discipline) => void;
  onToggleLanguage: () => void;
  onOpenUserModal: () => void;
  onNavigate: (view: ViewMode) => void;
  currentView: ViewMode;
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  discipline,
  language,
  soundEnabled,
  onToggleSound,
  onSelectDiscipline,
  onToggleLanguage,
  onOpenUserModal,
  onNavigate,
  currentView,
}) => {
  const isKata = discipline === 'kata';

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-sm safe-header">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 px-2 sm:px-4 py-2">
        {/* Brand / Title & Discipline Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            onClick={() => onNavigate('setup')}
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform shrink-0">
              <img
                src="/wkf-logo.png"
                alt="WKF Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0 hidden md:block">
              <div className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-1.5 leading-tight">
                <span>{isKata ? 'WKF Kata' : 'WKF Kumite'}</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {isKata ? '2026.0' : '2026.01'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                {t('refereeSubtitle', language)}
              </p>
            </div>
          </div>

          {/* Discipline Selector Pills (Кумитэ / Ката) */}
          {currentView !== 'test' && (
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-slate-700/80">
              <button
                type="button"
                onClick={() => onSelectDiscipline('kumite')}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  discipline === 'kumite'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('kumite', language)}
              </button>
              <button
                type="button"
                onClick={() => onSelectDiscipline('kata')}
                className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  discipline === 'kata'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t('kata', language)}
              </button>
            </div>
          )}
        </div>

        {/* Center / Right: Navigation buttons */}
        {currentView !== 'test' && (
          <nav className="flex items-center bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700/60 overflow-x-auto">
            <button
              onClick={() => onNavigate('setup')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                currentView === 'setup'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{t('testTab', language)}</span>
            </button>

            <button
              onClick={() => onNavigate('answers')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                currentView === 'answers'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{t('answersTab', language)}</span>
            </button>

            <button
              onClick={() => onNavigate('rules')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                currentView === 'rules'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{t('rulesTab', language)}</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                currentView === 'history'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>{t('historyTab', language)}</span>
            </button>
          </nav>
        )}

        {/* Right Actions: Language Toggle, Sound, User */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Toggle (RU / EN) */}
          <button
            onClick={onToggleLanguage}
            title={language === 'ru' ? 'Switch to English' : 'Переключить на русский'}
            className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-black text-rose-300 hover:text-white transition-all shadow-sm"
          >
            <Languages className="w-3.5 h-3.5 text-rose-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? t('soundOn', language) : t('soundOff', language)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* User Profile Switcher */}
          <button
            onClick={onOpenUserModal}
            className="flex items-center gap-1.5 p-1 sm:pl-2 sm:pr-3 sm:py-1 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium max-w-[70px] sm:max-w-[100px] truncate hidden min-[480px]:inline">
              {activeUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

