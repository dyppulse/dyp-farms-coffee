import type { UserRole } from '../theme/colors';

export type FaqCategoryId =
  | 'start'
  | 'farm'
  | 'weather'
  | 'finance'
  | 'wallet'
  | 'market'
  | 'tours'
  | 'orders'
  | 'account';

export interface FaqCategory {
  id: FaqCategoryId;
  title: string;
  icon: string; // Ionicons glyph name
}

export interface FaqAction {
  label: string;
  /** An Expo Router path. */
  path: string;
}

export interface FaqEntry {
  id: string;
  category: FaqCategoryId;
  /** Roles this entry is relevant for. Omit for everyone. */
  roles?: UserRole[];
  question: string;
  /** Extra words people might use. Matched on top of the question text. */
  keywords: string[];
  /** One or two sentence answer, shown first. */
  answer: string;
  /** Numbered how-to steps, shown under the answer. */
  steps?: string[];
  tips?: string[];
  /** A button that opens the relevant screen. */
  action?: FaqAction;
}

/** What the screen needs to render a reply, whoever produced it. */
export interface AssistantReply {
  text: string;
  steps?: string[];
  tips?: string[];
  action?: FaqAction;
  /** Related questions to offer as follow-up chips. */
  suggestions: Array<{ id: string; question: string }>;
  /** False when nothing matched: the screen shows the contact-support path. */
  matched: boolean;
}

export interface AskInput {
  /** Free text typed by the user. */
  text?: string;
  /** Set when the user tapped a suggested question. */
  faqId?: string;
  role: UserRole;
}

/**
 * The seam for a smarter assistant. The screen only talks to this interface, so an
 * LLM-backed provider (calling the backend /ai endpoint) can replace or wrap the FAQ
 * provider without touching the UI.
 */
export interface AnswerProvider {
  /** Questions to show up front for a role. */
  starters(role: UserRole): Array<{ id: string; question: string }>;
  ask(input: AskInput): Promise<AssistantReply>;
}
