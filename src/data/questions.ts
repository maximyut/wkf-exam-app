import type { Question } from '../types';
import rawData from './data.json';

export function normalizeAnswer(ans: unknown): boolean {
  if (typeof ans === 'boolean') return ans;
  if (typeof ans === 'string') {
    const s = ans.trim().toLowerCase();
    return s === 'true' || s === 'верно' || s === '1' || s === 'yes' || s === 'да';
  }
  return Boolean(ans);
}

interface RawQuestionItem {
  id?: number;
  question: string;
  answer?: unknown;
  correctAnswer?: unknown;
}

export function parseQuestionsList(data: unknown[]): Question[] {
  return (data as RawQuestionItem[]).map((item, index) => ({
    id: typeof item.id === 'number' ? item.id : index + 1,
    question: item.question || '',
    answer: normalizeAnswer(item.answer !== undefined ? item.answer : item.correctAnswer),
  }));
}

// Initial/fallback bundled data
export const INITIAL_QUESTIONS: Question[] = parseQuestionsList(rawData);
export const TOTAL_AVAILABLE_QUESTIONS = INITIAL_QUESTIONS.length;

// Asynchronously load public/data.json at runtime so changes to data.json are immediately picked up
export async function loadQuestions(): Promise<Question[]> {
  try {
    const response = await fetch('/data.json', { cache: 'no-cache' });
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json) && json.length > 0) {
        return parseQuestionsList(json);
      }
    }
  } catch (err) {
    console.warn('Unable to fetch /data.json dynamically, falling back to bundled dataset:', err);
  }
  return INITIAL_QUESTIONS;
}
