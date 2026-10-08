import React, { useState, useEffect } from 'react';
import type {
  UserProfile,
  TestConfig,
  Question,
  TestResult,
  QuestionAnswerRecord,
  Discipline,
  Language,
  ViewMode,
} from './types';
import {
  INITIAL_KUMITE_QUESTIONS,
  INITIAL_KATA_QUESTIONS,
  loadQuestions,
  parseQuestionsList,
} from './data/questions';
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
import { AnswersView } from './components/AnswersView';
import { RulesView } from './components/RulesView';
import { ExplanationModal } from './components/ExplanationModal';

export const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<UserProfile>(getActiveUser());
  const [settings, setSettingsState] = useState(getSettings());
  const [activeDiscipline, setActiveDiscipline] = useState<Discipline>(settings.discipline || 'kumite');
  const [language, setLanguage] = useState<Language>(settings.language || 'ru');
  const [currentView, setCurrentView] = useState<ViewMode>('setup');
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);

  // Dynamic questions list loaded per discipline with bundled fallback
  const initialData = activeDiscipline === 'kata' ? INITIAL_KATA_QUESTIONS : INITIAL_KUMITE_QUESTIONS;
  const [allQuestions, setAllQuestions] = useState<Question[]>(initialData);

  const soundEnabled = settings.soundEnabled;

  const [activeConfig, setActiveConfig] = useState<TestConfig | null>(null);
  const [testQuestions, setTestQuestions] = useState<Question[]>([]);
  const [latestResult, setLatestResult] = useState<TestResult | null>(null);

  // For Rules deep-linking from questions / answers / modals
  const [rulesTargetQuery, setRulesTargetQuery] = useState<string | null>(null);

  // For Explanation modal from Answers directory
  const [answersModalRecord, setAnswersModalRecord] = useState<QuestionAnswerRecord | null>(null);

  // Load questions whenever activeDiscipline changes
  useEffect(() => {
    let cancelled = false;
    loadQuestions(activeDiscipline).then((loaded) => {
      if (cancelled) return;
      if (loaded && loaded.length > 0) {
        setAllQuestions(loaded);
      } else {
        setAllQuestions(activeDiscipline === 'kata' ? INITIAL_KATA_QUESTIONS : INITIAL_KUMITE_QUESTIONS);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [activeDiscipline]);

  const handleToggleSound = () => {
    const updated = saveSettings({ soundEnabled: !soundEnabled });
    setSettingsState(updated);
  };

  const handleSelectDiscipline = (disc: Discipline) => {
    if (disc === activeDiscipline) return;
    saveSettings({ discipline: disc });
    setActiveDiscipline(disc);
  };

  const handleToggleLanguage = () => {
    const nextLang: Language = language === 'ru' ? 'en' : 'ru';
    saveSettings({ language: nextLang });
    setLanguage(nextLang);
  };

  const handleUserChanged = (newUser: UserProfile) => {
    setActiveUser(newUser);
  };

  const handleOpenRules = (ruleRef?: string) => {
    setRulesTargetQuery(ruleRef || null);
    setCurrentView('rules');
  };

  // Optional: load data from custom json file selected by user
  const handleCustomJsonLoaded = (customQuestions: unknown[]) => {
    const parsed = parseQuestionsList(customQuestions);
    if (parsed.length > 0) {
      setAllQuestions(parsed);
      alert(`Успешно загружено ${parsed.length} вопросов!`);
    }
  };

  // Prepare questions and start test
  const handleStartTest = (config: TestConfig) => {
    let pool: Question[] = [...allQuestions];

    // If "only mistakes" mode
    if (config.onlyMistakesMode) {
      const mistakeIds = getUserMistakeQuestionIds(activeUser.id, config.discipline);
      const mistakeSet = new Set(mistakeIds);
      pool = pool.filter((q) => mistakeSet.has(q.id));
      if (pool.length === 0) {
        pool = [...allQuestions]; // fallback
      }
    }

    // Shuffle if enabled
    if (config.shuffleQuestions) {
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
    }

    // Take requested count
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
      discipline: activeConfig.discipline,
      language: activeConfig.language,
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
    const pool = allQuestions.filter((q) => idSet.has(q.id));

    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const config: TestConfig = {
      discipline: activeDiscipline,
      language: language,
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

  // Open explanation from Answers directory
  const handleOpenAnswersExplanation = (q: Question) => {
    const record: QuestionAnswerRecord = {
      questionId: q.id,
      discipline: q.discipline,
      questionText: language === 'ru' && q.questionRu ? q.questionRu : (q.questionEn || q.question),
      questionTextEn: q.questionEn || q.question,
      questionTextRu: q.questionRu,
      userAnswer: q.answer ? 'true' : 'false',
      correctAnswer: q.answer,
      isCorrect: true,
      timeSpentSeconds: 0,
      ruleArticle: q.ruleArticle,
      ruleArticleEn: q.ruleArticleEn,
      ruleQuote: q.ruleQuote,
      ruleQuoteRu: q.ruleQuoteRu,
      explanation: q.explanation,
      explanationEn: q.explanationEn,
      votes: q.votes,
    };
    setAnswersModalRecord(record);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Header */}
      <Header
        activeUser={activeUser}
        discipline={activeDiscipline}
        language={language}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSelectDiscipline={handleSelectDiscipline}
        onToggleLanguage={handleToggleLanguage}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onNavigate={(view) => setCurrentView(view)}
        currentView={currentView}
      />

      {/* Main Content Area */}
      <main className={`flex-1 ${currentView !== 'test' ? 'pb-24 md:pb-8' : 'pb-8'} safe-content`}>
        {currentView === 'setup' && (
          <TestSetupModal
            activeUser={activeUser}
            discipline={activeDiscipline}
            language={language}
            totalAvailableQuestions={allQuestions.length}
            onStartTest={handleStartTest}
            onOpenUserModal={() => setIsUserModalOpen(true)}
            onCustomDataLoaded={handleCustomJsonLoaded}
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
            discipline={activeDiscipline}
            language={language}
            soundEnabled={soundEnabled}
            onRetakeTest={() => setCurrentView('setup')}
            onRetakeMistakes={handleRetakeMistakes}
            onNavigateToHistory={() => setCurrentView('history')}
            onOpenRules={handleOpenRules}
          />
        )}

        {currentView === 'history' && (
          <UserHistoryView
            activeUser={activeUser}
            discipline={activeDiscipline}
            language={language}
            onRetakeTest={() => setCurrentView('setup')}
            onRetakeMistakes={handleRetakeMistakes}
            onBackToSetup={() => setCurrentView('setup')}
            onOpenRules={handleOpenRules}
          />
        )}

        {currentView === 'answers' && (
          <AnswersView
            questions={allQuestions}
            discipline={activeDiscipline}
            language={language}
            onOpenExplanation={handleOpenAnswersExplanation}
            onOpenRules={handleOpenRules}
            onToggleLanguage={handleToggleLanguage}
          />
        )}

        {currentView === 'rules' && (
          <RulesView
            discipline={activeDiscipline}
            language={language}
            targetRuleQuery={rulesTargetQuery}
            onSelectDiscipline={handleSelectDiscipline}
            onToggleLanguage={handleToggleLanguage}
          />
        )}
      </main>

      {/* Answers Directory Modal */}
      <ExplanationModal
        record={answersModalRecord}
        isOpen={!!answersModalRecord}
        onClose={() => setAnswersModalRecord(null)}
        language={language}
        onOpenRules={handleOpenRules}
      />

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
