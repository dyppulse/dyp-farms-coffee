import type { UserRole } from '../theme/colors';
import type { FaqEntry } from './types';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'am', 'do', 'does', 'did', 'can', 'could', 'would', 'should',
  'i', 'me', 'my', 'we', 'you', 'your', 'it', 'its', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
  'how', 'what', 'where', 'when', 'why', 'which', 'who', 'please', 'want', 'need', 'help', 'with',
  'this', 'that', 'about', 'app', 'use', 'get', 'make', 'be', 'have', 'there', 'any',
]);

/** Cheap suffix stripping so "bidding", "bids" and "bid" meet in the middle. */
function stem(word: string): string {
  let w = word;
  if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
  else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
  else if (w.length > 4 && w.endsWith('ies')) w = `${w.slice(0, -3)}y`;
  else if (w.length > 3 && w.endsWith('es') && /(s|x|ch|sh)es$/.test(w)) w = w.slice(0, -2);
  else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  // "bidding" -> "bidd" -> "bid"
  if (w.length > 3 && /([^aeiou])\1$/.test(w)) w = w.slice(0, -1);
  return w;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

export interface FaqMatch {
  faq: FaqEntry;
  score: number;
}

/** Below this the best candidate is a guess, so we redirect instead of answering. */
export const MIN_MATCH_SCORE = 3;

const QUESTION_WEIGHT = 2;
const KEYWORD_WEIGHT = 3;
const PHRASE_BONUS = 2;
const ROLE_BONUS = 0.5;

export function isForRole(faq: FaqEntry, role: UserRole): boolean {
  return !faq.roles || faq.roles.includes(role);
}

function scoreFaq(queryTokens: string[], queryText: string, faq: FaqEntry, role: UserRole): number {
  const querySet = new Set(queryTokens);
  const questionTokens = new Set(tokenize(faq.question));
  const keywordTokens = new Set(faq.keywords.flatMap(tokenize));

  let score = 0;
  for (const t of querySet) {
    if (keywordTokens.has(t)) score += KEYWORD_WEIGHT;
    else if (questionTokens.has(t)) score += QUESTION_WEIGHT;
  }
  if (score === 0) return 0;

  // A multi-word keyword appearing verbatim ("boundary", "mobile money", "auto bid") is a strong signal.
  const normalized = queryText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  for (const kw of faq.keywords) {
    if (kw.includes(' ') && normalized.includes(kw.toLowerCase())) score += PHRASE_BONUS;
  }

  if (faq.roles && faq.roles.includes(role)) score += ROLE_BONUS;
  return score;
}

/**
 * Rank FAQs against free text. Entries meant for other roles are excluded unless nothing
 * for the user's own role matches, so a tourist asking about "auction" still gets an answer.
 */
export function matchFaqs(query: string, faqs: FaqEntry[], role: UserRole, limit = 3): FaqMatch[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const rank = (pool: FaqEntry[]) =>
    pool
      .map((faq) => ({ faq, score: scoreFaq(tokens, query, faq, role) }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

  const own = rank(faqs.filter((f) => isForRole(f, role)));
  if (own.length > 0 && own[0].score >= MIN_MATCH_SCORE) return own;
  const all = rank(faqs);
  return all.length > 0 ? all : own;
}

export function bestMatch(query: string, faqs: FaqEntry[], role: UserRole): FaqMatch | null {
  const [top] = matchFaqs(query, faqs, role, 1);
  return top && top.score >= MIN_MATCH_SCORE ? top : null;
}
