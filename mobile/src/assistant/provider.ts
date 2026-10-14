import type { UserRole } from '../theme/colors';
import { FAQS, STARTER_IDS } from './faqs';
import { isForRole, matchFaqs, MIN_MATCH_SCORE } from './matcher';
import type { AnswerProvider, AskInput, AssistantReply, FaqEntry } from './types';

const SUPPORT_TEXT =
  "I couldn't find a ready answer for that. Pick one of the questions below, or contact our support team and a person will help you.";

const brief = (f: FaqEntry) => ({ id: f.id, question: f.question });

function toReply(faq: FaqEntry, role: UserRole, faqs: FaqEntry[]): AssistantReply {
  const related = faqs
    .filter((f) => f.id !== faq.id && f.category === faq.category && isForRole(f, role))
    .slice(0, 3)
    .map(brief);
  return {
    text: faq.answer,
    steps: faq.steps,
    tips: faq.tips,
    action: faq.action,
    suggestions: related,
    matched: true,
  };
}

/** Offline, free provider: answers come from the curated list in faqs.ts. */
export function createFaqProvider(faqs: FaqEntry[] = FAQS, starterIds: string[] = STARTER_IDS): AnswerProvider {
  return {
    starters(role) {
      const picks = starterIds
        .map((id) => faqs.find((f) => f.id === id))
        .filter((f): f is FaqEntry => !!f && isForRole(f, role));
      return picks.map(brief);
    },

    async ask({ text, faqId, role }: AskInput): Promise<AssistantReply> {
      if (faqId) {
        const faq = faqs.find((f) => f.id === faqId);
        if (faq) return toReply(faq, role, faqs);
      }

      const matches = matchFaqs(text ?? '', faqs, role, 3);
      const top = matches[0];
      if (top && top.score >= MIN_MATCH_SCORE) {
        const reply = toReply(top.faq, role, faqs);
        // Offer the runner-up matches first; they're likelier to be what was meant if this one isn't.
        const others = matches.slice(1).map((m) => brief(m.faq));
        reply.suggestions = [...others, ...reply.suggestions.filter((s) => !others.some((o) => o.id === s.id))].slice(0, 3);
        return reply;
      }

      return {
        text: SUPPORT_TEXT,
        suggestions: matches.map((m) => brief(m.faq)),
        matched: false,
      };
    },
  };
}

/**
 * The provider the screen uses. To add a real AI later, build a provider that calls the
 * backend (and falls back to createFaqProvider() when offline or when it has no answer)
 * and export it here.
 */
export const assistant: AnswerProvider = createFaqProvider();
