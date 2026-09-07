export interface Question {
  id: number;
  question: string;
  answer: boolean; // true = True (Верно), false = False (Ложно)
}

export interface TestConfig {
  questionCount: number;
  timeLimitPerQuestion: number; // seconds, 0 = no limit
  onlyMistakesMode: boolean;
  shuffleQuestions: boolean;
  soundEnabled: boolean;
}

export type AnswerChoice = 'true' | 'false' | 'timeout';

export interface QuestionAnswerRecord {
  questionId: number;
  questionText: string;
  userAnswer: AnswerChoice;
  correctAnswer: boolean;
  isCorrect: boolean;
  timeSpentSeconds: number;
}

export interface TestResult {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  config: TestConfig;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  timeoutAnswersCount: number;
  scorePercentage: number;
  passed: boolean;
  records: QuestionAnswerRecord[];
  totalDurationSeconds: number;
}

export interface UserProfile {
  id: string;
  name: string;
  createdAt: number;
  lastActiveAt: number;
}
