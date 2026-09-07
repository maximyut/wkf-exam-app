import React, { useState } from 'react';
import {
  Play,
  Clock,
  HelpCircle,
  Shuffle,
  Flame,
  Sparkles,
} from 'lucide-react';
import type { TestConfig, UserProfile } from '../types';
import { TOTAL_AVAILABLE_QUESTIONS } from '../data/questions';
import { getUserMistakeQuestionIds } from '../utils/storage';

interface TestSetupProps {
  activeUser: UserProfile;
  onStartTest: (config: TestConfig) => void;
  onOpenUserModal: () => void;
}

export const TestSetupModal: React.FC<TestSetupProps> = ({
  activeUser,
  onStartTest,
  onOpenUserModal,
}) => {
  const userMistakes = getUserMistakeQuestionIds(activeUser.id);
  const hasMistakes = userMistakes.length > 0;

  // Question count state
  const [questionCount, setQuestionCount] = useState<number>(70);
  const [customQuestionCount, setCustomQuestionCount] = useState<string>('');
  const [isCustomCount, setIsCustomCount] = useState<boolean>(false);

  // Time limit per question state (seconds, 0 = no limit)
  const [timeLimit, setTimeLimit] = useState<number>(20);
  const [customTimeLimit, setCustomTimeLimit] = useState<string>('');
  const [isCustomTime, setIsCustomTime] = useState<boolean>(false);

  // Additional options
  const [onlyMistakes, setOnlyMistakes] = useState<boolean>(false);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);

  // Preset buttons
  const countPresets = [20, 50, 70, 100, TOTAL_AVAILABLE_QUESTIONS];
  const timePresets = [
    { label: '10 сек', val: 10 },
    { label: '15 сек', val: 15 },
    { label: '20 сек', val: 20 },
    { label: '30 сек', val: 30 },
    { label: '60 сек', val: 60 },
    { label: 'Без таймера', val: 0 },
  ];

  const maxQuestions = onlyMistakes ? userMistakes.length : TOTAL_AVAILABLE_QUESTIONS;

  const handlePresetCount = (cnt: number) => {
    setIsCustomCount(false);
    setQuestionCount(Math.min(cnt, maxQuestions));
  };

  const handlePresetTime = (sec: number) => {
    setIsCustomTime(false);
    setTimeLimit(sec);
  };

  const handleStart = () => {
    let finalCount = isCustomCount ? parseInt(customQuestionCount, 10) || 70 : questionCount;
    if (finalCount < 1) finalCount = 1;
    if (finalCount > maxQuestions) finalCount = maxQuestions;

    let finalTime = isCustomTime ? parseInt(customTimeLimit, 10) || 20 : timeLimit;
    if (finalTime < 0) finalTime = 0;

    onStartTest({
      questionCount: finalCount,
      timeLimitPerQuestion: finalTime,
      onlyMistakesMode: onlyMistakes,
      shuffleQuestions: shuffleQuestions,
      soundEnabled: true,
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-4 px-4 sm:px-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Welcome & User banner */}
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WKF Kumite Referees & Judges</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Тестирование судей WKF
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              База 246 официальных экзаменационных вопросов с мгновенной проверкой
            </p>
          </div>

          <div
            onClick={onOpenUserModal}
            className="flex items-center gap-3 p-2.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-2xl cursor-pointer transition-all self-start sm:self-auto group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
              {activeUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                Текущий пользователь
              </p>
              <p className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                {activeUser.name}
              </p>
            </div>
          </div>
        </div>

        {/* Section 1: Number of Questions */}
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              Количество вопросов
            </label>
            <span className="text-xs text-slate-400">
              По умолчанию: <span className="text-rose-400 font-semibold">70</span> (из {maxQuestions})
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {countPresets.map((cnt) => {
              const isSelected = !isCustomCount && questionCount === cnt;
              const isDisabled = cnt > maxQuestions;
              return (
                <button
                  key={cnt}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handlePresetCount(cnt)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/30 scale-[1.02]'
                      : isDisabled
                      ? 'bg-slate-800/30 text-slate-600 border-slate-800/50 cursor-not-allowed'
                      : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                  }`}
                >
                  {cnt === TOTAL_AVAILABLE_QUESTIONS ? `Все (${cnt})` : cnt}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setIsCustomCount(true);
                if (!customQuestionCount) setCustomQuestionCount(questionCount.toString());
              }}
              className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                isCustomCount
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/30'
                  : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
              }`}
            >
              Свое число
            </button>
          </div>

          {isCustomCount && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <span className="text-xs text-slate-400">Количество:</span>
              <input
                type="number"
                min={1}
                max={maxQuestions}
                value={customQuestionCount}
                onChange={(e) => setCustomQuestionCount(e.target.value)}
                placeholder={`1 - ${maxQuestions}`}
                className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-rose-500"
              />
              <span className="text-xs text-slate-500">от 1 до {maxQuestions}</span>
            </div>
          )}
        </div>

        {/* Section 2: Time per Question */}
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Clock className="w-4 h-4 text-amber-400" />
              Время на каждый вопрос
            </label>
            <span className="text-xs text-slate-400">
              По умолчанию: <span className="text-amber-400 font-semibold">20 сек</span>
            </span>
          </div>

          {/* Quick preset buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {timePresets.map((preset) => {
              const isSelected = !isCustomTime && timeLimit === preset.val;
              return (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => handlePresetTime(preset.val)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg shadow-amber-500/20 scale-[1.02]'
                      : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/60'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsCustomTime(!isCustomTime);
                if (!customTimeLimit) setCustomTimeLimit(timeLimit > 0 ? timeLimit.toString() : '20');
              }}
              className="text-xs text-amber-400/80 hover:text-amber-400 underline underline-offset-4"
            >
              {isCustomTime ? 'Выбрать из пресетов' : 'Задать другое количество секунд'}
            </button>
          </div>

          {isCustomTime && (
            <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/60">
              <span className="text-xs text-slate-400">Секунд на вопрос:</span>
              <input
                type="number"
                min={5}
                max={300}
                value={customTimeLimit}
                onChange={(e) => setCustomTimeLimit(e.target.value)}
                placeholder="20"
                className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:outline-none focus:border-amber-400"
              />
              <span className="text-xs text-slate-500">например 25, 45, 90</span>
            </div>
          )}
        </div>

        {/* Section 3: Modes & Options */}
        <div className="space-y-3 pt-2">
          {/* Practice mistakes mode */}
          <div
            onClick={() => {
              if (hasMistakes) {
                setOnlyMistakes(!onlyMistakes);
                if (!onlyMistakes) {
                  setQuestionCount(Math.min(questionCount, userMistakes.length));
                }
              }
            }}
            className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
              !hasMistakes
                ? 'opacity-60 bg-slate-800/20 border-slate-800 cursor-not-allowed'
                : onlyMistakes
                ? 'bg-rose-500/10 border-rose-500/60 cursor-pointer'
                : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 cursor-pointer'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  onlyMistakes ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-2">
                  <span>Режим «Работа над ошибками»</span>
                  {hasMistakes && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                      {userMistakes.length} вопр.
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-slate-400">
                  {hasMistakes
                    ? 'Тестирование только по тем вопросам, в которых вы ошибались ранее'
                    : 'Ошибок в истории пока нет. Пройдите обычный тест!'}
                </p>
              </div>
            </div>

            <input
              type="checkbox"
              disabled={!hasMistakes}
              checked={onlyMistakes}
              onChange={() => {}}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 focus:ring-offset-slate-900"
            />
          </div>

          {/* Shuffle questions */}
          <div
            onClick={() => setShuffleQuestions(!shuffleQuestions)}
            className="p-3.5 rounded-2xl border border-slate-700/60 bg-slate-800/50 hover:border-slate-600 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
                <Shuffle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-slate-200">
                  Случайный порядок вопросов
                </p>
                <p className="text-[11px] text-slate-400">
                  Перемешивать вопросы при создании каждого теста
                </p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={() => {}}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900"
            />
          </div>
        </div>

        {/* Start Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleStart}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white font-extrabold text-base shadow-xl shadow-rose-900/30 flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Начать тест ({isCustomCount ? customQuestionCount || 70 : questionCount} вопросов)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
