import type { Question, Discipline, Language } from '../types';
import rawKumiteData from './kumite.json';
import rawKataData from './kata.json';

export function normalizeAnswer(ans: unknown): boolean {
  if (typeof ans === 'boolean') return ans;
  if (typeof ans === 'string') {
    const s = ans.trim().toLowerCase();
    return s === 'true' || s === 'верно' || s === '1' || s === 'yes' || s === 'да' || s === 't';
  }
  return Boolean(ans);
}

interface RawQuestionItem {
  id?: number;
  discipline?: Discipline;
  question: string;
  questionEn?: string;
  questionRu?: string;
  answer?: unknown;
  correctAnswer?: unknown;
  ruleArticle?: string;
  ruleArticleEn?: string;
  ruleQuote?: string;
  ruleQuoteRu?: string;
  explanation?: string;
  explanationEn?: string;
  votes?: {
    chatgpt?: string;
    claude?: string;
    deepseek?: string;
    gemini?: string;
    instagram?: string;
    trueCount?: number;
    falseCount?: number;
  };
}

export function parseQuestionsList(data: unknown[], fallbackDiscipline: Discipline = 'kumite'): Question[] {
  return (data as RawQuestionItem[]).map((item, index) => ({
    id: typeof item.id === 'number' ? item.id : index + 1,
    discipline: item.discipline || fallbackDiscipline,
    question: item.question || item.questionEn || '',
    questionEn: item.questionEn || item.question || '',
    questionRu: item.questionRu || item.question || '',
    answer: normalizeAnswer(item.answer !== undefined ? item.answer : item.correctAnswer),
    ruleArticle: item.ruleArticle,
    ruleArticleEn: item.ruleArticleEn || item.ruleArticle,
    ruleQuote: item.ruleQuote,
    ruleQuoteRu: item.ruleQuoteRu,
    explanation: item.explanation,
    explanationEn: item.explanationEn,
    votes: item.votes,
  }));
}

// Initial/fallback bundled data
export const INITIAL_KUMITE_QUESTIONS: Question[] = parseQuestionsList(rawKumiteData, 'kumite');
export const INITIAL_KATA_QUESTIONS: Question[] = parseQuestionsList(rawKataData, 'kata');

// Backwards compatibility alias
export const INITIAL_QUESTIONS: Question[] = INITIAL_KUMITE_QUESTIONS;
export const TOTAL_AVAILABLE_QUESTIONS = INITIAL_KUMITE_QUESTIONS.length;

// Asynchronously load questions for a specific discipline
export async function loadQuestions(discipline: Discipline = 'kumite'): Promise<Question[]> {
  const filePath = discipline === 'kata' ? '/data/kata.json' : '/data/kumite.json';
  const fallback = discipline === 'kata' ? INITIAL_KATA_QUESTIONS : INITIAL_KUMITE_QUESTIONS;

  try {
    const response = await fetch(filePath, { cache: 'no-cache' });
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        return parseQuestionsList(json, discipline);
      }
    }
  } catch (err) {
    console.warn(`Unable to fetch ${filePath} dynamically, falling back to bundled dataset:`, err);
  }

  return fallback;
}

// Bilingual text helpers
export function getQuestionText(q: Question, lang: Language): string {
  if (lang === 'ru') {
    return q.questionRu || q.question;
  }
  return q.questionEn || q.question;
}

export function getExplanationText(q: Question, lang: Language): string {
  if (lang === 'en' && q.explanationEn) {
    return q.explanationEn;
  }
  return q.explanation || '';
}

export function getRuleArticleText(q: Question, lang: Language): string {
  if (lang === 'en' && q.ruleArticleEn) {
    return q.ruleArticleEn;
  }
  return q.ruleArticle || '';
}

