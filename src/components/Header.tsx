import React from 'react';
import { User, Volume2, VolumeX, History, Play } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 py-2.5 sm:py-3 shadow-sm">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand / Title */}
        <div
          onClick={() => onNavigate('setup')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group select-none min-w-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-black/20 group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/wkf-logo.png"
              alt="WKF Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base md:text-lg text-slate-100 flex items-center gap-1.5 leading-tight truncate">
              <span>WKF Kumite</span>
              <span className="hidden min-[420px]:inline-block text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                2026.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block truncate">
              Экзаменационные вопросы для судей
            </p>
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Navigation buttons */}
          {currentView !== 'test' && (
            <div className="flex items-center bg-slate-800/90 p-0.5 sm:p-1 rounded-xl border border-slate-700/60">
              <button
                onClick={() => onNavigate('setup')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'setup'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Тест</span>
              </button>
              <button
                onClick={() => onNavigate('history')}
                className={`flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all ${
                  currentView === 'history'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">История</span>
              </button>
            </div>
          )}

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? 'Выключить звук' : 'Включить звук'}
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
            className="flex items-center gap-1.5 sm:gap-2 p-1 sm:pl-2 sm:pr-3 sm:py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-sm"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium max-w-[70px] sm:max-w-[120px] truncate hidden min-[360px]:inline">
              {activeUser.name}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
