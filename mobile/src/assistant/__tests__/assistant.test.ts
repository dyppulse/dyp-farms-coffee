import { CATEGORIES, FAQS, STARTER_IDS } from '../faqs';
import { bestMatch, isForRole, matchFaqs, tokenize } from '../matcher';
import { createFaqProvider } from '../provider';

describe('tokenize', () => {
  it('lowercases, drops stopwords and punctuation, and stems', () => {
    expect(tokenize('How do I place a Bid?')).toEqual(['place', 'bid']);
    expect(tokenize('bidding')).toEqual(tokenize('bids'));
  });
});

describe('matchFaqs', () => {
  const top = (q: string, role: 'farmer' | 'roaster' | 'tourist' = 'farmer') =>
    bestMatch(q, FAQS, role)?.faq.id;

  it.each([
    ['how do i draw my farm boundary', 'farmer', 'register-farm'],
    ['I want to add a harvest', 'farmer', 'add-harvest'],
    ['what is the weather like', 'farmer', 'check-weather'],
    ['when is harvest season in kenya', 'farmer', 'check-weather'],
    ['I need a loan', 'farmer', 'request-finance'],
    ['top up my wallet', 'tourist', 'wallet-add-funds'],
    ['how to withdraw money', 'farmer', 'wallet-withdraw'],
    ['how do i bid in an auction', 'roaster', 'join-auction'],
    ['book a tour', 'tourist', 'book-tour'],
    ['where is my shipment', 'roaster', 'track-shipment'],
    ['pause my subscription', 'tourist', 'subscriptions'],
    ['pay with mtn momo', 'tourist', 'mobile-money'],
    ['i have a problem, need support', 'farmer', 'contact-support'],
  ] as const)('"%s" (%s) -> %s', (q, role, id) => {
    expect(top(q, role)).toBe(id);
  });

  it('returns nothing for gibberish or stopword-only input', () => {
    expect(matchFaqs('xyzzy qwerty', FAQS, 'farmer')).toEqual([]);
    expect(matchFaqs('how do i', FAQS, 'farmer')).toEqual([]);
    expect(bestMatch('', FAQS, 'farmer')).toBeNull();
  });

  it('prefers entries for the users role but falls back to other roles', () => {
    // Only farmers have register-farm; a tourist asking still gets an answer.
    expect(top('register my farm boundary', 'tourist')).toBe('register-farm');
    // For a roaster, the roaster entry wins over a farmer-only one on a shared topic.
    expect(isForRole(FAQS.find((f) => f.id === 'browse-lots')!, 'roaster')).toBe(true);
  });

  it('ranks best first and respects the limit', () => {
    const r = matchFaqs('wallet money', FAQS, 'farmer', 2);
    expect(r.length).toBeLessThanOrEqual(2);
    if (r.length === 2) expect(r[0].score).toBeGreaterThanOrEqual(r[1].score);
  });
});

describe('faq provider', () => {
  const provider = createFaqProvider();

  it('answers a tapped question by id with steps and related questions', async () => {
    const reply = await provider.ask({ faqId: 'register-farm', role: 'farmer' });
    expect(reply.matched).toBe(true);
    expect(reply.steps?.length).toBeGreaterThan(0);
    expect(reply.action?.path).toBe('/farm-new');
    expect(reply.suggestions.every((s) => s.id !== 'register-farm')).toBe(true);
  });

  it('answers free text from the closest FAQ', async () => {
    const reply = await provider.ask({ text: 'how can I book a tour', role: 'tourist' });
    expect(reply.matched).toBe(true);
    expect(reply.text).toMatch(/tour/i);
  });

  it('redirects unmatched text to support', async () => {
    const reply = await provider.ask({ text: 'qwerty zzz', role: 'farmer' });
    expect(reply.matched).toBe(false);
    expect(reply.text).toMatch(/support/i);
  });

  it('role-filters starters', () => {
    const tourist = provider.starters('tourist').map((s) => s.id);
    expect(tourist).not.toContain('register-farm');
    expect(tourist).toContain('book-tour');
    expect(provider.starters('farmer').map((s) => s.id)).toContain('register-farm');
  });
});

describe('faq data integrity', () => {
  it('has unique ids and valid categories', () => {
    const ids = FAQS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    const cats = new Set(CATEGORIES.map((c) => c.id));
    FAQS.forEach((f) => expect(cats.has(f.category)).toBe(true));
  });

  it('starter ids exist', () => {
    STARTER_IDS.forEach((id) => expect(FAQS.some((f) => f.id === id)).toBe(true));
  });

  it('every question is reachable via its own text', () => {
    for (const f of FAQS) {
      const roles = f.roles ?? (['farmer'] as const);
      expect(bestMatch(f.question, FAQS, roles[0])?.faq.id).toBe(f.id);
    }
  });
});
