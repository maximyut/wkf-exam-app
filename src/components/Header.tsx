import React from 'react';
import { User, Volume2, VolumeX, History, Award, Play } from 'lucide-react';
import type { UserProfile } from '../types';

interface HeaderProps {
  activeUser: UserProfile;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenUserModal: () => void;
  onNavigate: (view: 'setup' | 'history') => void;
  currentView: 'setup' | 'test' | 'results' | 'history';
}

export const Header: React.FC<HeaderProps> = ({
  activeUser,
  soundEnabled,
  onToggleSound,
  onOpenUserModal,
  onNavigate,
  currentView,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Brand / Title */}
        <div
          onClick={() => onNavigate('setup')}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/20 group-hover:scale-105 transition-transform">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base md:text-lg text-slate-100 flex items-center gap-1.5 leading-tight">
              <span>WKF Kumite Exam</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                2026.1
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Экзаменационные вопросы для судей и рефери
            </p>
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Navigation buttons */}
          {currentView !== 'test' && (
            <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => onNavigate('setup')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'setup'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Тест</span>
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'history'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">История</span>
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
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
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium max-w-[100px] sm:max-w-[130px] truncate">
              {activeUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
