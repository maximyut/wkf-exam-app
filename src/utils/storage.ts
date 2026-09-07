import type { UserProfile, TestResult } from '../types';

const STORAGE_KEY_USERS = 'wkf_exam_users_v1';
const STORAGE_KEY_ACTIVE_USER = 'wkf_exam_active_user_v1';
const STORAGE_KEY_HISTORY = 'wkf_exam_history_v1';
const STORAGE_KEY_SETTINGS = 'wkf_exam_settings_v1';

export interface AppSettings {
  soundEnabled: boolean;
  theme: 'dark' | 'light';
}

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  theme: 'dark',
};

// --- Users ---

export function getUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (!raw) {
      const defaultUser: UserProfile = {
        id: 'user_default',
        name: 'Судья',
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      saveUsers([defaultUser]);
      setActiveUserId(defaultUser.id);
      return [defaultUser];
    }
    const users: UserProfile[] = JSON.parse(raw);
    return users.length > 0 ? users : [];
  } catch (e) {
    console.error('Error reading users from storage:', e);
    return [];
  }
}

export function saveUsers(users: UserProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to storage:', e);
  }
}

export function getActiveUserId(): string {
  const users = getUsers();
  const savedActive = localStorage.getItem(STORAGE_KEY_ACTIVE_USER);
  if (savedActive && users.some((u) => u.id === savedActive)) {
    return savedActive;
  }
  if (users.length > 0) {
    setActiveUserId(users[0].id);
    return users[0].id;
  }
  const defaultUser: UserProfile = {
    id: 'user_default',
    name: 'Судья',
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  saveUsers([defaultUser]);
  setActiveUserId(defaultUser.id);
  return defaultUser.id;
}

export function setActiveUserId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIVE_USER, id);
    const users = getUsers();
    const updated = users.map((u) => (u.id === id ? { ...u, lastActiveAt: Date.now() } : u));
    saveUsers(updated);
  } catch (e) {
    console.error('Error setting active user:', e);
  }
}

export function getActiveUser(): UserProfile {
  const users = getUsers();
  const activeId = getActiveUserId();
  return users.find((u) => u.id === activeId) || users[0];
}

export function createUser(name: string): UserProfile {
  const users = getUsers();
  const trimmed = name.trim() || ('Судья ' + (users.length + 1));
  const newUser: UserProfile = {
    id: 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: trimmed,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };
  users.push(newUser);
  saveUsers(users);
  setActiveUserId(newUser.id);
  return newUser;
}

export function deleteUser(userId: string): void {
  let users = getUsers();
  if (users.length <= 1) return; // Keep at least one user
  users = users.filter((u) => u.id !== userId);
  saveUsers(users);

  // Also remove this user's test history
  const allHistory = getAllHistory().filter((h) => h.userId !== userId);
  saveAllHistory(allHistory);

  if (getActiveUserId() === userId) {
    setActiveUserId(users[0].id);
  }
}

// --- History ---

export function getAllHistory(): TestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading history:', e);
    return [];
  }
}

export function saveAllHistory(history: TestResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving history:', e);
  }
}

export function getUserHistory(userId?: string): TestResult[] {
  const targetId = userId || getActiveUserId();
  const all = getAllHistory();
  return all
    .filter((h) => h.userId === targetId)
    .sort((a, b) => b.timestamp - a.timestamp);
}

export function saveTestResult(result: TestResult): void {
  const all = getAllHistory();
  all.unshift(result);
  saveAllHistory(all);
}

export function deleteTestResult(testId: string): void {
  const all = getAllHistory().filter((h) => h.id !== testId);
  saveAllHistory(all);
}

export function clearUserHistory(userId?: string): void {
  const targetId = userId || getActiveUserId();
  const remaining = getAllHistory().filter((h) => h.userId !== targetId);
  saveAllHistory(remaining);
}

// --- Mistakes Query ---

export function getUserMistakeQuestionIds(userId?: string): number[] {
  const history = getUserHistory(userId);
  const mistakeCountMap = new Map<number, number>();

  for (const test of history) {
    for (const rec of test.records) {
      if (!rec.isCorrect) {
        mistakeCountMap.set(rec.questionId, (mistakeCountMap.get(rec.questionId) || 0) + 1);
      }
    }
  }

  return Array.from(mistakeCountMap.keys());
}

// --- User Stats ---

export interface UserStatistics {
  totalTests: number;
  totalQuestionsAnswered: number;
  totalCorrect: number;
  overallAccuracy: number;
  averageScore: number;
  bestScore: number;
  testsPassed: number;
  passRate: number;
}

export function getUserStats(userId?: string): UserStatistics {
  const history = getUserHistory(userId);
  if (history.length === 0) {
    return {
      totalTests: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      overallAccuracy: 0,
      averageScore: 0,
      bestScore: 0,
      testsPassed: 0,
      passRate: 0,
    };
  }

  let totalQuestions = 0;
  let totalCorrect = 0;
  let scoreSum = 0;
  let bestScore = 0;
  let passedCount = 0;

  for (const t of history) {
    totalQuestions += t.totalQuestions;
    totalCorrect += t.correctAnswersCount;
    scoreSum += t.scorePercentage;
    if (t.scorePercentage > bestScore) bestScore = t.scorePercentage;
    if (t.passed) passedCount++;
  }

  return {
    totalTests: history.length,
    totalQuestionsAnswered: totalQuestions,
    totalCorrect,
    overallAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    averageScore: Math.round(scoreSum / history.length),
    bestScore: Math.round(bestScore),
    testsPassed: passedCount,
    passRate: Math.round((passedCount / history.length) * 100),
  };
}

// --- Settings ---

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error loading settings:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Partial<AppSettings>): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
  return updated;
}
