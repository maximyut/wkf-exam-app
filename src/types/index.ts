export type Discipline = 'kumite' | 'kata';
export type Language = 'ru' | 'en';
export type ViewMode = 'setup' | 'test' | 'results' | 'history' | 'answers' | 'rules';

export interface AIVotes {
  chatgpt?: string;
  claude?: string;
  deepseek?: string;
  gemini?: string;
  instagram?: string;
  trueCount?: number;
  falseCount?: number;
}

export interface Question {
  id: number;
  discipline: Discipline;
  question: string; // Default English text
  questionEn?: string;
  questionRu?: string;
  answer: boolean; // true = True (Верно), false = False (Ложно)
  ruleArticle?: string;
  ruleArticleEn?: string;
  ruleQuote?: string;
  ruleQuoteRu?: string;
  explanation?: string;
  explanationEn?: string;
  votes?: AIVotes;
}

export interface TestConfig {
  discipline: Discipline;
  language: Language;
  questionCount: number;
  timeLimitPerQuestion: number; // seconds, 0 = no limit
  onlyMistakesMode: boolean;
  shuffleQuestions: boolean;
  soundEnabled: boolean;
}

export type AnswerChoice = 'true' | 'false' | 'timeout';

export interface QuestionAnswerRecord {
  questionId: number;
  discipline?: Discipline;
  questionText: string;
  questionTextEn?: string;
  questionTextRu?: string;
  userAnswer: AnswerChoice;
  correctAnswer: boolean;
  isCorrect: boolean;
  timeSpentSeconds: number;
  ruleArticle?: string;
  ruleArticleEn?: string;
  ruleQuote?: string;
  ruleQuoteRu?: string;
  explanation?: string;
  explanationEn?: string;
  votes?: AIVotes;
}

export interface TestResult {
  id: string;
  userId: string;
  userName: string;
  timestamp: number;
  discipline?: Discipline;
  language?: Language;
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

// Rules types
export interface RuleSection {
  id: string; // e.g. "2.2.1a" or "5.7.6"
  code?: string; // e.g. "KR 2.2.1a" or "PR 4.6.11"
  title?: string;
  titleRu?: string;
  titleEn?: string;
  contentEn: string;
  contentRu: string;
}

export interface RuleArticle {
  id: string; // e.g. "article-2"
  number: number | string; // e.g. 2 or "Appendix 1"
  titleEn: string;
  titleRu: string;
  sections: RuleSection[];
}

export interface RuleBook {
  id: string;
  discipline: Discipline | 'para-kata';
  titleEn: string;
  titleRu: string;
  version: string;
  articles: RuleArticle[];
}

