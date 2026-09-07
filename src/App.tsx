import React, { useState } from 'react';
import type { UserProfile, TestConfig, Question, TestResult, QuestionAnswerRecord } from './types';
import { QUESTIONS_DATA } from './data/questions';
import {
  getActiveUser,
  saveTestResult,
  getSettings,
  saveSettings,
  getUserMistakeQuestionIds,
} from './utils/storage';
import { Header } from './components/Header';
import { UserModal } from './components/UserModal';
import { TestSetupModal } from './components/TestSetupModal';
import { ActiveTest } from './components/ActiveTest';
import { TestResults } from './components/TestResults';
import { UserHistoryView } from './components/UserHistoryView';

type ViewMode = 'setup' | 'test' | 'results' | 'history';

export const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<UserProfile>(getActiveUser());
  const [currentView, setCurrentView] = useState<ViewMode>('setup');
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  const [settings, setSettingsState] = useState(getSettings());
  const soundEnabled = settings.soundEnabled;

  const [activeConfig, setActiveConfig] = useState<TestConfig | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);

  const handleToggleSound = () => {
    const updated = saveSettings({ soundEnabled: !soundEnabled });
    setSettingsState(updated);
  };

  const handleUserChanged = (newUser: UserProfile) => {
    setActiveUser(newUser);
  };

  // Prepare questions and start test
  const handleStartTest = (config: TestConfig) => {
    let pool: Question[] = [...QUESTIONS_DATA];

    // If "only mistakes" mode
    if (config.onlyMistakesMode) {
      const mistakeIds = getUserMistakeQuestionIds(activeUser.id);
      const mistakeSet = new Set(mistakeIds);
      pool = pool.filter((q) => mistakeSet.has(q.id));
      if (pool.length === 0) {
        pool = [...QUESTIONS_DATA]; // fallback
      }
    }

    // Shuffle if enabled
    if (config.shuffleQuestions) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    // Take requested count (default 70)
    const selected = pool.slice(0, Math.min(config.questionCount, pool.length));

    setActiveConfig(config);
    setTestQuestions(selected);
    setCurrentView('test');
  };

  // Test finished
  const handleFinishTest = (records: QuestionAnswerRecord[], durationSeconds: number) => {
    if (!activeConfig) return;

    const total = records.length;
    const correctCount = records.filter((r) => r.isCorrect).length;
    const incorrectCount = records.filter((r) => !r.isCorrect && r.userAnswer !== 'timeout').length;
    const timeoutCount = records.filter((r) => r.userAnswer === 'timeout').length;
    const scorePct = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const passed = scorePct >= 90; // WKF referee official passing standard

    const result: TestResult = {
      id: 'test_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      userId: activeUser.id,
      userName: activeUser.name,
      timestamp: Date.now(),
      config: activeConfig,
      totalQuestions: total,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      timeoutAnswersCount: timeoutCount,
      scorePercentage: scorePct,
      passed,
      records,
      totalDurationSeconds: durationSeconds,
    };

    saveTestResult(result);
    setLatestResult(result);
    setCurrentView('results');
  };

  // Retake failed questions from current test
  const handleRetakeMistakes = (questionIds: number[]) => {
    const idSet = new Set(questionIds);
    const pool = QUESTIONS_DATA.filter((q) => idSet.has(q.id));

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const config: TestConfig = {
      questionCount: pool.length,
      timeLimitPerQuestion: activeConfig ? activeConfig.timeLimitPerQuestion : 20,
      onlyMistakesMode: true,
      shuffleQuestions: true,
      soundEnabled,
    };

    setActiveConfig(config);
    setTestQuestions(pool);
    setCurrentView('test');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        activeUser={activeUser}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'setup' && (
          <TestSetupModal
            activeUser={activeUser}
            onStartTest={handleStartTest}
            onOpenUserModal={() => setIsUserModalOpen(true)}
          />
        )}

        {currentView === 'test' && (
          <ActiveTest
            questions={testQuestions}
            config={activeConfig!}
            soundEnabled={soundEnabled}
            onFinishTest={handleFinishTest}
            onCancelTest={() => setCurrentView('setup')}
          />
        )}

        {currentView === 'results' && latestResult && (
          <TestResults
            result={latestResult}
            soundEnabled={soundEnabled}
            onRetakeTest={() => setCurrentView('setup')}
            onRetakeMistakes={handleRetakeMistakes}
            onNavigateToHistory={() => setCurrentView('history')}
          />
        )}

        {currentView === 'history' && (
          <UserHistoryView
            activeUser={activeUser}
            onRetakeTest={() => setCurrentView('setup')}
            onRetakeMistakes={handleRetakeMistakes}
            onBackToSetup={() => setCurrentView('setup')}
          />
        )}
      </main>

      {/* User Management Modal */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        activeUser={activeUser}
        onUserChanged={handleUserChanged}
      />
    </div>
  );
};

export default App;
